/** Controller layer: request/response handling; delegates to service. */
import { Request, Response } from "express";
import { bookingServices } from "./bookings.service";

const createBooking = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id as string | undefined;
    const role = req.user?.role as string | undefined;
    const result = await bookingServices.createBooking(req.body, userId, role);

    res.status(201).json({
      success: true,
      message: "Booking created",
      data: result.rows[0],
    });
  } catch (err: any) {
    const status = err?.code === "CUSTOMER_ID_REQUIRED" || err?.code === "VEHICLE_NOT_FOUND" ? 400 : 500;
    res.status(status).json({
      success: false,
      message: err?.message ?? "Failed to create booking",
    });
  }
};

const getBookings = async (req: Request, res: Response) => {
  try {
    const customerId = req.user?.role === "customer" ? (req.user.id as string) : undefined;
    const result = await bookingServices.getBookings(customerId);

    res.status(200).json({
      success: true,
      message: "Bookings retrieved successfully",
      data: result.rows,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

const getSingleBooking = async (req: Request, res: Response) => {
  try {
    const customerId = req.user?.role === "customer" ? (req.user.id as string) : undefined;
    const result = await bookingServices.getSingleBooking(req.params.bookingId as string, customerId);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Booking fetched successfully",
      data: result.rows[0],
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: err?.message ?? "Failed to fetch booking",
    });
  }
};

const updateBooking = async (req: Request, res: Response) => {
  try {
    const customerId = req.user?.role === "customer" ? (req.user.id as string) : undefined;
    const result = await bookingServices.updateBooking(
      req.body,
      req.params.bookingId as string,
      customerId
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Booking updated successfully",
      data: result.rows[0],
    });
  } catch (err: any) {
    const code = err?.code;
    const status =
      code === "CUSTOMER_CAN_ONLY_CANCEL" || code === "CANCEL_ONLY_BEFORE_START" ? 400 : 500;
    res.status(status).json({
      success: false,
      message: err?.message ?? "Failed to update booking",
    });
  }
};

const deleteBooking = async (req: Request, res: Response) => {
  try {
    const customerId = req.user?.role === "customer" ? (req.user.id as string) : undefined;
    const result = await bookingServices.deleteBooking(req.params.bookingId as string, customerId);

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Booking deleted successfully",
      data: null,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: err?.message ?? "Failed to delete booking",
    });
  }
};

export const bookingControllers = {
  createBooking,
  getBookings,
  getSingleBooking,
  updateBooking,
  deleteBooking,
};
