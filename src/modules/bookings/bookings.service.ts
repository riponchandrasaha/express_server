/** Service layer: business logic and data access; no Express coupling. */
import { pool } from "../../config/db";

/** Mark overdue active bookings as returned and set their vehicles to available. */
const processAutoReturns = async () => {
  const overdue = await pool.query(
    `SELECT id, vehicle_id FROM bookings
     WHERE status = 'active' AND rent_end_date < CURRENT_DATE`
  );
  for (const row of overdue.rows) {
    await pool.query(`UPDATE bookings SET status = 'returned', updated_at = NOW() WHERE id = $1`, [row.id]);
    await pool.query(`UPDATE vehicles SET availability_status = 'available', updated_at = NOW() WHERE id = $1`, [row.vehicle_id]);
  }
};

/** number_of_days = rent_end_date - rent_start_date; total_price = daily_rent_price × number_of_days */
const calculateBookingPrice = (
  dailyRentPrice: number,
  rentStartDate: string | Date,
  rentEndDate: string | Date
): { number_of_days: number; total_price: number } => {
  const start = new Date(rentStartDate);
  const end = new Date(rentEndDate);
  const diffMs = end.getTime() - start.getTime();
  const number_of_days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  const total_price = Math.round(dailyRentPrice * number_of_days * 100) / 100;
  return { number_of_days, total_price };
};

const createBooking = async (
  payload: Record<string, unknown>,
  userId?: string,
  role?: string
) => {
  await processAutoReturns();

  const { vehicle_id, rent_start_date, rent_end_date, status = "active" } = payload;
  const customer_id =
    role === "customer" && userId ? userId : (payload.customer_id as string);
  if (!customer_id) {
    const err = new Error("customer_id is required for admin");
    (err as any).code = "CUSTOMER_ID_REQUIRED";
    throw err;
  }

  const vehicleResult = await pool.query(
    `SELECT daily_rent_price FROM vehicles WHERE id = $1`,
    [vehicle_id]
  );
  if (vehicleResult.rows.length === 0) {
    const err = new Error("Vehicle not found");
    (err as any).code = "VEHICLE_NOT_FOUND";
    throw err;
  }
  const daily_rent_price = parseFloat(vehicleResult.rows[0].daily_rent_price);
  const { total_price } = calculateBookingPrice(
    daily_rent_price,
    rent_start_date as string,
    rent_end_date as string
  );

  const result = await pool.query(
    `INSERT INTO bookings(customer_id, vehicle_id, rent_start_date, rent_end_date, total_price, status)
     VALUES($1, $2, $3, $4, $5, $6) RETURNING *`,
    [customer_id, vehicle_id, rent_start_date, rent_end_date, total_price, status]
  );

  await pool.query(
    `UPDATE vehicles SET availability_status = 'booked', updated_at = NOW() WHERE id = $1`,
    [vehicle_id]
  );

  return result;
};

const getBookings = async (customerId?: string) => {
  await processAutoReturns();
  if (customerId) {
    const result = await pool.query(
      `SELECT * FROM bookings WHERE customer_id = $1`,
      [customerId]
    );
    return result;
  }
  const result = await pool.query(`SELECT * FROM bookings`);
  return result;
};

const getSingleBooking = async (id: string, customerId?: string) => {
  await processAutoReturns();
  if (customerId) {
    const result = await pool.query(
      "SELECT * FROM bookings WHERE id = $1 AND customer_id = $2",
      [id, customerId]
    );
    return result;
  }
  const result = await pool.query("SELECT * FROM bookings WHERE id = $1", [id]);
  return result;
};

const updateBooking = async (
  payload: Record<string, unknown>,
  id: string,
  customerId?: string
) => {
  await processAutoReturns();

  if (customerId) {
    const ownership = await pool.query(
      "SELECT id, rent_start_date, status AS current_status FROM bookings WHERE id = $1 AND customer_id = $2",
      [id, customerId]
    );
    if (ownership.rows.length === 0) {
      const empty = { rows: [], rowCount: 0 };
      return empty as { rows: unknown[]; rowCount: number };
    }
    const booking = ownership.rows[0];
    const requestedStatus = payload.status as string | undefined;
    if (requestedStatus !== undefined) {
      if (requestedStatus !== "cancelled") {
        const err = new Error("Customer can only cancel bookings (set status to cancelled)");
        (err as any).code = "CUSTOMER_CAN_ONLY_CANCEL";
        throw err;
      }
      const startDate = new Date(booking.rent_start_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      startDate.setHours(0, 0, 0, 0);
      if (startDate.getTime() <= today.getTime()) {
        const err = new Error("Can only cancel booking before start date");
        (err as any).code = "CANCEL_ONLY_BEFORE_START";
        throw err;
      }
    }
  }

  const { rent_start_date, rent_end_date, status } = payload;

  const existing = await pool.query(
    `SELECT vehicle_id, rent_start_date, rent_end_date, status AS current_status FROM bookings WHERE id = $1`,
    [id]
  );
  if (existing.rows.length === 0) {
    return existing;
  }
  const current = existing.rows[0];
  const newStart =
    customerId != null ? current.rent_start_date : ((rent_start_date as string) ?? current.rent_start_date);
  const newEnd =
    customerId != null ? current.rent_end_date : ((rent_end_date as string) ?? current.rent_end_date);
  const appliedStart = customerId != null ? current.rent_start_date : rent_start_date;
  const appliedEnd = customerId != null ? current.rent_end_date : rent_end_date;

  const vehicleResult = await pool.query(
    `SELECT daily_rent_price FROM vehicles WHERE id = $1`,
    [current.vehicle_id]
  );
  if (vehicleResult.rows.length === 0) {
    const err = new Error("Vehicle not found");
    (err as any).code = "VEHICLE_NOT_FOUND";
    throw err;
  }
  const daily_rent_price = parseFloat(vehicleResult.rows[0].daily_rent_price);
  const { total_price } = calculateBookingPrice(
    daily_rent_price,
    newStart,
    newEnd
  );

  const result = await pool.query(
    `UPDATE bookings SET
      rent_start_date = COALESCE($1, rent_start_date),
      rent_end_date = COALESCE($2, rent_end_date),
      total_price = $3,
      status = COALESCE($4, status),
      updated_at = NOW()
     WHERE id = $5 RETURNING *`,
    [appliedStart, appliedEnd, total_price, status, id]
  );

  const newStatus = (status as string) ?? current.current_status;
  if (newStatus === "returned" || newStatus === "cancelled") {
    await pool.query(
      `UPDATE vehicles SET availability_status = 'available', updated_at = NOW() WHERE id = $1`,
      [current.vehicle_id]
    );
  }

  return result;
};

const deleteBooking = async (id: string, customerId?: string) => {
  if (customerId) {
    const result = await pool.query(
      "DELETE FROM bookings WHERE id = $1 AND customer_id = $2 RETURNING *",
      [id, customerId]
    );
    return result;
  }
  const result = await pool.query("DELETE FROM bookings WHERE id = $1 RETURNING *", [id]);
  return result;
};

export const bookingServices = {
  createBooking,
  getBookings,
  getSingleBooking,
  updateBooking,
  deleteBooking,
};