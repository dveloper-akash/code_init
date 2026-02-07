import { createClient } from "redis";

const redis = createClient({
  socket: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
  },
  password: process.env.REDIS_PASSWORD || undefined,
  database: Number(process.env.REDIS_DB || 0),
});

redis.on("connect", () => {
  console.log("Redis connected");
});

redis.on("error", (err) => {
  console.error("Redis error:", err);
});

redis.on("reconnecting", () => {
  console.warn("Redis reconnecting...");
});

await redis.connect();

export default redis;
