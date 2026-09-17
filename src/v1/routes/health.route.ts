import { Router } from "express";
import { createRouteBuilder } from "@/utils/create-route";
import * as healthController from "@v1/controllers/health.controller";
import * as healthSchema from "@v1/schemas/health.schema";

const router = Router();
const createRoute = createRouteBuilder(router, "/v1");

createRoute(
  {
    method: "get",
    path: "/health",
    summary: "Health check",
    description: "Check if the API is running and healthy",
    tags: ["Health"],
    response: healthSchema.healthResponseSchema,
  },
  healthController.getHealth,
);

export default router;
