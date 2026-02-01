import { Request, Response } from "express";
import { bookingServices } from "./bookings.service";

const createBooking = async (req: Request, res: Response) => {
  try {
    const result = await bookingServices.createBooking(req.body);

    res.status(201).json({
      success: true,
      message: "Booking created",
      data: result.rows[0],
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

const getBookings = async (req: Request, res: Response) => {
  try {
    const result = await bookingServices.getBookings();

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
    const result = await bookingServices.getSingleBooking(req.params.id as string);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Booking not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Failed to fetch booking" });
  }
};

const updateBooking = async (req: Request, res: Response) => {
  try {
    const result = await bookingServices.updateBooking(req.body, req.params.id as string);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Booking not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Failed to update booking" });
  }
};

const deleteBooking = async (req: Request, res: Response) => {
  try {
    const result = await bookingServices.deleteBooking(req.params.id as string);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Booking not found" });
    }

    res.json({ success: true, message: "Booking deleted", data: null });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Failed to delete booking" });
  }
};

export const bookingControllers = {
  createBooking,
  getBookings,
  getSingleBooking,
  updateBooking,
  deleteBooking,
};
