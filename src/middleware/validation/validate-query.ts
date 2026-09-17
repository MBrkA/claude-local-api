import { Request, Response, NextFunction, RequestHandler } from "express";
import { ZodType } from "zod";

export function validateQuery(schema: ZodType): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      res.status(400).json({
        success: false,
        error: "Validation failed",
        details: result.error.issues,
      });
      return;
    }
    req.query = result.data as typeof req.query;
    next();
  };
}
