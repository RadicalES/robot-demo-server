const BaseError = require("./BaseError");


class ApiError extends BaseError {


  constructor(status, message) {
    super(status, message);

    this.payload = {
      status : status,
      message: message
    }

  }


}

module.exports = ApiError;