const { body, validationResult } = require("express-validator");

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

exports.addStudentValidation = validate([
    body("name")
        .trim()
        .notEmpty()
        .withMessage("Name is required")
        .isLength({ min: 2 })
        .withMessage("Name must be at least 2 characters"),
    body("rollNo")
        .trim()
        .notEmpty()
        .withMessage("Roll number is required")
        .isLength({ min: 1 })
        .withMessage("Roll number must be at least 1 character"),
]);
