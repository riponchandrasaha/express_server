import { Router } from "express";
import { bookingControllers } from "./bookings.controller";

const router = Router();

router.post("/", bookingControllers.createBooking);
router.get("/", bookingControllers.getBookings);
router.get("/:id", bookingControllers.getSingleBooking);
router.put("/:id", bookingControllers.updateBooking);
router.delete("/:id", bookingControllers.deleteBooking);

export const bookingRoutes = router;
