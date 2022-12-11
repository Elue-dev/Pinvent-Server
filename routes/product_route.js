const express = require("express");

const router = express.Router();

const {
  createProduct,
  getUserProducts,
  uploadProductPhoto,
  getAllProducts,
  getSingleProduct,
  deleteProduct,
  updateProduct,
} = require("../controllers/product_controller");

const { requireAuth, restrictTo } = require("../middleware/require_auth");

router
  .route("/")
  .get(requireAuth, getUserProducts)
  .post(requireAuth, uploadProductPhoto, createProduct);

router.get("/all", requireAuth, restrictTo("admin"), getAllProducts);

router
  .route("/:productId")
  .get(requireAuth, getSingleProduct)
  .patch(requireAuth, uploadProductPhoto, updateProduct)
  .delete(requireAuth, deleteProduct);

module.exports = router;
