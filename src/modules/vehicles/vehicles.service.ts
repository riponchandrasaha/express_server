/** Service layer: business logic and data access; no Express coupling. */
import { pool } from "../../config/db";

const createVehicle = async (payload: Record<string, unknown>) => {
  const { vehicle_name, type, registration_number, daily_rent_price, availability_status = "available" } = payload;
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
  const { vehicle_name, type, registration_number, daily_rent_price, availability_status } = payload;
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
