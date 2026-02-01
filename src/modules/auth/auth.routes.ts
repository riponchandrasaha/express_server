/** Routes layer: HTTP endpoints and middleware only; delegates to controller. */
import { Router } from "express";
import { authController } from "./auth.controller";

const router = Router();

// Public: no auth required
router.post("/signup", authController.registerUser);   // Register new user account
router.post("/signin", authController.loginUser);       // Login and receive JWT token

export const authRoutes = router;