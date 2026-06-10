import redisConnection from "@/config/redisClient";

export const getOrSetCache = async <T>(
  key: string,
  cb: () => Promise<T>
): Promise<T> => {
  // Type parameter <T> is a placeholder for any type.
  // T will be inferred from the type of the value returned by the cb function.
  try {
    const cachedData = await redisConnection.get(key);
    if (cachedData) {
      console.log("Cache hit");
      // Cast the parsed JSON to type T
      return JSON.parse(cachedData) as T;
    }

    console.log("Cache miss");
    const freshData = await cb();
    await redisConnection.setex(
      key,
      3600, // Cache for 1 hour, automatically delete after 1 hour
      JSON.stringify(freshData)
    );

    return freshData;
  } catch (error) {
    console.error("Redis error: ", error);
    throw error;
  }
};
