import { Router } from "express";
// import { submitJob } from "../services/job.service.js";

import { analyzeJob } from "../services/aiAnalyzer.js";
import { getAvailableProviders } from "../services/providerStore.js";

const router = Router();

router.post("/submit", async (req, res)=> {
  const providers = await getAvailableProviders();
  if (providers.length === 0) {
    return res.status(503).json({ error: "No providers available" });
  }
  const { code } = req.body;

  // 1. Ask AI
  const plan = await analyzeJob(code);


  // 2. Find providers (Redis)
  providers = await getAvailableProviders({
    language: plan.language,
    runtime: plan.runtime,
    memoryMB: plan.requirements.minMemoryMB,
    gpu:plan.requirements.gpu,
    gpuMemoryMB:plan.requirements.gpuMemoryMB,
    cpuCores:plan.requirements.cpuCores
  });

  if (providers.length === 0) {
    return res.status(503).json({ error: "No providers available" });
  }
  // console.log("Providers:",providers,plan)

  // 3. Return jobId + provider list
  res.json({
    jobId: `job_${Date.now()}`,
    plan,
    providers,
  });
});

// router.get("/:id", (req, res) => {
//   res.json({
//     message: "Job status route (stub)",
//     job_id: req.params.id
//   });
// });

// router.post("/:id/result", (req, res) => {
//   res.json({
//     message: "Job result route (stub)",
//     job_id: req.params.id
//   });
// });

export default router;
