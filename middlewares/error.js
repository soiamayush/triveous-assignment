const ErrorHandler = require("../utils/errorHandler");

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500; // 500 is internal server error

  if (process.env.NODE_ENV === "DEVELOPMENT") {
    res.status(err.statusCode).json({
      success: false,
      error: err,
      errMessage: err.message,
      stack: err.stack,
    });
  }

  if (process.env.NODE_ENV === "PRODUCTION") {
    let error = { ...err };

    error.message = err.message;

    //wrong mongoose object id error
    if (err.name === "CastError") {
      const message = `Resource not found. Invalid : ${err.path}`;
      error = new ErrorHandler(message, 400);
    }

    // handling mongoose validation error
    if (err.name === "ValidationError") {
      const message = Object.values(err.errors).map((value) => value.message);
      error = new ErrorHandler(message, 400);
    }

    //handling mongoose duplicate error
    if(error.code === 11000){
      const message = `Duplicate ${Object.keys(err.keyValue)} entered.`
      error = new ErrorHandler(message, 400)
    }

    //handling wrong jwt error 
    if(error.code === "JsonWebTokenError"){
      const message = "JSON web token is invalid. Try again!!!"
      error = new ErrorHandler(message, 400)
    }


    //handling expired jwt error 
    if(error.code === "TokenExpiredError"){
      const message = "JSON web token is expired. Try again"
      error = new ErrorHandler(message, 400)
    }


    res.status(err.statusCode).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};
