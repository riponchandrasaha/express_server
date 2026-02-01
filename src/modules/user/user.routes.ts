/** Routes layer: HTTP endpoints and middleware only; delegates to controller. */
import express from "express";
import { userControllers } from "./user.controller";
import logger from "../../middleware/logger";
import auth from "../../middleware/auth";

const router = express.Router();

router.post("/", auth("admin"), userControllers.createUser);

router.get("/", logger, auth("admin"), userControllers.getUser);                    // Admin only: view all users
router.get("/:userId", auth("admin", "customer"), userControllers.getSingleUser);   // Admin or Own: view user/profile
router.put("/:userId", auth("admin", "customer"), userControllers.updateUser);     // Admin or Own: update role/details or own profile
router.delete("/:userId", auth("admin"), userControllers.deleteUser);              // Admin only: delete user (only if no active bookings)

export const userRoutes = router;