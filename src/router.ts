import { Router } from "express";
import AuthRoutes from "./modules/athentication/auth.routes";

const router = Router();

// Version 1 of API
const v1Router = Router();

v1Router.use("/auth", AuthRoutes);

// Register versions to main router
router.use("/api/v1", v1Router);

export default router;
