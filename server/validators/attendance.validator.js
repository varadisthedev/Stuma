const { body, param, validationResult } = require("express-validator");

const validate = (validations) => {
    return async (req, res, next) => {
        for (let validation of validations) {
            await validation.run(req);
        }

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: errors.array(),
            });
        }
        next();
    };
};

exports.markAttendanceValidation = validate([
    body("class").isMongoId().withMessage("Invalid class ID"),
    body("date")
        .notEmpty()
        .withMessage("Date is required")
        .isISO8601()
        .withMessage("Date must be in ISO 8601 format"),
    body("records")
        .isArray({ min: 1 })
        .withMessage("At least one student record is required"),
    body("records.*.student").isMongoId().withMessage("Invalid student ID"),
    body("records.*.status")
        .isIn(["present", "absent"])
        .withMessage("Status must be either 'present' or 'absent'"),
]);

exports.classIdParamValidation = validate([
    param("classId").isMongoId().withMessage("Invalid class ID"),
]);

exports.attendanceIdParamValidation = validate([
    param("attendanceId").isMongoId().withMessage("Invalid attendance ID"),
]);
