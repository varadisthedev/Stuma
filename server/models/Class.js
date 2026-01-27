const mongoose = require("mongoose");

const classSchema = new mongoose.Schema({
  subject: {
    type: String,
    required: true,
  },
  day: {
    type: String, // "Monday", "Tuesday" etc
    required: true,
  },
  startTime: String, // "10:00"
  endTime: String, // "11:00"

  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Teacher",
  },
});

module.exports = mongoose.model("Class", classSchema);
