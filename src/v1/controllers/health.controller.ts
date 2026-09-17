import type { HealthResponse } from "@v1/schemas/health.schema";

export async function getHealth(): Promise<HealthResponse> {
  return {
    status: "healthy" as const,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env["NODE_ENV"] ?? "development",
  };
}
