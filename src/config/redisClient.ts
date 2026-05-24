import Redis from "ioredis";
import { ENV } from "./env";
import { logger } from "@/utils/logger";

export const redisConnection = new Redis(ENV.UPSTASH_REDIS_URL as string, {
  // host: ENV.UPSTASH_REDIS_HOST || "127.0.0.1",
  // port: parseInt(ENV.UPSTASH_REDIS_PORT || "6379"),
  // password: ENV.UPSTASH_REDIS_PASSWORD,
  maxRetriesPerRequest: null, // for bullMQ, not retry
});

// --- Connection Event Listeners ---

// 1. Triggered when the initial TCP connection is established
redisConnection.on("connect", () => {
  logger.info("Redis client is attempting to connect...");
});

// 2. Triggered when Redis finishes handshaking (TLS/Auth) and is ready for commands
redisConnection.on("ready", () => {
  logger.info("Redis connection established and ready to use.");
});

// 3. Triggered if the connection fails or drops
redisConnection.on("error", (error) => {
  logger.error(`Redis connection error: ${error.message}`);
});

// 4. Triggered when the client disconnects gracefully or gets kicked off
redisConnection.on("close", () => {
  logger.warn("Redis Connection closed.");
});

export default redisConnection;
