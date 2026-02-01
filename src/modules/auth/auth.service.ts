/** Service layer: business logic and data access; no Express coupling. */
import { pool } from "../../config/db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import config from "../../config";

const loginUser = async (email: string, password: string) => {
  const emailLower = (email || "").trim().toLowerCase();
  const result = await pool.query(`SELECT * FROM users WHERE email = $1`, [
    emailLower,
  ]);

  if (result.rows.length === 0) {
    return null;
  }
  const user = result.rows[0];

  const match = await bcrypt.compare(password, user.password);

  if (!match) {
    return false;
  }

  const token = jwt.sign(
    { id: user.id, name: user.name, email: user.email, role: user.role },
    config.jwtSecret as string,
    {
      expiresIn: "7d",
    }
  );

  const safeUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
  };
  return { token, user: safeUser };
};

const VALID_ROLES = ["admin", "customer"] as const;

const registerUser = async (payload: Record<string, unknown>) => {
  const { name, email, password, phone, role } = payload;
  const emailLower = typeof email === "string" ? email.trim().toLowerCase() : "";

  const existing = await pool.query(`SELECT id FROM users WHERE email = $1`, [emailLower]);
  if (existing.rows.length > 0) {
    const err = new Error("Email already registered");
    (err as any).code = "EMAIL_EXISTS";
    throw err;
  }

  const userRole =
    typeof role === "string" && VALID_ROLES.includes(role as (typeof VALID_ROLES)[number])
      ? (role as string)
      : "customer";

  const pass = typeof password === "string" ? password : "";
  if (pass.length < 6) {
    const err = new Error("Password must be at least 6 characters");
    (err as any).code = "PASSWORD_TOO_SHORT";
    throw err;
  }

  const hashedPass = await bcrypt.hash(pass, 10);
  const result = await pool.query(
    `INSERT INTO users(name, email, password, phone, role)
     VALUES($1, $2, $3, $4, $5) RETURNING id, name, email, phone, role`,
    [name, emailLower, hashedPass, phone ?? null, userRole]
  );
  return result;
};

export const authServices = {
  loginUser,
  registerUser,
};