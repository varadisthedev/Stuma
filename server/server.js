require("dotenv").config();
const mongoose = require("mongoose");
const app = require("./app");

if (!process.env.MONGO_URI) {
  console.error("CRITICAL ERROR: MONGO_URI is not defined in environment variables.");
  process.exit(1);
}

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(process.env.PORT || 5000, "0.0.0.0", () => {
      console.log("Server running on port 5000");
    });
  })
  .catch((err) => {
    console.error("Mongo error:", err);
  });
