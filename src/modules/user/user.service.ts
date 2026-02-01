/** Service layer: business logic and data access; no Express coupling. */
import { pool } from "../../config/db";
import bcrypt from "bcryptjs";

const USER_PUBLIC_COLUMNS = "id, name, email, phone, role, created_at, updated_at";

const createUser = async (payload: Record<string, unknown>) => {
  const { name, email, password, phone, role } = payload;
  const emailLower = typeof email === "string" ? email.trim().toLowerCase() : "";
  const pass = typeof password === "string" ? password : "";
  if (pass.length < 6) {
    const err = new Error("Password must be at least 6 characters");
    (err as any).code = "PASSWORD_TOO_SHORT";
    throw err;
  }

  const hashedPass = await bcrypt.hash(pass, 10);

  const result = await pool.query(
    `INSERT INTO users(name, email, password, phone, role)
     VALUES($1, $2, $3, $4, $5) RETURNING ${USER_PUBLIC_COLUMNS}`,
    [name, emailLower, hashedPass, phone, role]
  );

  return result;
};

const getUser = async () => {
  const result = await pool.query(`SELECT ${USER_PUBLIC_COLUMNS} FROM users`);
  return result;
};

const getSingleUser = async (id: string) => {
  const result = await pool.query(
    `SELECT ${USER_PUBLIC_COLUMNS} FROM users WHERE id = $1`,
    [id]
  );
  return result;
};

const updateUser = async (payload: Record<string, unknown>, id: string) => {
  const { name, email, phone, role, password } = payload;

  const updates: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (name !== undefined) {
    updates.push(`name = $${paramIndex++}`);
    values.push(name);
  }
  if (email !== undefined) {
    updates.push(`email = $${paramIndex++}`);
    values.push(typeof email === "string" ? email.trim().toLowerCase() : email);
  }
  if (phone !== undefined) {
    updates.push(`phone = $${paramIndex++}`);
    values.push(phone);
  }
  if (role !== undefined) {
    updates.push(`role = $${paramIndex++}`);
    values.push(role);
  }
  if (password !== undefined && (password as string).length > 0) {
    const hashedPass = await bcrypt.hash(password as string, 10);
    updates.push(`password = $${paramIndex++}`);
    values.push(hashedPass);
  }

  if (updates.length === 0) {
    const result = await pool.query(
      `SELECT ${USER_PUBLIC_COLUMNS} FROM users WHERE id = $1`,
      [id]
    );
    return result;
  }

  updates.push(`updated_at = NOW()`);
  values.push(id);

  const result = await pool.query(
    `UPDATE users SET ${updates.join(", ")} WHERE id = $${paramIndex} RETURNING ${USER_PUBLIC_COLUMNS}`,
    values
  );

  return result;
};

const deleteUser = async (id: string) => {
  const activeBookings = await pool.query(
    `SELECT id FROM bookings WHERE customer_id = $1 AND status = 'active'`,
    [id]
  );
  if (activeBookings.rows.length > 0) {
    const err = new Error("Cannot delete user with active bookings");
    (err as any).code = "ACTIVE_BOOKINGS";
    throw err;
  }
  const result = await pool.query(
    `DELETE FROM users WHERE id = $1 RETURNING ${USER_PUBLIC_COLUMNS}`,
    [id]
  );
  return result;
};

export const userServices = {
  createUser,
  getUser,
  getSingleUser,
  updateUser,
  deleteUser,
};
