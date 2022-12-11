const { promisify } = require("util");
const jwt = require("jsonwebtoken");
const User = require("../models/user_model");
const GlobalError = require("../utils/global_error");
const handleAsync = require("../utils/handle_async");

exports.requireAuth = handleAsync(async (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    return next(
      new GlobalError("You are not logged in. Please log in to get access", 401)
    );
  }

  const verified = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  const freshUser = await User.findById(verified.id).select("-password");

  if (!freshUser) {
    return next(new GlobalError("Session expired. Please Log in again", 401));
  }

  req.user = freshUser;

  next();
});

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new GlobalError(
          "Unauthorized. Only admins can perform this action.",
          401
        )
      );
    }

    next();
  };
};
