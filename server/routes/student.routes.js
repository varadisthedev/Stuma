const express = require("express");
const controller = require("../controllers/student.controller");
const auth = require("../middleware/auth.middleware");
const { addStudentValidation } = require("../validators/student.validator");

const router = express.Router();

// Add student
router.post("/", auth, controller.addStudent);

// Get all students for the teacher
router.get("/", auth, controller.getAllStudents);

// Get attendance stats for a specific student
router.get("/:studentId/stats", auth, controller.getStudentStats);

module.exports = router;
