import { Router } from "express";

const router = Router();

router.get("/", (req, res) => {
  res.json({
    status: "ok",
    service: "Grid-X backend",
    timestamp: Date.now()
  });
});

export default router;
