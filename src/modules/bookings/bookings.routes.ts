/** Routes layer: HTTP endpoints and middleware only; delegates to controller. */
import { Router } from "express";
import auth from "../../middleware/auth";
import { bookingControllers } from "./bookings.controller";

const router = Router();

router.post("/", auth("admin", "customer"), bookingControllers.createBooking);           // Customer or Admin: create booking (validates availability, price, sets vehicle booked)
router.get("/", auth("admin", "customer"), bookingControllers.getBookings);              // Role-based: Admin all, Customer own only
router.get("/:bookingId", auth("admin", "customer"), bookingControllers.getSingleBooking);
router.put("/:bookingId", auth("admin", "customer"), bookingControllers.updateBooking);  // Role-based: Customer cancel before start; Admin mark returned; System auto-return
router.delete("/:bookingId", auth("admin", "customer"), bookingControllers.deleteBooking);

export const bookingRoutes = router;
