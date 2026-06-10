import redisConnection from "@/config/redisClient";
import { invalidateCache } from "@/lib/invalidateCache";
import { Job, Worker } from "bullmq";

interface CacheJobData {
  pattern: string;
}

const cacheWorker = new Worker(
  "cache-invalidation",
  async (job: Job<CacheJobData>) => {
    // key => တစ်ခုတည်းကိုရှာတာ (e.g. user:1)
    // pattern => ဒီပုံစံနဲ့လာတဲ့ အကုန်လုံးကိုရှာတာ (e.g. user:*)

    const { pattern } = job.data;
    await invalidateCache(pattern);
  },
  {
    connection: redisConnection,
    concurrency: 5, // if 5 job in queue, it run 5 job at the same time
  }
);

cacheWorker.on("completed", (job) => {
  console.log(`✅ Cache job completed with result ${job.id}`);
});

cacheWorker.on("failed", (job, error) => {
  console.error(`❌ Cache job failed with error: ${error.message}`);
});
