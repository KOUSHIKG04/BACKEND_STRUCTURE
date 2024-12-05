import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

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
import healthCheckRouter from "./routes/healthcheck.routes.js";
app.use("/api/v1/healthcheck", healthCheckRouter);

export { app };
