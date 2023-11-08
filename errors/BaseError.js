

class BaseError extends Error {

  constructor(status, message) {
    super(message);
    this.status = status || 500;
    this.message = message || "Error";
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }

}


module.exports = BaseError;