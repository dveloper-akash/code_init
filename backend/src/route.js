import { Router } from "express";

import healthRoutes from "./routes/health.routes.js";
import providerRoutes from "./routes/provider.routes.js";
import jobRoutes from "./routes/job.routes.js";

const router = Router();


router.use("/health", healthRoutes);

router.use("/provider", providerRoutes);


router.use("/job", jobRoutes);

export default router;
