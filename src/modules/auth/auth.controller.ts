/** Controller layer: request/response handling; delegates to service. */
import { Request, Response } from "express";
import { authServices } from "./auth.service";

const loginUser = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const result = await authServices.loginUser(email, password);
    if (result === null) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    if (result === false) {
      return res.status(401).json({ success: false, message: "Invalid password" });
    }
    res.status(200).json({
      success: true,
      message: "Login successful",
      data: result,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

const registerUser = async (req: Request, res: Response) => {
  try {
    const result = await authServices.registerUser(req.body);
    res.status(201).json({
      success: true,
      message: "Registration successful",
      data: result.rows[0],
    });
  } catch (err: any) {
    const code = (err as any)?.code;
    const status =
      code === "EMAIL_EXISTS" || code === "PASSWORD_TOO_SHORT" ? 400 : 500;
    res.status(status).json({
      success: false,
      message: (err as any)?.message ?? "Registration failed",
    });
  }
};

export const authController = {
  loginUser,
  registerUser,
};