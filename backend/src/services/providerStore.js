import redis from "../config/redis.js";

const HEARTBEAT_TTL = 30; // seconds

export async function registerProvider(id, address) {
  await redis.set(`provider:${id}:address`, address);
  await redis.set(`provider:${id}:status`, "IDLE");
  await redis.set(`provider:${id}:heartbeat`, "alive", {
    EX: HEARTBEAT_TTL,
  });
  await redis.sAdd("providers:all", id);
}

export async function heartbeat(id) {
  await redis.set(`provider:${id}:heartbeat`, "alive", {
    EX: HEARTBEAT_TTL,
  });
}

export async function setBusy(id) {
  await redis.set(`provider:${id}:status`, "BUSY");
}

export async function setIdle(id) {
  await redis.set(`provider:${id}:status`, "IDLE");
}

export async function getAvailableProviders() {
  const ids = await redis.sMembers("providers:all");
  const available = [];

  for (const id of ids) {
    const heartbeat = await redis.get(`provider:${id}:heartbeat`);
    const status = await redis.get(`provider:${id}:status`);
    const address = await redis.get(`provider:${id}:address`);

    if (heartbeat && status === "IDLE") {
      available.push({ providerId: id, address });
    }
  }

  return available;
}
