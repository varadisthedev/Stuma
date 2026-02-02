const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    rollNo: {
      type: String,
      required: true,
    },
    section: {
      type: String,
      required: true,
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
      required: true,
    },
  },
  { timestamps: true },
);

// ✅ CORRECT UNIQUE INDEX
studentSchema.index({ teacher: 1, section: 1, rollNo: 1 }, { unique: true });

module.exports = mongoose.model("Student", studentSchema);
