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

const createBooking = async (payload: Record<string, unknown>) => {
  await processAutoReturns();

  const { customer_id, vehicle_id, rent_start_date, rent_end_date, status = "active" } = payload;

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

const getBookings = async () => {
  await processAutoReturns();
  const result = await pool.query(`SELECT * FROM bookings`);
  return result;
};

const getSingleBooking = async (id: string) => {
  await processAutoReturns();
  const result = await pool.query("SELECT * FROM bookings WHERE id = $1", [id]);
  return result;
};

const updateBooking = async (payload: Record<string, unknown>, id: string) => {
  await processAutoReturns();

  const { rent_start_date, rent_end_date, status } = payload;

  const existing = await pool.query(
    `SELECT vehicle_id, rent_start_date, rent_end_date, status AS current_status FROM bookings WHERE id = $1`,
    [id]
  );
  if (existing.rows.length === 0) {
    return existing;
  }
  const current = existing.rows[0];
  const newStart = (rent_start_date as string) ?? current.rent_start_date;
  const newEnd = (rent_end_date as string) ?? current.rent_end_date;

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
    [rent_start_date, rent_end_date, total_price, status, id]
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

const deleteBooking = async (id: string) => {
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