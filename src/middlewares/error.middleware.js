import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.js";

export const errorHandler = (err, req, res, next) => {
  if (!err) {
    return res.status(500).json({ message: "An unknown error occurred" });
  }

  let error = err;

  if (!(error instanceof ApiError)) {
    const statusCode =
      error.statusCode || (error instanceof mongoose.Error ? 400 : 500);

    const message = error.message || "Something went wrong";

    error = new ApiError(statusCode, message, error?.errors || err.stack);
  }

  const response = {
    ...error,
    message: error.message,
    ...(process.env.NODE_ENV === "development" ? { stack: error.stack } : {}),
  };

  return res.status(error.statusCode).json(response);
};
