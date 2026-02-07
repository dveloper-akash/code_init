import redis from "../config/redis.js";

const HEARTBEAT_TTL = 30;   // seconds
const METRICS_TTL   = 15;   // seconds

/* -------------------------------
   REGISTRATION
--------------------------------*/

export async function registerProvider(id, address, capabilities) {
  await redis.set(`provider:${id}:address`, address);
  await redis.set(`provider:${id}:status`, "IDLE");

  // heartbeat (liveness)
  await redis.set(`provider:${id}:heartbeat`, "alive", {
    EX: HEARTBEAT_TTL,
  });

  // cache capabilities (NO TTL)
  if (capabilities) {
    await redis.set(
      `provider:${id}:capabilities`,
      JSON.stringify(capabilities)
    );
  }

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
   AVAILABILITY
--------------------------------*/

export async function setBusy(id) {
  await redis.set(`provider:${id}:status`, "BUSY");
}

export async function setIdle(id) {
  await redis.set(`provider:${id}:status`, "IDLE");
}

/* -------------------------------
   METRICS (HINTS ONLY)
--------------------------------*/

export async function updateMetrics(id, metrics) {
  await redis.set(
    `provider:${id}:metrics`,
    JSON.stringify(metrics),
    { EX: METRICS_TTL }
  );
}

/* -------------------------------
   DISCOVERY WITH JOB FILTERING
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

    /* ---- Capability filtering ---- */
    const capRaw = await redis.get(`provider:${id}:capabilities`);
    if (!capRaw) continue;

    const caps = JSON.parse(capRaw);

    if (!caps.languages.includes(job.language)) continue;
    if (job.timeout > caps.maxTimeout) continue;

    /* ---- Metrics filtering (optional hints) ---- */
    if (job.memoryMB) {
      const metricsRaw = await redis.get(`provider:${id}:metrics`);
      if (metricsRaw) {
        const m = JSON.parse(metricsRaw);

        // safety margins (IMPORTANT)
        if (m.freeRamMB < job.memoryMB * 1.5) continue;
        if (m.cpuUsage > 85) continue;
      }
    }

    available.push({
      providerId: id,
      address
    });
  }

  return available;
}
