const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already registered",
      });
    }

    // Hash password
    const hashed = await bcrypt.hash(password, 10);

    // Create user (defaults to admin)
    const user = await User.create({
      name,
      email,
      password: hashed,
      role: "admin",
    });

    res.status(201).json({
      success: true,
      message: "User created successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePicUrl: user.profilePicUrl,
        phone: user.phone
      },
      teacher: { // legacy support
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePicUrl: user.profilePicUrl
      },
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({
      success: false,
      message: "Server error during registration",
      error: err.message,
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Check if the requested role matches the database role
    if (role && user.role !== role) {
      return res.status(403).json({
        success: false,
        message: `Account is not registered as a ${role}`,
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Generate token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.json({
      success: true,
      token,
      teacher: { // keep the response key as teacher to avoid breaking everything on frontend until updated
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePicUrl: user.profilePicUrl,
        phone: user.phone
      },
      user: { // and also provide 'user' for updated frontend code
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePicUrl: user.profilePicUrl,
        phone: user.phone
      }
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({
      success: false,
      message: "Server error during login",
      error: err.message,
    });
  }
};

exports.devRegister = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already registered",
      });
    }

    // Hash password
    const hashed = await bcrypt.hash(password, 10);

    // Create user with explicit role
    const user = await User.create({
      name,
      email,
      password: hashed,
      role: role || "teacher"
    });

    res.status(201).json({
      success: true,
      message: "Dev User created successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePicUrl: user.profilePicUrl,
        phone: user.phone
      },
      teacher: { // legacy support
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePicUrl: user.profilePicUrl
      },
    });
  } catch (err) {
    console.error("Dev Register error:", err);
    res.status(500).json({
      success: false,
      message: "Server error during dev registration",
      error: err.message,
    });
  }
};

exports.getVolunteers = async (req, res) => {
  try {
    const volunteers = await User.find({ role: 'volunteer' }).select('name email profilePicUrl phone createdAt');
    res.json({ success: true, volunteers });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error during fetching volunteers" });
  }
};

exports.createVolunteer = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email and password are required' });
    }
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ success: false, message: 'Email already registered' });

    const bcrypt = require('bcryptjs');
    const hashed = await bcrypt.hash(password, 10);
    const volunteer = await User.create({ name, email, password: hashed, role: 'volunteer' });

    res.status(201).json({
      success: true,
      volunteer: { id: volunteer._id, name: volunteer.name, email: volunteer.email, role: volunteer.role },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateVolunteer = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, password } = req.body;

    const user = await User.findOne({ _id: id, role: 'volunteer' });
    if (!user) return res.status(404).json({ success: false, message: 'Volunteer not found' });

    if (name) user.name = name;
    if (email) user.email = email;
    if (phone !== undefined) user.phone = phone;
    
    if (password) {
      const bcrypt = require('bcryptjs');
      user.password = await bcrypt.hash(password, 10);
    }
    
    await user.save();
    
    res.json({ success: true, volunteer: { _id: user._id, name: user.name, email: user.email, profilePicUrl: user.profilePicUrl, phone: user.phone } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteVolunteer = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findOneAndDelete({ _id: id, role: 'volunteer' });
    if (!user) return res.status(404).json({ success: false, message: 'Volunteer not found' });
    
    res.json({ success: true, message: 'Volunteer deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

