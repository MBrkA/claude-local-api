export type ClaudePermissionMode =
  | "acceptEdits"
  | "auto"
  | "bypassPermissions"
  | "default"
  | "dontAsk"
  | "plan";

export interface ClaudeRunOptions {
  prompt: string;
  cwd?: string;
  model?: string;
  systemPrompt?: string;
  appendSystemPrompt?: string;
  allowedTools?: string[];
  disallowedTools?: string[];
  permissionMode?: ClaudePermissionMode;
  maxBudgetUsd?: number;
  jsonSchema?: Record<string, unknown>;
}

export type ClaudeCompleteFormat = "text" | "json";

export interface ClaudeCompleteResult {
  format: ClaudeCompleteFormat;
  result: string | Record<string, unknown>;
  durationMs: number;
}

export type ClaudeStreamFormat = "text" | "ndjson" | "sse";

export interface ClaudeStreamHandlers {
  onTextChunk?: (text: string) => void;
  onEvent?: (event: unknown, rawLine: string) => void;
  onError?: (error: Error) => void;
  onClose?: (code: number | null) => void;
}
