import { z } from "zod";

export const healthResponseSchema = z.object({
  status: z.literal("healthy"),
  timestamp: z.string(),
  uptime: z.number(),
  environment: z.string(),
});
export type HealthResponse = z.infer<typeof healthResponseSchema>;
