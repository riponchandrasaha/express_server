/** Service layer: business logic and data access; no Express coupling. */
import { pool } from "../../config/db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import config from "../../config";

const loginUser = async (email: string, password: string) => {
  console.log({ email });
  const result = await pool.query(`SELECT * FROM users WHERE email=$1`, [
    email,
  ]);

  console.log({ result });
  if (result.rows.length === 0) {
    return null;
  }
  const user = result.rows[0];

  const match = await bcrypt.compare(password, user.password);

  console.log({ match, user });
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
  console.log({ token });

  const safeUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
  };
  return { token, user: safeUser };
};

const registerUser = async (payload: Record<string, unknown>) => {
  const { name, email, password, phone } = payload;

  const existing = await pool.query(`SELECT id FROM users WHERE email = $1`, [email]);
  if (existing.rows.length > 0) {
    const err = new Error("Email already registered");
    (err as any).code = "EMAIL_EXISTS";
    throw err;
  }

  const hashedPass = await bcrypt.hash(password as string, 10);
  const result = await pool.query(
    `INSERT INTO users(name, email, password, phone, role)
     VALUES($1, $2, $3, $4, 'customer') RETURNING id, name, email, phone, role`,
    [name, email, hashedPass, phone ?? null]
  );
  return result;
};

export const authServices = {
  loginUser,
  registerUser,
};