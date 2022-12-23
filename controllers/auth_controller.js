const User = require("../models/user_model");
const Token = require("../models/token_model");
const crypto = require("crypto");
const GlobalError = require("../utils/global_error");
const handleAsync = require("../utils/handle_async");
const { createAndSendToken } = require("../services/auth_services");
const message = require("../utils/auth_message");
const sendEmail = require("../utils/send_email");
const { welcome_message } = require("../utils/welcome_message");
const parser = require("ua-parser-js");

exports.signup = handleAsync(async (req, res, next) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return next(new GlobalError("Please fill in all fields", 400));
  }

  const userExists = await User.findOne({ email });

  if (userExists) {
    return next(new GlobalError("Email already in use", 400));
  }

  const user = await User.create({ username, email, password });

  createAndSendToken(user, 201, res);

  const subject = "Welcome to Pinvent!";
  const send_to = email;
  const sent_from = process.env.EMAIL_USER;

  const url = `${process.env.CLIENT_URL}/edit-profile`;

  const body = welcome_message(url, username);
  await sendEmail(subject, body, send_to, sent_from);
});

exports.login = handleAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new GlobalError("Please provide email and password"), 400);
  }

  const user = await User.findOne({ email }).select("+password");

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new GlobalError("Invalid email or password"), 401);
  }

  createAndSendToken(user, 200, res);
});

exports.logout = handleAsync(async (req, res, next) => {
  res.cookie("token", "", {
    expires: Number(new Date(Date.now() * 10 * 1000)),
    httpOnly: true,
  });

  res.status(200).json({
    status: "success",
    message: "You have been successfully logged out",
  });
});

exports.updatePassword = handleAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id).select("+password");

  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    return next(
      new GlobalError("Please specify all password credentials", 400)
    );
  }

  if (!(await user.correctPassword(oldPassword, user.password))) {
    return next(new GlobalError("Old password is incorrect", 400));
  }

  if (oldPassword === newPassword) {
    return next(new GlobalError("New password can't be old password", 400));
  }

  user.password = newPassword;

  await user.save();

  createAndSendToken("", 200, res);
});

exports.forgotPassword = handleAsync(async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return next(new GlobalError("Please provide an email address", 400));
  }

  const user = await User.findOne({ email });

  if (!user) {
    return next(new GlobalError("That email is not registered", 404));
  }

  let token = await Token.findOne({ userId: user._id });

  if (token) await Token.deleteOne();

  const resetToken = crypto.randomBytes(32).toString("hex") + user._id;

  const hashedToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  await new Token({
    userId: user._id,
    token: hashedToken,
    createdAt: Date.now(),
    expiresAt: Date.now() + 10 * 60 * 1000, // 10 mins
  }).save();

  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

  const userAgent = parser(req.headers["user-agent"]);
  console.log(userAgent);

  const device = userAgent.ua;
  const browser = userAgent.ua.browser.name;
  const OS = `${userAgent.os.name}(${userAgent.os.version})`;
  const subject = "Password Reset Request";
  const send_to = user.email;
  const sent_from = process.env.EMAIL_USER;

  try {
    const body = message(
      resetUrl,
      user.username,
      user.email,
      device,
      browser,
      OS
    );
    await sendEmail(subject, body, send_to, sent_from);

    res.status(200).json({
      status: "success",
      message: "Password reset email sent",
    });
  } catch (error) {
    res.status(500).json({
      status: "fail",
      message: `Email not sent. please try again!`,
    });
  }
});

exports.resetPassword = handleAsync(async (req, res, next) => {
  const { token } = req.params;
  const { password } = req.body;

  if (!password) {
    return next(new GlobalError("Please provide your new password", 400));
  }

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  // console.log(hashedToken);

  const userToken = await Token.findOne({
    token: hashedToken,
    expiresAt: { $gt: Date.now() },
  });

  if (!userToken) {
    return next(new GlobalError("Invalid or expired token", 400));
  }

  const user = await User.findOne({ _id: userToken.userId });

  user.password = password;

  await user.save();

  // await Token.deleteOne();

  res.status(200).json({
    status: "success",
    message: "Your have successfully reset your password",
  });
});
