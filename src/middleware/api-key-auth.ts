import { Request, Response, NextFunction } from "express";
import { Env } from "@/utils/env";
import { AppError } from "@/types/error.types";

/**
 * No-op when API_KEY is unset (default for local use). When set, requires a
 * matching `x-api-key` header on every request routed through this middleware.
 */
export function apiKeyAuth(req: Request, _res: Response, next: NextFunction): void {
  if (!Env.apiKey) {
    next();
    return;
  }

  const provided = req.header("x-api-key");
  if (provided !== Env.apiKey) {
    next(new AppError(401, "Unauthorized"));
    return;
  }

  next();
}
