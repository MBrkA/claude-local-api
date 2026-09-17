import { Router } from "express";
import { createRouteBuilder } from "@/utils/create-route";
import * as claudeController from "@v1/controllers/claude.controller";
import * as claudeSchema from "@v1/schemas/claude.schema";

const router = Router();
const createRoute = createRouteBuilder(router, "/v1");

createRoute(
  {
    method: "post",
    path: "/claude/complete",
    summary: "Run a Claude Code prompt and get the full answer",
    description:
      "Spawns `claude -p` as a subprocess, waits for it to finish, and returns the complete answer either as plain text or as the full Claude Code JSON result object.",
    tags: ["Claude"],
    body: claudeSchema.claudeCompleteRequestSchema,
    response: claudeSchema.claudeCompleteResponseSchema,
  },
  async ({ body }) => claudeController.complete(body),
);

createRoute(
  {
    method: "post",
    path: "/claude/stream",
    summary: "Run a Claude Code prompt and stream the answer",
    description:
      "Spawns `claude -p --output-format stream-json` as a subprocess and streams the response as it is generated. `format` controls whether the client receives incremental plain-text chunks, raw NDJSON stream-json events, or Server-Sent Events.",
    tags: ["Claude"],
    body: claudeSchema.claudeStreamRequestSchema,
  },
  async ({ body, res }) => {
    await claudeController.stream(body, res);
  },
);

export default router;
