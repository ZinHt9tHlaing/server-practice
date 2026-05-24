import { configDotenv } from "dotenv";

configDotenv({ quiet: true }); // hide dotenv warnings

export const ENV = {
  PORT: process.env.PORT,
  CLIENT_URL: process.env.CLIENT_URL,
  NODE_ENV: process.env.NODE_ENV,

  DATABASE_URL: process.env.DATABASE_URL,

  APP_DEBUG: process.env.APP_DEBUG,

  ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET,
  REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET,

  UPSTASH_REDIS_URL: process.env.REDIS_URL,
  
  UPSTASH_REDIS_HOST: process.env.REDIS_HOST,
  UPSTASH_REDIS_PORT: process.env.REDIS_PORT,
  UPSTASH_REDIS_PASSWORD: process.env.REDIS_PASSWORD,

  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
};
