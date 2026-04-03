const mongoose = require('mongoose');

const classPhotoSchema = new mongoose.Schema({
  volunteer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  class: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true,
  },
  imageUrl: {
    type: String,
    required: true,
  },
  publicId: {
    type: String, // Cloudinary public ID for deletions
    required: true,
  },
  location: {
    lat: { type: Number, default: null },
    lng: { type: Number, default: null },
    accuracy: { type: Number, default: null },
    address: { type: String, default: '' },
  },
  takenAt: {
    type: Date,
    required: true,
  },
  metadata: {
    classDate: String,
    classTime: String,  // HH:MM-HH:MM
    subject: String,
  },
}, { timestamps: true });

module.exports = mongoose.model('ClassPhoto', classPhotoSchema);
