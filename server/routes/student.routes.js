const express = require("express");
const controller = require("../controllers/student.controller");
const auth = require("../middleware/auth.middleware");
const { addStudentValidation } = require("../validators/student.validator");

const router = express.Router();

// Add student
router.post("/", auth, addStudentValidation, controller.addStudent);

// Get all students for the teacher
router.get("/", auth, controller.getStudents);

module.exports = router;
