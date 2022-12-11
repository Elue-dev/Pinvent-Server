const express = require("express");
const { contactUs } = require("../controllers/contact_controller");
const { requireAuth } = require("../middleware/require_auth");

const router = express.Router();

router.route("/").post(requireAuth, contactUs);

module.exports = router;
