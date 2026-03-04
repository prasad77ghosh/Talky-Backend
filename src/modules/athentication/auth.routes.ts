import { Router } from "express";
import { authController } from "./auth.controller";
import { AuthControllerValidator } from "./auth.validator";

const router = Router();

router.post(
    "/register",
    AuthControllerValidator.registerValidator,
    authController.registerWithUsername,
);

router.post(
    "/forgot-password",
    AuthControllerValidator.forgotPasswordValidator,
    authController.forgotPassword
);

// Other routes will be added here
router.get("/verify-mail", authController.verifyUser);
// router.post("/login", AuthControllerValidator.loginValidator, authController.login);
// router.post("/reset-password", authController.resetPassword);

export default router;
