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
import routes from "./routes/v1/indexRoute";
import { errorHandler } from "./utils/errorHandler";
import path from "node:path";

export const app: Application = express();

// view engine
app.set("view engine", "ejs");
app.set("views", "src/views"); // set the views directory

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

// static public Access ( File )
app.use(express.static("public"));
app.use(express.static("uploads"));

// routes
app.use(routes);

// error handler
app.use(errorHandler);
