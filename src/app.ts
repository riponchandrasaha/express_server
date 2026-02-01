import express, { Request, Response } from "express";
import initDB from "./config/db";
import logger from "./middleware/logger";
import { authRoutes } from "./modules/auth/auth.routes";
import { bookingRoutes } from "./modules/bookings/bookings.routes";
import { userRoutes } from "./modules/user/user.routes";
import { vehicleRoutes } from "./modules/vehicles/vehicles.routes";

const app = express();

app.use(express.json());

initDB();

app.get("/", logger, (req: Request, res: Response) => {
  res.send("Hello Next Level Developers!");
});

app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/vehicles", vehicleRoutes);
app.use("/bookings", bookingRoutes);

app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    path: req.path,
  });
});

export default app;