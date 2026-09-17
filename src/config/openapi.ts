import {
  OpenAPIRegistry,
  OpenApiGeneratorV3,
  extendZodWithOpenApi,
} from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import { Env } from "@/utils/env";

/**
 * Extend Zod with OpenAPI support (.openapi() method on all Zod types)
 * Must be called once before any schema registration
 */
extendZodWithOpenApi(z);

/**
 * Create OpenAPI registry
 */
export const registry = new OpenAPIRegistry();

/**
 * Register API key security scheme so Swagger UI shows the "Authorize" button.
 * Only enforced when the API_KEY env var is set (see middleware/api-key-auth.ts).
 */
registry.registerComponent("securitySchemes", "apiKeyAuth", {
  type: "apiKey",
  in: "header",
  name: "x-api-key",
  description: "API key required only when the API_KEY environment variable is set on the server.",
});

/**
 * Generate OpenAPI documentation
 */
export function generateOpenApiDocument() {
  const generator = new OpenApiGeneratorV3(registry.definitions);

  return generator.generateDocument({
    openapi: "3.0.0",
    info: {
      title: "Claude Local API",
      version: "1.0.0",
      description:
        "A local HTTP API that wraps the Claude Code CLI (`claude -p`) as a subprocess, exposing complete (buffered) and streaming endpoints.",
    },
    servers: [
      {
        url: `http://${Env.host}:${Env.port}${Env.apiPrefix}`,
        description: "Local server",
      },
    ],
    security: [],
    tags: [],
  });
}
