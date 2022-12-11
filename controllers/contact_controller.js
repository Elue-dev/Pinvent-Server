const User = require("../models/user_model");
const GlobalError = require("../utils/global_error");
const handleAsync = require("../utils/handle_async");
const sendEmail = require("../utils/send_email");

exports.contactUs = handleAsync(async (req, res, next) => {
  const { message, subject } = req.body;

  const user = await User.findById(req.user._id);

  if (!message || !subject) {
    return next(new GlobalError("Please enter both subject and message", 400));
  }

  if (!user) {
    return next(new GlobalError("User not found, please sign up", 400));
  }

  const send_to = process.env.ADMIN;
  const sent_from = process.env.EMAIL_USER;
  const reply_to = user.email;

  try {
    await sendEmail(subject, message, send_to, sent_from, reply_to);

    res.status(200).json({
      status: "success",
      message: `Email sent. Thank you for contacting us, ${user.username}!`,
    });
  } catch (error) {
    res.status(500).json({
      status: "fail",
      message: `Email not sent. please try again!`,
    });
  }
});
