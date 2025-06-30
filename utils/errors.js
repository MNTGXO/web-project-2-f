class CustomError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

class BadRequestError extends CustomError {
  constructor(message = 'Bad Request') {
    super(message, 400);
  }
}

class NotFoundError extends CustomError {
  constructor(message = 'Not Found') {
    super(message, 404);
  }
}

function errorHandler(err, req, res, next) {
  console.error(err.stack);
  const statusCode = err.statusCode || 500;
  const message = statusCode === 500 ? 'Internal Server Error' : err.message;
  res.status(statusCode).json({
    success: false,
    error: message
  });
}

module.exports = {
  CustomError,
  BadRequestError,
  NotFoundError,
  errorHandler
};
