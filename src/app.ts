import express, { Application } from "express";
import bodyParser from "body-parser";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import cors, { CorsOptions } from "cors";
import "dotenv/config";

// import custom middleware
import { rateLimiter } from "./middlewares/rateLimiter";

// import routes
import routes from "./routes/v1/indexRoute";
import { errorHandler } from "./utils/errorHandler";
import { ENV } from "./config/env";

export const app: Application = express();

// view engine
app.set("view engine", "ejs");
app.set("views", "src/views"); // set the views directory

// cors options
const whitelist: string[] = [ENV.CLIENT_URL, "http://localhost:5173"].filter(
  (url): url is string => Boolean(url)
);
const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests without origin
    // (like Postman, mobile apps, curl)
    if (!origin) {
      return callback(null, true);
    }

    // Check whitelist
    if (whitelist.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error("Not allowed by CORS"));
  },

  credentials: true,
};

// middlewares
app
  .use(bodyParser.json({ limit: "10mb" }))
  .use(bodyParser.urlencoded({ extended: true, limit: "10mb" }))
  .use(morgan("dev")) // request logger
  .use(express.urlencoded({ extended: true }))
  .use(express.json())
  .use(cookieParser())
  .use(cors(corsOptions))
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
