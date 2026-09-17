import winston from "winston";
import { Env } from "@/utils/env";

export const logger = winston.createLogger({
  level: Env.isDevelopment ? "debug" : "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    Env.isDevelopment
      ? winston.format.combine(winston.format.colorize(), winston.format.simple())
      : winston.format.json(),
  ),
  transports: [new winston.transports.Console()],
});
