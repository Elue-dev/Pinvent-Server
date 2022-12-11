const dotenv = require("dotenv");
const mongoose = require("mongoose");

dotenv.config({ path: ".env" });

const app = require("./app");

const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Database connected successfully!");
    app.listen(PORT, () => console.log(`server running on port ${PORT}`));
  })
  .catch((error) => {
    console.log(error);
  });

module.exports = app;
