import { Router } from "express";
import { submitJob } from "../services/job.service.js";

import { analyzeJob } from "../services/aiAnalyzer.js";
import { getAvailableProviders } from "../services/providerStore.js";

const router = Router();

<<<<<<< HEAD
router.post("/submit", async (req, res)=> {
  const { code } = req.body;
=======
router.post("/submit", async (req, res) => {
  try {
    const job = await submitJob(req.body);
    res.json(job);
  } catch (err) {
    res.status(500).json({ error: "Job submission failed" });
  }
});
>>>>>>> 33b8cbeb38cfe2e0b7727006f74c2b7fa2e8207c

  // 1. Ask AI
  const plan = await analyzeJob(code);
  console.log(plan);

  // 2. Find providers (Redis)
  const providers = await getAvailableProviders({
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
