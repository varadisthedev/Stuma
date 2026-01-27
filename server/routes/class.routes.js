const express = require("express");
const controller = require("../controllers/class.controller");
const auth = require("../middleware/auth.middleware");
const { createClassValidation } = require("../validators/class.validator");

const router = express.Router();

// Create class
router.post("/", auth, createClassValidation, controller.createClass);

// Get all classes for the teacher
router.get("/", auth, controller.getAllClasses);

// Get today's classes
router.get("/today", auth, controller.getTodayClasses);

// Get currently running class
router.get("/current", auth, controller.getCurrentClass);

module.exports = router;
