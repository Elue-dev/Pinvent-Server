const { promisify } = require("util");
const jwt = require("jsonwebtoken");
const User = require("../models/user_model");
const GlobalError = require("../utils/global_error");
const handleAsync = require("../utils/handle_async");

exports.getUsers = handleAsync(async (req, res) => {
  const users = await User.find().sort("-creatdAt");

  res.status(200).json({
    status: "success",
    results: users.length,
    data: users,
  });
});

exports.getLoggedInUser = handleAsync(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    return next(new GlobalError("User does not exist", 400));
  }

  res.status(200).json({
    status: "success",
    user,
  });
});

exports.getLoginStatus = handleAsync(async (req, res) => {
  const token = req.cookies.token;

  if (!token) {
    return res.json({
      isLoggedIn: false,
    });
  }

  const verified = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  if (verified) {
    return res.json({
      isLoggedIn: true,
    });
  }

  return res.json({
    isLoggedIn: false,
  });
});

exports.updateUser = handleAsync(async (req, res, next) => {
  const { userId } = req.params;

  const user = await User.findByIdAndUpdate(userId, req.body, {
    new: true,
    runValidators: true,
  });

  if (!user) {
    return next(new GlobalError(`No user with the id ${userId} exists`, 404));
  }

  res.status(200).json({
    status: "success",
    data: user,
  });
});

exports.updateLoggedInUser = handleAsync(async (req, res, next) => {
  if (req.body.password) {
    return next(
      new GlobalError(
        "This route is not for password updates, please use the forgot password method",
        400
      )
    );
  }

  const filteredObj = (obj, ...allowedFields) => {
    const newObj = {};
    Object.keys(obj).forEach((val) => {
      if (allowedFields.includes(val)) {
        newObj[val] = obj[val];
      }
    });
    return newObj;
  };

  const filteredBody = filteredObj(
    req.body,
    "username",
    "bio",
    "photo",
    "phone"
  );

  const updatedUser = await User.findByIdAndUpdate(req.user._id, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: "success",
    data: updatedUser,
  });
});
