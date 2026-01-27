const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    rollNo: {
      type: String,
      required: true,
      trim: true,
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
      required: true,
    },
  },
  { timestamps: true }
);

// Compound unique index: same roll number cannot exist for same teacher
studentSchema.index({ teacher: 1, rollNo: 1 }, { unique: true });

module.exports = mongoose.model("Student", studentSchema);
