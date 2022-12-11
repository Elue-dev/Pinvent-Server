const express = require("express");

const {
  signup,
  login,
  logout,
  updatePassword,
  forgotPassword,
  resetPassword,
} = require("../controllers/auth_controller");

const {
  getUsers,
  getLoggedInUser,
  getLoginStatus,
  updateUser,
  updateLoggedInUser,
} = require("../controllers/users_controller");

const { requireAuth, restrictTo } = require("../middleware/require_auth");

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.get("/logout", logout);
router.patch("/update-password", requireAuth, updatePassword);
router.post("/forgot-password", forgotPassword);
router.put("/reset-password/:token", resetPassword);
router.patch(
  "/update-user/:userId",
  requireAuth,
  restrictTo("admin"),
  updateUser
);

router.get("/get-me", requireAuth, getLoggedInUser);
router.patch("/update-me", requireAuth, updateLoggedInUser);
router.get("/login-status", getLoginStatus);

router.route("/").get(requireAuth, restrictTo("admin"), getUsers);

module.exports = router;
