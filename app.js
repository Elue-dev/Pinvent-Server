const dotenv = require("dotenv");
const express = require("express");
require("dotenv").config();
const path = require("path");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const GlobalError = require("./utils/global_error");
const errorHandler = require("./controllers/error_controller");

dotenv.config();

const userRouter = require("./routes/user_route");
const productRouter = require("./routes/product_route");
const contactRouter = require("./routes/contact_route");

const app = express();

app.use(
  cors({
    origin: [
      "http://127.0.0.1:5173",
      "https://pinvent-client.vercel.app",
      process.env.CLIENT_URL,
    ],
    credentials: true,
  })
);

app.use(express.json({ limit: "10kb" }));

app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/v1/users", userRouter);
app.use("/api/v1/products", productRouter);
app.use("/api/v1/contact", contactRouter);

app.all("*", (req, res, next) => {
  next(
    new GlobalError(`Oops! Can't find ${req.originalUrl} on this server`, 404)
  );
});

app.use(errorHandler);

module.exports = app;
