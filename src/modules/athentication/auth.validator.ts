import { body } from "express-validator";
import { AppError } from "../../common/error/app-error";

export const AuthControllerValidator = {
    registerValidator: [
        body("name")
            .notEmpty()
            .withMessage("name is required")
            .bail()
            .isString()
            .withMessage("name must be string"),
        body("email")
            .notEmpty()
            .withMessage("email is required")
            .bail()
            .isEmail()
            .withMessage("email must be valid mail"),
        body("password")
            .notEmpty()
            .withMessage("password is required")
            .bail()
            .isLength({ min: 8 }),
        body("confirmPassword")
            .notEmpty()
            .withMessage("confirmPassword is required")
            .bail()
            .custom((value, { req }) => {
                if (value !== req.body.password) {
                    throw new AppError("Password and confirmPassword doesn't match", 500);
                }
                return true;
            }),
    ],
    forgotPasswordValidator: [
        body("email")
            .notEmpty()
            .withMessage("email is required")
            .bail()
            .isEmail()
            .withMessage("email must be valid mail"),
    ],
    loginWithPhoneValidator: [
        body("phone")
            .notEmpty()
            .withMessage("phone number is required")
            .bail()
            .isMobilePhone("any")
            .withMessage("invalid phone number format"),
    ],
    verifyPhoneOtpValidator: [
        body("phone")
            .notEmpty()
            .withMessage("phone number is required")
            .bail()
            .isMobilePhone("any")
            .withMessage("invalid phone number format"),
        body("otp")
            .notEmpty()
            .withMessage("OTP is required")
            .bail()
            .isLength({ min: 6, max: 6 })
            .withMessage("OTP must be 6 digits"),
    ],
    loginValidator: [
        body("email")
            .notEmpty()
            .withMessage("email is required")
            .bail()
            .isEmail()
            .withMessage("email must be valid mail"),
        body("password")
            .notEmpty()
            .withMessage("password is required")
            .bail()
            .isLength({ min: 8 })
            .withMessage("password must be at least 8 characters"),
    ],
};
