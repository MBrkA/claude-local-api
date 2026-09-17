import type { Response } from "express";
import { runClaudeComplete, streamClaude } from "@/core/claude";
import type { ClaudeCompleteRequest, ClaudeCompleteResponse, ClaudeStreamRequest } from "@v1/schemas/claude.schema";

export async function complete(body: ClaudeCompleteRequest): Promise<ClaudeCompleteResponse> {
  const { format, timeoutMs, ...options } = body;
  const { result, durationMs } = await runClaudeComplete({ ...options, format, timeoutMs });
  return { success: true, format, result, durationMs };
}

/**
 * Writes directly to `res` and ends the response; createHandler skips the
 * automatic `res.json()` once it sees headers have already been sent.
 */
export async function stream(body: ClaudeStreamRequest, res: Response): Promise<void> {
  const { format, ...options } = body;

  return new Promise((resolve) => {
    if (format === "sse") {
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
    } else if (format === "ndjson") {
      res.setHeader("Content-Type", "application/x-ndjson");
    } else {
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
    }
    res.flushHeaders();

    const { kill } = streamClaude(options, {
      onTextChunk: (text) => {
        if (format === "text") res.write(text);
      },
      onEvent: (event, rawLine) => {
        if (format === "ndjson") res.write(`${rawLine}\n`);
        if (format === "sse") res.write(`data: ${JSON.stringify(event)}\n\n`);
      },
      onError: (error) => {
        if (format === "sse") {
          res.write(`event: error\ndata: ${JSON.stringify({ message: error.message })}\n\n`);
        } else {
          res.write(`\n[error] ${error.message}\n`);
        }
        res.end();
        resolve();
      },
      onClose: () => {
        if (format === "sse") res.write("event: done\ndata: {}\n\n");
        res.end();
        resolve();
      },
    });

    res.on("close", () => kill());
  });
}
