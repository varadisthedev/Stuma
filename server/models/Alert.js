const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  senderName: { type: String, required: true },
  message: { type: String, required: true, trim: true },
  type: { type: String, default: 'info' }, // e.g., info, warning, urgent
}, { timestamps: true });

module.exports = mongoose.model('Alert', alertSchema);
