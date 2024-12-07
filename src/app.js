import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import "dotenv/config";

const app = express();

// Common Middlewares
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  }),
);

app.use(
  express.json({
    limit: "22kb",
  }),
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "22kb",
  }),
);

app.use(express.static("public"));
app.use(cookieParser());


// Routes
import userRouter from "./routes/users.routes.js";
import healthCheckRouter from "./routes/healthcheck.routes.js";

app.use("/api/v1/healthcheck", healthCheckRouter);
app.use("/api/v1/users", userRouter);

// Error handler
import {errorHandler} from "./middlewares/error.middleware.js"
app.use(errorHandler)

export { app };
