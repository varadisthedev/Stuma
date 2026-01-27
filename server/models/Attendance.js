const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema({
  class: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Class",
    required: true,
  },

  date: {
    type: Date,
    required: true,
  },

  records: [
    {
      student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student",
      },
      status: {
        type: String,
        enum: ["present", "absent"],
        required: true,
      },
    },
  ],
});

module.exports = mongoose.model("Attendance", attendanceSchema);
