/** Routes layer: HTTP endpoints and middleware only; delegates to controller. */
import { Router } from "express";
import auth from "../../middleware/auth";
import { vehicleControllers } from "./vehicles.controller";

const router = Router();

router.post("/", auth("admin"), vehicleControllers.createVehicle);           // Admin only: add new vehicle
router.get("/", vehicleControllers.getVehicles);                            // Public: view all vehicles
router.get("/:vehicleId", vehicleControllers.getSingleVehicle);              // Public: view specific vehicle
router.put("/:vehicleId", auth("admin"), vehicleControllers.updateVehicle); // Admin only: update vehicle
router.delete("/:vehicleId", auth("admin"), vehicleControllers.deleteVehicle); // Admin only: delete (if no active bookings)

export const vehicleRoutes = router;
