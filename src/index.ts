import { createApp } from "@/app";
import { logger } from "@/utils/logger";
import { Env } from "@/utils/env";

function startServer(): void {
  const app = createApp();

  const server = app.listen(Env.port, () => {
    logger.info(`Server running in ${Env.environment} mode`);
    logger.info(`Listening on http://${Env.host}:${Env.port}`);
    logger.info(`API endpoint: http://${Env.host}:${Env.port}${Env.apiPrefix}/v1`);
    if (!Env.isProduction) {
      logger.info(`Docs: http://${Env.host}:${Env.port}/docs`);
    }
  });

  const shutdown = (signal: string): void => {
    logger.info(`${signal} received, shutting down gracefully...`);
    server.close(() => {
      logger.info("Server closed");
      process.exit(0);
    });

    setTimeout(() => {
      logger.error("Forced shutdown after timeout");
      process.exit(1);
    }, 10000);
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));

  process.on("unhandledRejection", (reason: unknown) => {
    logger.error("Unhandled Rejection", { reason });
  });

  process.on("uncaughtException", (error: Error) => {
    logger.error("Uncaught Exception", { error: error.message, stack: error.stack });
    process.exit(1);
  });
}

Env.validate();
startServer();
