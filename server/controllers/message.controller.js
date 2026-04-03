const Message = require('../models/Message');

// POST /api/messages — volunteer sends a message
exports.sendMessage = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ success: false, message: 'Message text is required' });

    const msg = await Message.create({
      sender: req.user._id,
      senderName: req.user.name,
      text: text.trim(),
    });

    res.status(201).json({ success: true, message: msg });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/messages — admin reads all messages
exports.getMessages = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admins only' });
    }
    const messages = await Message.find().sort({ createdAt: -1 }).populate('sender', 'name email');
    res.json({ success: true, messages });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/messages/:id/read — mark as read
exports.markRead = async (req, res) => {
  try {
    await Message.findByIdAndUpdate(req.params.id, { isRead: true });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
