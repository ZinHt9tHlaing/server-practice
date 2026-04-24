import express, { Application, NextFunction, Request, Response } from "express";
import bodyParser from "body-parser";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import cors from "cors";
import "dotenv/config";

// import custom middleware
import { rateLimiter } from "./middlewares/rateLimiter";

// import routes
import routes from "./routes/indexRoute";
import { errorHandler } from "./utils/errorHandler";

export const app: Application = express();

app.use(cors());
app
  .use(bodyParser.json({ limit: "10mb" }))
  .use(bodyParser.urlencoded({ extended: true, limit: "10mb" }))
  .use(morgan("dev")) // request logger
  .use(express.urlencoded({ extended: true }))
  .use(express.json())
  .use(cookieParser())
  .use(helmet()) // sets http headers to help prevent XSS, clickjacking, MIME type sniffing, and more
  .use(compression()) // compresses response bodies.
  .use(rateLimiter); // limits the number of requests from a single IP

// routes
app.use(routes);

// error handler
app.use(errorHandler);
