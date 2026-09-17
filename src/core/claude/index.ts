import { spawn } from "node:child_process";
import { createInterface } from "node:readline";
import { Env } from "@/utils/env";
import { logger } from "@/utils/logger";
import { AppError } from "@/types/error.types";
import type {
  ClaudeCompleteFormat,
  ClaudeCompleteResult,
  ClaudeRunOptions,
  ClaudeStreamHandlers,
} from "@/core/claude/types";

export * from "@/core/claude/types";

function buildArgs(options: ClaudeRunOptions, outputFormat: "text" | "json" | "stream-json"): string[] {
  const args: string[] = ["-p", options.prompt, "--output-format", outputFormat];

  if (outputFormat === "stream-json") {
    args.push("--verbose", "--include-partial-messages");
  }
  if (options.model) args.push("--model", options.model);
  if (options.systemPrompt) args.push("--system-prompt", options.systemPrompt);
  if (options.appendSystemPrompt) args.push("--append-system-prompt", options.appendSystemPrompt);
  if (options.allowedTools?.length) args.push("--allowedTools", ...options.allowedTools);
  if (options.disallowedTools?.length) args.push("--disallowedTools", ...options.disallowedTools);
  if (options.permissionMode) args.push("--permission-mode", options.permissionMode);
  if (options.maxBudgetUsd) args.push("--max-budget-usd", String(options.maxBudgetUsd));
  if (options.jsonSchema) args.push("--json-schema", JSON.stringify(options.jsonSchema));

  return args;
}

function resolveCwd(cwd?: string): string {
  return cwd || Env.claudeDefaultCwd;
}

/**
 * Spawn `claude -p` and wait for it to exit, buffering the full response.
 * Used by the /claude/complete endpoint.
 */
export async function runClaudeComplete(
  options: ClaudeRunOptions & { format: ClaudeCompleteFormat; timeoutMs?: number },
): Promise<ClaudeCompleteResult> {
  const args = buildArgs(options, options.format);
  const cwd = resolveCwd(options.cwd);
  const startedAt = Date.now();

  return new Promise((resolve, reject) => {
    const child = spawn(Env.claudeBinPath, args, { cwd });

    let stdout = "";
    let stderr = "";
    let settled = false;

    const timeout = options.timeoutMs
      ? setTimeout(() => {
          if (settled) return;
          settled = true;
          child.kill("SIGTERM");
          reject(new AppError(504, `Claude Code process timed out after ${options.timeoutMs}ms`));
        }, options.timeoutMs)
      : undefined;

    child.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    child.on("error", (error) => {
      if (settled) return;
      settled = true;
      if (timeout) clearTimeout(timeout);
      reject(new AppError(500, `Failed to start Claude Code process: ${error.message}`));
    });

    child.on("close", (code) => {
      if (settled) return;
      settled = true;
      if (timeout) clearTimeout(timeout);

      const durationMs = Date.now() - startedAt;

      if (code !== 0) {
        reject(new AppError(502, `Claude Code exited with code ${code}: ${(stderr || stdout).trim()}`));
        return;
      }

      if (options.format === "json") {
        try {
          resolve({ format: "json", result: JSON.parse(stdout), durationMs });
        } catch {
          reject(new AppError(502, "Failed to parse Claude Code JSON output"));
        }
        return;
      }

      resolve({ format: "text", result: stdout.trim(), durationMs });
    });
  });
}

/**
 * Spawn `claude -p --output-format stream-json` and stream parsed NDJSON
 * events (and extracted text deltas) back to the caller as they arrive.
 * Used by the /claude/stream endpoint.
 */
export function streamClaude(options: ClaudeRunOptions, handlers: ClaudeStreamHandlers): { kill: () => void } {
  const args = buildArgs(options, "stream-json");
  const cwd = resolveCwd(options.cwd);
  const child = spawn(Env.claudeBinPath, args, { cwd });

  const rl = createInterface({ input: child.stdout });

  rl.on("line", (line) => {
    if (!line.trim()) return;

    let parsed: unknown;
    try {
      parsed = JSON.parse(line);
    } catch {
      return;
    }

    handlers.onEvent?.(parsed, line);

    const event = parsed as {
      type?: string;
      event?: { type?: string; delta?: { type?: string; text?: string } };
    };
    if (
      event.type === "stream_event" &&
      event.event?.delta?.type === "text_delta" &&
      event.event.delta.text
    ) {
      handlers.onTextChunk?.(event.event.delta.text);
    }
  });

  let stderr = "";
  child.stderr.on("data", (chunk: Buffer) => {
    stderr += chunk.toString();
  });

  child.on("error", (error) => {
    handlers.onError?.(error);
  });

  child.on("close", (code) => {
    if (code !== 0 && stderr) {
      logger.warn("Claude Code stream process exited with an error", { code, stderr });
    }
    handlers.onClose?.(code);
  });

  return {
    kill: () => child.kill("SIGTERM"),
  };
}
