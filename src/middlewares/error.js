const send_response = require("../functionPieces/send_reposnse");

module.exports = (err, req, res, next) => {
  if (res.headersSent) return next(err);

  let message = err.message || "Internal Server Error";
  let statusCode = err.statusCode || 500;

  if (err.name === "ValidationError") {
    message = Object.values(err.errors).map((value) => value.message).join(", ");
    statusCode = 201;
  } else if (err.name === "CastError") {
    message = `Resource Not Found: ${err.path}`;
    statusCode = 404;
  } else if (err.code === 11000) {
    message = `Email ${Object.values(err.keyValue)} already exists`;
    statusCode = 201;
  } else if (err.name === "JSONWebTokenError") {
    message = `JSON web token is invalid. Try again.`;
    statusCode = 401;
  } else if (err.name === "TokenExpiredError") {
    message = `JSON web token is expired. Try again.`;
    statusCode = 401;
  }

  if (err.statusCode === 404 && !message.includes("Not Found")) message = "Resource not found";

  statusCode = statusCode || 500;
  message = message || "Internal Server Error";

  return send_response(
    res,
    statusCode,
    false,
    statusCode,
    {},
    message
  );
};
