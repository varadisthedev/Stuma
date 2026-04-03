const mongoose = require("mongoose");

const classSchema = new mongoose.Schema(
  {
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    date: {
      type: String, // "YYYY-MM-DD"
      required: true,
      default: () => new Date().toISOString().split('T')[0],
    },
    day: {
      type: String, // "Monday", "Tuesday" etc
      required: true,
      enum: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ],
    },
    startTime: {
      type: String, // "10:00" format
      required: true,
      match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, // HH:MM format
    },
    endTime: {
      type: String, // "11:00" format
      required: true,
      match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, // HH:MM format
    },
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    assignedVolunteer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    youtubeLink: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

// Index for efficient querying by teacher and day
classSchema.index({ admin: 1, day: 1 });

module.exports = mongoose.model("Class", classSchema);
