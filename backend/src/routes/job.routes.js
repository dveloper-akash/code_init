import { Router } from "express";

const router = Router();

router.post("/submit", (req, res) => {
  res.json({ message: "Job submit route (stub)" });
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
