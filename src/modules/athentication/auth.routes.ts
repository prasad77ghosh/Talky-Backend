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
  authController.forgotPassword,
);

router.get("/verify-mail", authController.verifyUser);

router.post(
  "/login-phone",
  AuthControllerValidator.loginWithPhoneValidator,
  authController.loginWithPhone,
);

router.post(
  "/verify-otp",
  AuthControllerValidator.verifyPhoneOtpValidator,
  authController.verifyPhoneOtp,
);

router.post(
  "/login",
  AuthControllerValidator.loginValidator,
  authController.login,
);
router.post("/logout", authController.logout);

export default router;
