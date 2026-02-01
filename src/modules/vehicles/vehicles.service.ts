/** Service layer: business logic and data access; no Express coupling. */
import { pool } from "../../config/db";

const VALID_TYPES = ["car", "bike", "van", "SUV"] as const;
const VALID_AVAILABILITY = ["available", "booked"] as const;

const validateVehiclePayload = (
  payload: Record<string, unknown>,
  isCreate: boolean
) => {
  const { vehicle_name, type, registration_number, daily_rent_price, availability_status } = payload;
  if (isCreate) {
    if (!vehicle_name || typeof vehicle_name !== "string" || !String(vehicle_name).trim()) {
      const err = new Error("vehicle_name is required");
      (err as any).code = "VALIDATION";
      throw err;
    }
    if (!type || !VALID_TYPES.includes(type as (typeof VALID_TYPES)[number])) {
      const err = new Error("type is required and must be: car, bike, van, or SUV");
      (err as any).code = "VALIDATION";
      throw err;
    }
    if (!registration_number || typeof registration_number !== "string" || !String(registration_number).trim()) {
      const err = new Error("registration_number is required");
      (err as any).code = "VALIDATION";
      throw err;
    }
    const price = Number(daily_rent_price);
    if (daily_rent_price == null || isNaN(price) || price <= 0) {
      const err = new Error("daily_rent_price is required and must be positive");
      (err as any).code = "VALIDATION";
      throw err;
    }
  }
  if (type !== undefined && !VALID_TYPES.includes(type as (typeof VALID_TYPES)[number])) {
    const err = new Error("type must be: car, bike, van, or SUV");
    (err as any).code = "VALIDATION";
    throw err;
  }
  if (availability_status !== undefined && !VALID_AVAILABILITY.includes(availability_status as (typeof VALID_AVAILABILITY)[number])) {
    const err = new Error("availability_status must be: available or booked");
    (err as any).code = "VALIDATION";
    throw err;
  }
  if (daily_rent_price !== undefined) {
    const price = Number(daily_rent_price);
    if (isNaN(price) || price <= 0) {
      const err = new Error("daily_rent_price must be positive");
      (err as any).code = "VALIDATION";
      throw err;
    }
  }
};

const createVehicle = async (payload: Record<string, unknown>) => {
  validateVehiclePayload(payload, true);
  const { vehicle_name, type, registration_number, daily_rent_price, availability_status = "available" } = payload;

  const existing = await pool.query(
    `SELECT id FROM vehicles WHERE registration_number = $1`,
    [registration_number]
  );
  if (existing.rows.length > 0) {
    const err = new Error("Registration number already exists");
    (err as any).code = "REGISTRATION_EXISTS";
    throw err;
  }

  const result = await pool.query(
    `INSERT INTO vehicles(vehicle_name, type, registration_number, daily_rent_price, availability_status)
     VALUES($1, $2, $3, $4, $5) RETURNING *`,
    [vehicle_name, type, registration_number, daily_rent_price, availability_status]
  );
  return result;
};

const getVehicles = async () => {
  const result = await pool.query(`SELECT * FROM vehicles`);
  return result;
};

const getSingleVehicle = async (id: string) => {
  const result = await pool.query("SELECT * FROM vehicles WHERE id = $1", [id]);
  return result;
};

const updateVehicle = async (payload: Record<string, unknown>, id: string) => {
  validateVehiclePayload(payload, false);
  const { vehicle_name, type, registration_number, daily_rent_price, availability_status } = payload;

  if (registration_number !== undefined) {
    const existing = await pool.query(
      `SELECT id FROM vehicles WHERE registration_number = $1 AND id != $2`,
      [registration_number, id]
    );
    if (existing.rows.length > 0) {
      const err = new Error("Registration number already exists");
      (err as any).code = "REGISTRATION_EXISTS";
      throw err;
    }
  }

  const result = await pool.query(
    `UPDATE vehicles SET
      vehicle_name = COALESCE($1, vehicle_name),
      type = COALESCE($2, type),
      registration_number = COALESCE($3, registration_number),
      daily_rent_price = COALESCE($4, daily_rent_price),
      availability_status = COALESCE($5, availability_status),
      updated_at = NOW()
     WHERE id = $6 RETURNING *`,
    [vehicle_name, type, registration_number, daily_rent_price, availability_status, id]
  );
  return result;
};

const deleteVehicle = async (id: string) => {
  const activeBookings = await pool.query(
    `SELECT id FROM bookings WHERE vehicle_id = $1 AND status = 'active'`,
    [id]
  );
  if (activeBookings.rows.length > 0) {
    const err = new Error("Cannot delete vehicle with active bookings");
    (err as any).code = "ACTIVE_BOOKINGS";
    throw err;
  }
  const result = await pool.query("DELETE FROM vehicles WHERE id = $1 RETURNING *", [id]);
  return result;
};

export const vehicleServices = {
  createVehicle,
  getVehicles,
  getSingleVehicle,
  updateVehicle,
  deleteVehicle,
};
