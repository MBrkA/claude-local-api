import express, { Application } from "express";
import cors from "cors";
import helmet from "helmet";
import { errorHandler, notFoundHandler } from "@/middleware/errorHandler";
import { apiLimiter } from "@/middleware/rate-limit";
import v1Router from "@v1/index";
import openApiRoutes from "@/routes/openapi";
import { logger } from "@/utils/logger";
import { Env } from "@/utils/env";

/**
 * Create and configure Express application
 */
export function createApp(): Application {
  const app: Application = express();

  app.set("trust proxy", Env.trustProxy);

  app.use(
    helmet({
      contentSecurityPolicy: false,
    }),
  );

  app.use(
    cors({
      origin: true,
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "x-api-key"],
    }),
  );

  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true, limit: "1mb" }));

  app.use("/api", apiLimiter);

  app.use((req, _res, next) => {
    logger.info(`${req.method} ${req.path}`, {
      ip: req.ip,
      userAgent: req.get("user-agent"),
    });
    next();
  });

  if (!Env.isProduction) {
    app.use("/docs", openApiRoutes);
  }

  app.use(`${Env.apiPrefix}/v1`, v1Router);

  app.get("/", (_req, res) => {
    res.json({
      message: "Claude Local API",
      version: "1.0.0",
      ...(!Env.isProduction && {
        documentation: "/docs",
        openapi: "/docs/openapi.json",
      }),
      health: `${Env.apiPrefix}/v1/health`,
    });
  });

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
