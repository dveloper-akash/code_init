import redis from "../config/redis.js";

const HEARTBEAT_TTL = 30; // seconds
const METRICS_TTL = 15;

/* -------------------------------
   REGISTRATION
--------------------------------*/
export async function registerProvider(id, address, capabilities) {
  await redis.set(`provider:${id}:address`, address);
  await redis.set(`provider:${id}:status`, "IDLE");

  await redis.set(`provider:${id}:heartbeat`, "alive", {
    EX: HEARTBEAT_TTL,
  });

  await redis.set(
    `provider:${id}:capabilities`,
    JSON.stringify(capabilities)
  );

  await redis.sAdd("providers:all", id);
}

/* -------------------------------
   HEARTBEAT
--------------------------------*/
export async function heartbeat(id) {
  await redis.set(`provider:${id}:heartbeat`, "alive", {
    EX: HEARTBEAT_TTL,
  });
}

/* -------------------------------
   STATUS
--------------------------------*/
export async function setBusy(id) {
  await redis.set(`provider:${id}:status`, "BUSY");
}

export async function setIdle(id) {
  await redis.set(`provider:${id}:status`, "IDLE");
}

/* -------------------------------
   METRICS
--------------------------------*/
export async function updateMetrics(id, metrics) {
  await redis.set(
    `provider:${id}:metrics`,
    JSON.stringify(metrics),
    { EX: METRICS_TTL }
  );
}

/* -------------------------------
   DISCOVERY
--------------------------------*/
export async function getAvailableProviders(job) {
  const ids = await redis.sMembers("providers:all");
  const available = [];

  for (const id of ids) {
    const [heartbeat, status, address] = await Promise.all([
      redis.get(`provider:${id}:heartbeat`),
      redis.get(`provider:${id}:status`),
      redis.get(`provider:${id}:address`)
    ]);

    if (!heartbeat || status !== "IDLE") continue;

    const capsRaw = await redis.get(`provider:${id}:capabilities`);
    if (!capsRaw) continue;

    const caps = JSON.parse(capsRaw);

    if (!caps.languages.includes(job.language)) continue;
    if (job.timeout > caps.maxTimeout) continue;

    const metricsRaw = await redis.get(`provider:${id}:metrics`);
    if (metricsRaw) {
      const m = JSON.parse(metricsRaw);
      if (job.memoryMB && m.freeRamMB < job.memoryMB * 1.5) continue;
      if (job.cpuCores && m.availCpuCores < job.cpuCores) continue;
      if (job.gpu && !m.gpu) continue;
    }

    available.push({ providerId: id, address });
  }

  return available;
}
