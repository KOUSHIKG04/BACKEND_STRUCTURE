class ApiError extends Error {
  constructor(
    statusCode,
    errors = [],
    message = "Something went wrong",
    stack = "",
  ) {
    super(message);
    this.message = message;
    this.data = null;
    this.statusCode = statusCode;
    this.success = false;
    this.errors = errors;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export { ApiError };
