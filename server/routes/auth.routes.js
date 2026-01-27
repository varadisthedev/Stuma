const express = require("express");
const controller = require("../controllers/auth.controller");
const {
    registerValidation,
    loginValidation,
} = require("../validators/auth.validator");

const router = express.Router();

router.post("/register", registerValidation, controller.register);
router.post("/login", loginValidation, controller.login);

module.exports = router;
