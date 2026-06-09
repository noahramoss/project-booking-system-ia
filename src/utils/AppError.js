// src/utils/AppError.js
class AppError extends Error {
  constructor(message, statusCode, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.details = details;

    // Captura dónde ocurrió el error para facilitar el debugging
    Error.captureStackTrace(this, this.constructor);
  }
}

export default AppError;
