import { Request, Response, NextFunction } from "express";
import { AppError, ResponseBuilder } from "@/types";
import { logger } from "@/utils/logger";
import { Env } from "@/utils/env";

/**
 * Global error handler middleware
 */
export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  logger.error(err.message, {
    name: err.name,
    cause: err.cause,
    stack: Env.isDevelopment ? err.stack : undefined,
  });

  if (res.headersSent) {
    // A streaming response has already started writing to the socket.
    res.end();
    return;
  }

  if (err instanceof AppError) {
    res
      .status(err.statusCode)
      .json(ResponseBuilder.error(err.message, err.name, Env.isDevelopment ? err.stack : undefined));
    return;
  }

  const message = Env.isDevelopment ? err.message : "Internal server error";
  res.status(500).json(ResponseBuilder.error(message, "INTERNAL_ERROR", Env.isDevelopment ? err.stack : undefined));
}

/**
 * 404 Not Found handler
 */
export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json(ResponseBuilder.error("Route not found", "NOT_FOUND"));
}
