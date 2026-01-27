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

exports.createClassValidation = validate([
    body("subject")
        .trim()
        .notEmpty()
        .withMessage("Subject is required")
        .isLength({ min: 2 })
        .withMessage("Subject must be at least 2 characters"),
    body("day")
        .trim()
        .notEmpty()
        .withMessage("Day is required")
        .isIn([
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
            "Sunday",
        ])
        .withMessage("Day must be a valid weekday"),
    body("startTime")
        .trim()
        .notEmpty()
        .withMessage("Start time is required")
        .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .withMessage("Start time must be in HH:MM format (e.g., 10:00)"),
    body("endTime")
        .trim()
        .notEmpty()
        .withMessage("End time is required")
        .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .withMessage("End time must be in HH:MM format (e.g., 11:00)")
        .custom((endTime, { req }) => {
            if (req.body.startTime >= endTime) {
                throw new Error("End time must be after start time");
            }
            return true;
        }),
]);

exports.classIdValidation = validate([
    param("classId").isMongoId().withMessage("Invalid class ID"),
]);
