const cloudinary = require('../config/cloudinary');
const ClassPhoto = require('../models/ClassPhoto');
const User = require('../models/User');

/**
 * Upload a class capture photo (volunteer webcam only)
 * Body: { imageBase64, classId, location: {lat,lng,accuracy,address}, takenAt, metadata }
 */
exports.uploadClassPhoto = async (req, res) => {
  try {
    console.log('[PHOTO] Upload request from user:', req.userId);
    const { imageBase64, classId, location, takenAt, metadata } = req.body;

    if (!imageBase64 || !classId) {
      return res.status(400).json({ success: false, message: 'Image and classId are required.' });
    }
    if (!imageBase64.startsWith('data:image/')) {
      return res.status(400).json({ success: false, message: 'Invalid image format. Must be base64 data URI.' });
    }

    console.log('[PHOTO] Uploading to Cloudinary...');
    const uploadResult = await cloudinary.uploader.upload(imageBase64, {
      folder: 'stuma/class-captures',
      resource_type: 'image',
      transformation: [
        { width: 1280, crop: 'limit' }, // cap resolution
        { quality: 'auto:good' },
      ],
    });
    console.log('[PHOTO] Cloudinary upload success. publicId:', uploadResult.public_id);

    const photo = await ClassPhoto.create({
      volunteer: req.userId,
      class: classId,
      imageUrl: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      location: location || {},
      takenAt: takenAt ? new Date(takenAt) : new Date(),
      metadata: metadata || {},
    });

    await photo.populate([
      { path: 'volunteer', select: 'name email profilePicUrl' },
      { path: 'class', select: 'subject date startTime endTime' },
    ]);

    console.log('[PHOTO] ClassPhoto record created:', photo._id);
    res.status(201).json({ success: true, photo });
  } catch (err) {
    console.error('[PHOTO] Upload error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Get all class photos for admin gallery
 */
exports.getGallery = async (req, res) => {
  try {
    console.log('[PHOTO] Admin gallery request from:', req.userId);
    const user = await User.findById(req.userId);
    if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    let query = {};
    if (user.role === 'volunteer') {
      // Volunteers only see their own photos
      query.volunteer = req.userId;
    }

    const photos = await ClassPhoto.find(query)
      .populate('volunteer', 'name email profilePicUrl')
      .populate('class', 'subject date startTime endTime day')
      .sort({ takenAt: -1 })
      .limit(200);

    console.log('[PHOTO] Returning', photos.length, 'photos');
    res.json({ success: true, photos });
  } catch (err) {
    console.error('[PHOTO] Gallery error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Get photos for a specific class
 */
exports.getPhotosByClass = async (req, res) => {
  try {
    const { classId } = req.params;
    console.log('[PHOTO] Photos for class:', classId);
    const photos = await ClassPhoto.find({ class: classId })
      .populate('volunteer', 'name profilePicUrl')
      .sort({ takenAt: -1 });
    res.json({ success: true, photos });
  } catch (err) {
    console.error('[PHOTO] Class photos error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Upload profile picture for any user (admin or volunteer)
 */
exports.uploadProfilePic = async (req, res) => {
  try {
    console.log('[PROFILE PIC] Upload for user:', req.userId);
    const { imageBase64 } = req.body;

    if (!imageBase64 || !imageBase64.startsWith('data:image/')) {
      return res.status(400).json({ success: false, message: 'Invalid image.' });
    }

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    // Delete old profile pic from Cloudinary if it exists
    if (user.profilePicPublicId) {
      console.log('[PROFILE PIC] Deleting old pic:', user.profilePicPublicId);
      await cloudinary.uploader.destroy(user.profilePicPublicId).catch(e =>
        console.warn('[PROFILE PIC] Failed to delete old pic:', e.message)
      );
    }

    console.log('[PROFILE PIC] Uploading to Cloudinary...');
    const uploadResult = await cloudinary.uploader.upload(imageBase64, {
      folder: 'stuma/profile-pics',
      resource_type: 'image',
      transformation: [
        { width: 400, height: 400, crop: 'fill', gravity: 'face' },
        { quality: 'auto:good' },
      ],
    });
    console.log('[PROFILE PIC] Upload success. URL:', uploadResult.secure_url);

    user.profilePicUrl = uploadResult.secure_url;
    user.profilePicPublicId = uploadResult.public_id;
    await user.save();

    res.json({
      success: true,
      profilePicUrl: uploadResult.secure_url,
      message: 'Profile picture updated.',
    });
  } catch (err) {
    console.error('[PROFILE PIC] Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Update user profile info (name, phone)
 */
exports.updateProfile = async (req, res) => {
  try {
    console.log('[PROFILE] Update for user:', req.userId);
    const { name, phone } = req.body;

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    if (name) user.name = name.trim();
    if (phone !== undefined) user.phone = phone.trim();
    await user.save();

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        profilePicUrl: user.profilePicUrl,
      },
    });
  } catch (err) {
    console.error('[PROFILE] Update error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Get current user profile
 */
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password -profilePicPublicId');
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
