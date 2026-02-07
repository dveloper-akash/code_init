import { Router } from "express";
import { submitJob } from "../services/job.service.js";

const router = Router();

router.post("/submit", async (req, res) => {
  try {
    const job = await submitJob(req.body);
    res.json(job);
  } catch (err) {
    res.status(500).json({ error: "Job submission failed" });
  }
});

router.get("/:id", (req, res) => {
  res.json({
    message: "Job status route (stub)",
    job_id: req.params.id
  });
});

router.post("/:id/result", (req, res) => {
  res.json({
    message: "Job result route (stub)",
    job_id: req.params.id
  });
});

export default router;
