/**
 * Role-based auth: Admin = full system access (vehicles, users, all bookings).
 * Customer = register, view vehicles, create/manage own bookings and profile.
 */
import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import config from "../config";

// roles = ["admin"] | ["admin", "customer"] etc.
const auth = (...roles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ message: "Authorization required" });
      }
      const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : authHeader;
      const decoded = jwt.verify(
        token,
        config.jwtSecret as string
      ) as JwtPayload & { id?: string; role?: string };
      console.log({ decoded });
      req.user = decoded;

      //["admin"]
      if (roles.length && !roles.includes(decoded.role as string)) {
        return res.status(403).json({
          success: false,
          message: "Forbidden: insufficient role",
        });
      }

      next();
    } catch (err: any) {
      res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  };
};

export default auth;