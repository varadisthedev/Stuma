const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const controller = require('../controllers/photo.controller');

// Class capture photo upload (volunteer - webcam only, no manual upload)
router.post('/capture', auth, controller.uploadClassPhoto);

// Get the full gallery (admin sees all, volunteer sees own)
router.get('/gallery', auth, controller.getGallery);

// Get photos for a specific class
router.get('/class/:classId', auth, controller.getPhotosByClass);

// Profile picture upload
router.post('/profile-pic', auth, controller.uploadProfilePic);

// Update profile info (name, phone)
router.patch('/profile', auth, controller.updateProfile);

// Get own profile
router.get('/profile', auth, controller.getProfile);

module.exports = router;
