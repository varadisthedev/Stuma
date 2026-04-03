const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
  {
    class: { type: mongoose.Schema.Types.ObjectId, ref: "Class", required: true },
    admin: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    takenBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // volunteer who took it
    date: { type: Date, required: true },
    note: { type: String, trim: true, default: '' }, // optional volunteer note
    records: [
      {
        student: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
        status: { type: String, enum: ["present", "absent"], required: true },
      },
    ],
  },
  { timestamps: true }
);

attendanceSchema.index({ class: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("Attendance", attendanceSchema);
