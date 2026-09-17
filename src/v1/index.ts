import { Router } from "express";
import healthRoutes from "@v1/routes/health.route";
import claudeRoutes from "@v1/routes/claude.route";

const router = Router();

router.use(healthRoutes);
router.use(claudeRoutes);

export default router;
