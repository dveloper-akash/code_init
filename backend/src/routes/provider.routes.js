import { Router } from "express";
import {
  registerProvider,
  heartbeat,
  updateMetrics
} from "../services/providerStore.js";

const router = Router();

router.post("/register", async (req, res) => {
  const { providerId, address, capabilities } = req.body;

  if (!providerId || !address || !capabilities) {
    return res.status(400).json({ error: "invalid payload" });
  }

  await registerProvider(providerId, address, capabilities);
  res.json({ ok: true });
});

router.post("/heartbeat", async (req, res) => {
  const { providerId } = req.body;
  if (!providerId) return res.status(400).json({ error: "providerId required" });

  await heartbeat(providerId);
  res.json({ ok: true });
});

router.post("/metrics", async (req, res) => {
  const { providerId, metrics } = req.body;
  if (!providerId || !metrics)
    return res.status(400).json({ error: "invalid payload" });

  await updateMetrics(providerId, metrics);
  res.json({ ok: true });
});

export default router;
