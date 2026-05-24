import { Queue } from "bullmq";
import redisConnection from "@/config/redisClient";

const ImageQueue = new Queue("imageQueue", {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3, // max retry when job fail
    backoff: {
      type: "exponential", // exponential backoff
      delay: 1000, // delay between retry attempts in milliseconds
    },
    removeOnComplete: true, // if job complete remove after 1 sec
    removeOnFail: 1000, // if job fail retry 3 times and remove after 1 second
  },
});

export default ImageQueue;
