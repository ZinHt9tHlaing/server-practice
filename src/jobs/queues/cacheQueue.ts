import { Queue } from "bullmq";
import redisConnection from "@/config/redisClient";

const CacheQueue = new Queue("cache-invalidation", {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3, // if job fail, it will retry 3 times
    backoff: { // စောင့်ဆိုင်းရမည့်အချိန်
      type: "exponential", // 1s, 2s, 4s ဖြင့် တဖြည်းဖြည်း တိုးပြီး retry လုပ်မယ်
      delay: 1000, // 1000ms = 1 second
    },
    removeOnComplete: true, // if job complete remove after 1 sec
    removeOnFail: 1000, // if job fail retry 3 times and remove after 1 second
  },
});

export default CacheQueue;
