const Alert = require('../models/Alert');

// POST /api/alerts — Admin sends a global alert
exports.createAlert = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only admins can send alerts' });
    }
    const { message, type } = req.body;
    if (!message?.trim()) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    const alert = await Alert.create({
      sender: req.user._id,
      senderName: req.user.name,
      message: message.trim(),
      type: type || 'info',
    });

    res.status(201).json({ success: true, alert });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/alerts — Fetch all active alerts (latest 50)
exports.getAlerts = async (req, res) => {
  try {
    const alerts = await Alert.find().sort({ createdAt: -1 }).limit(50);
    res.json({ success: true, alerts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
