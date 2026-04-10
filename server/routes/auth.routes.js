const express = require("express");
const controller = require("../controllers/auth.controller");
const {
    registerValidation,
    loginValidation,
} = require("../validators/auth.validator");

const router = express.Router();

router.post("/register", registerValidation, controller.register);
router.post("/login", loginValidation, controller.login);
router.get("/volunteers", require("../middleware/auth.middleware"), controller.getVolunteers);
router.post("/volunteers", require("../middleware/auth.middleware"), controller.createVolunteer);
router.put("/volunteers/:id", require("../middleware/auth.middleware"), controller.updateVolunteer);
router.delete("/volunteers/:id", require("../middleware/auth.middleware"), controller.deleteVolunteer);

module.exports = router;
