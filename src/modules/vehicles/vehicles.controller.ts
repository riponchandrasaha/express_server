/** Controller layer: request/response handling; delegates to service. */
import { Request, Response } from "express";
import { vehicleServices } from "./vehicles.service";

const createVehicle = async (req: Request, res: Response) => {
  try {
    const result = await vehicleServices.createVehicle(req.body);

    res.status(201).json({
      success: true,
      message: "Vehicle created successfully",
      data: result.rows[0],
    });
  } catch (err: any) {
    const status = err?.code === "VALIDATION" || err?.code === "REGISTRATION_EXISTS" ? 400 : 500;
    res.status(status).json({
      success: false,
      message: err?.message ?? "Failed to create vehicle",
    });
  }
};

const getVehicles = async (req: Request, res: Response) => {
  try {
    const result = await vehicleServices.getVehicles();

    res.status(200).json({
      success: true,
      message: "Vehicles retrieved successfully",
      data: result.rows,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

const getSingleVehicle = async (req: Request, res: Response) => {
  try {
    const result = await vehicleServices.getSingleVehicle(req.params.vehicleId as string);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Vehicle fetched successfully",
      data: result.rows[0],
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: err?.message ?? "Failed to fetch vehicle",
    });
  }
};

const updateVehicle = async (req: Request, res: Response) => {
  try {
    const result = await vehicleServices.updateVehicle(req.body, req.params.vehicleId as string);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Vehicle updated successfully",
      data: result.rows[0],
    });
  } catch (err: any) {
    const status = err?.code === "VALIDATION" || err?.code === "REGISTRATION_EXISTS" ? 400 : 500;
    res.status(status).json({
      success: false,
      message: err?.message ?? "Failed to update vehicle",
    });
  }
};

const deleteVehicle = async (req: Request, res: Response) => {
  try {
    const result = await vehicleServices.deleteVehicle(req.params.vehicleId as string);

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Vehicle deleted successfully",
      data: null,
    });
  } catch (err: any) {
    const status = err?.code === "ACTIVE_BOOKINGS" ? 400 : 500;
    res.status(status).json({
      success: false,
      message: err?.message ?? "Failed to delete vehicle",
    });
  }
};

export const vehicleControllers = {
  createVehicle,
  getVehicles,
  getSingleVehicle,
  updateVehicle,
  deleteVehicle,
};
