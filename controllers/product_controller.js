const GlobalError = require("../utils/global_error");
const handleAsync = require("../utils/handle_async");
const Product = require("../models/product_model");
const cloudinary = require("cloudinary").v2;
const { upload, fileSizeFormatter } = require("../utils/file_upload");

exports.createProduct = handleAsync(async (req, res, next) => {
  const { name, sku, category, quantity, price, description } = req.body;

  if (!name || !sku || !category || !quantity || !price || !description) {
    return next(new GlobalError("Please fill all required fields", 400));
  }

  let fileData = {};

  if (req.file) {
    // save to cloudinary
    let uploadedFile;
    try {
      uploadedFile = await cloudinary.uploader.upload(req.file.path, {
        folder: "Pinvent",
        resource_type: "image",
      });
    } catch (error) {
      return next(
        new GlobalError("Image could not be uploaded, please try again", 500)
      );
    }

    fileData = {
      fileName: req.file.originalname,
      filePath: uploadedFile.secure_url,
      fileType: req.file.mimetype,
      fileSize: fileSizeFormatter(req.file.size, 2),
    };
  }

  const product = await Product.create({
    user: req.user.id,
    name,
    category,
    sku,
    price,
    description,
    quantity,
    image: fileData,
  });

  res.status(201).json({
    status: "success",
    data: product,
  });
});

exports.getUserProducts = handleAsync(async (req, res, next) => {
  const products = await Product.find({ user: req.user._id }).sort(
    "-createdAt"
  );

  res.status(200).json({
    status: "success",
    results: products.length,
    data: products,
  });
});

exports.getAllProducts = handleAsync(async (req, res, next) => {
  const products = await Product.find().sort("-createdAt");

  res.status(200).json({
    status: "success",
    results: products.length,
    data: products,
  });
});

exports.getSingleProduct = handleAsync(async (req, res, next) => {
  const { productId } = req.params;

  const product = await Product.findById(productId);

  if (!product) {
    return next(new GlobalError(`No product with that id exists`, 404));
  }

  if (product.user.toString() !== req.user._id.toString()) {
    return next(new GlobalError(`Unauthorized`, 401));
  }

  res.status(200).json({
    status: "success",
    data: product,
  });
});

exports.updateProduct = handleAsync(async (req, res, next) => {
  const { productId } = req.params;
  const { name, category, quantity, price, description, image } = req.body;

  const product = await Product.findById(productId);

  if (!product) {
    return next(new GlobalError(`No product with that id exists`, 404));
  }

  if (product.user.toString() !== req.user._id.toString()) {
    return next(new GlobalError(`Unauthorized`, 401));
  }

  let fileData = {};
  if (req.file) {
    // save to cloudinary
    let uploadedFile;
    try {
      uploadedFile = await cloudinary.uploader.upload(req.file.path, {
        folder: "Pinvent",
        resource_type: "image",
      });
    } catch (error) {
      return next(
        new GlobalError("Image could not be uploaded, please try again", 500)
      );
    }

    fileData = {
      fileName: req.file.originalname,
      filePath: uploadedFile.secure_url,
      fileType: req.file.mimetype,
      fileSize: fileSizeFormatter(req.file.size, 2),
    };
  }

  const request_body = {
    name,
    description,
    price,
    category,
    quantity,
    image: Object.keys(fileData).length === 0 ? product?.image : fileData,
  };

  const updatedProduct = await Product.findByIdAndUpdate(
    productId,
    request_body,
    {
      new: true,
      runValidators: true,
    }
  );

  res.status(200).json({
    status: "success",
    data: updatedProduct,
  });
});

exports.deleteProduct = handleAsync(async (req, res, next) => {
  const { productId } = req.params;

  const product = await Product.findById(productId);

  if (!product) {
    return next(new GlobalError(`No product with that id exists`, 404));
  }

  if (product.user.toString() !== req.user._id.toString()) {
    return next(new GlobalError(`Unauthorized`, 401));
  }

  await Product.findByIdAndDelete(productId);

  res.status(200).json({
    status: "success",
    message: "Product successfully deleted",
  });
});

exports.uploadProductPhoto = upload.single("image");
