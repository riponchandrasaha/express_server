/** Controller layer: request/response handling; delegates to service. */
import { Request, Response } from "express";
import { userServices } from "./user.service";

const createUser = async (req: Request, res: Response) => {
  try {
    const result = await userServices.createUser(req.body);

    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: result.rows[0],
    });
  } catch (err: any) {
    const status = err?.code === "PASSWORD_TOO_SHORT" ? 400 : 500;
    res.status(status).json({
      success: false,
      message: err.message,
    });
  }
};

const getUser = async (req: Request, res: Response) => {
  try {
    const result = await userServices.getUser();

    res.status(200).json({
      success: true,
      message: "Users retrieved successfully",
      data: result.rows,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

const getSingleUser = async (req: Request, res: Response) => {
  try {
    if (req.user?.role === "customer" && req.params.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: you can only view your own profile",
      });
    }
    const result = await userServices.getSingleUser(req.params.userId as string);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "User fetched successfully",
      data: result.rows[0],
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

const updateUser = async (req: Request, res: Response) => {
  try {
    if (req.user?.role === "customer" && req.params.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: you can only update your own profile",
      });
    }
    const result = await userServices.updateUser(req.body, req.params.userId as string);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: result.rows[0],
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

const deleteUser = async (req: Request, res: Response) => {
  try {
    const result = await userServices.deleteUser(req.params.userId as string);

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
      data: null,
    });
  } catch (err: any) {
    const status = err?.code === "ACTIVE_BOOKINGS" ? 400 : 500;
    res.status(status).json({
      success: false,
      message: err.message,
    });
  }
};

export const userControllers = {
  createUser,
  getUser,
  getSingleUser,
  updateUser,
  deleteUser,
};
