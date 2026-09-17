import "dotenv/config";

function get(name: string, fallback?: string): string | undefined {
  return process.env[name] || fallback;
}

function getRequired(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

const environment = get("NODE_ENV", "development") as string;

export const Env = {
  environment,
  isProduction: environment === "production",
  isDevelopment: environment === "development",
  isTest: environment === "test",

  port: Number(get("PORT", "4000")),
  host: get("HOST", "localhost") as string,
  apiPrefix: get("API_PREFIX", "/api") as string,
  trustProxy: environment === "production" ? 1 : false,

  apiKey: get("API_KEY") || undefined,

  claudeBinPath: get("CLAUDE_BIN_PATH", "claude") as string,
  claudeDefaultCwd: get("CLAUDE_DEFAULT_CWD") || process.cwd(),

  get,
  getRequired,

  validate(): void {
    // No strictly required env vars for local dev use.
  },
};
