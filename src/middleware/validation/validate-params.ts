import { Request, Response, NextFunction, RequestHandler } from "express";
import { ZodType } from "zod";

export function validateParams(schema: ZodType): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.params);
    if (!result.success) {
      res.status(400).json({
        success: false,
        error: "Validation failed",
        details: result.error.issues,
      });
      return;
    }
    req.params = result.data as typeof req.params;
    next();
  };
}
