import { Router } from "express";

const router = Router();

router.post("/register", (req, res) => {
  res.json({ message: "Provider register route (stub)" });
});

router.post("/heartbeat", (req, res) => {
  res.json({ message: "Provider heartbeat route (stub)" });
});

router.post("/offline", (req, res) => {
  res.json({ message: "Provider offline route (stub)" });
});

export default router;
