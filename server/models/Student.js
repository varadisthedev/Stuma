const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    rollNo: { type: String, required: true, trim: true },
    section: { type: String, required: true, trim: true },
    phone: { type: String, trim: true, default: '' },
    parentPhone: { type: String, trim: true, default: '' },
    notes: { type: String, trim: true, default: '' },
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);
studentSchema.index({ admin: 1, section: 1, rollNo: 1 }, { unique: true });
module.exports = mongoose.model("Student", studentSchema);
