import rateLimit from "express-rate-limit";
import { Env } from "@/utils/env";

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Env.isDevelopment ? 1000 : 100,
  message: {
    success: false,
    error: "Too many requests from this IP, please try again later.",
    retryAfter: "15 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => Env.isTest,
});
