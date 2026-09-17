import { z } from "zod";

export const permissionModeSchema = z
  .enum(["acceptEdits", "auto", "bypassPermissions", "default", "dontAsk", "plan"])
  .openapi({ description: "Permission mode to run the Claude Code session with" });

/**
 * Options shared by both the complete and streaming endpoints. Mirrors the
 * subset of `claude -p` CLI flags this API exposes.
 */
export const claudeBaseInputSchema = z.object({
  prompt: z.string().min(1).openapi({
    description: "The prompt to send to Claude Code",
    example: "Write a haiku about the ocean",
  }),
  cwd: z.string().optional().openapi({
    description:
      "Working directory the `claude` subprocess runs in. Defaults to CLAUDE_DEFAULT_CWD (or the server process cwd).",
  }),
  model: z.string().optional().openapi({
    description: "Model alias or full name (e.g. sonnet, opus, claude-sonnet-5)",
    example: "sonnet",
  }),
  systemPrompt: z.string().optional().openapi({
    description: "Override the default system prompt",
  }),
  appendSystemPrompt: z.string().optional().openapi({
    description: "Append to the default system prompt",
  }),
  allowedTools: z.array(z.string()).optional().openapi({
    description: 'Tool names to allow (e.g. ["Bash(git *)", "Edit"])',
  }),
  disallowedTools: z.array(z.string()).optional().openapi({
    description: "Tool names to deny",
  }),
  permissionMode: permissionModeSchema.optional(),
  maxBudgetUsd: z.number().positive().optional().openapi({
    description: "Maximum dollar amount to spend on API calls for this run",
  }),
  jsonSchema: z.record(z.string(), z.any()).optional().openapi({
    description:
      "JSON Schema the final answer must conform to (passed as --json-schema). Claude Code validates and structures its output against this schema.",
    example: {
      type: "object",
      properties: { name: { type: "string" }, price: { type: "number" } },
      required: ["name"],
    },
  }),
});

export const claudeCompleteRequestSchema = claudeBaseInputSchema.extend({
  format: z
    .enum(["text", "json"])
    .default("text")
    .openapi({
      description:
        "Output format: 'text' returns the plain-text answer, 'json' returns the full Claude Code result object (cost, session id, usage, etc.)",
    }),
  timeoutMs: z.number().int().positive().optional().openapi({
    description: "Abort the subprocess if it runs longer than this many milliseconds",
  }),
});
export type ClaudeCompleteRequest = z.infer<typeof claudeCompleteRequestSchema>;

export const claudeCompleteResponseSchema = z.object({
  success: z.literal(true),
  format: z.enum(["text", "json"]),
  result: z.union([z.string(), z.record(z.string(), z.any())]),
  durationMs: z.number(),
});
export type ClaudeCompleteResponse = z.infer<typeof claudeCompleteResponseSchema>;

export const claudeStreamRequestSchema = claudeBaseInputSchema.extend({
  format: z
    .enum(["text", "ndjson", "sse"])
    .default("text")
    .openapi({
      description:
        "Streaming format: 'text' streams incremental plain-text chunks as they are generated, 'ndjson' passes through the raw stream-json events (one JSON object per line), 'sse' wraps each event as a Server-Sent Event.",
    }),
});
export type ClaudeStreamRequest = z.infer<typeof claudeStreamRequestSchema>;
