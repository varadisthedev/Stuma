const mongoose = require("mongoose");

const teacherSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: String,
});

module.exports = mongoose.model("Teacher", teacherSchema);
