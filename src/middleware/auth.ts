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
      const isJwtError =
        err?.name === "JsonWebTokenError" ||
        err?.name === "TokenExpiredError" ||
        err?.name === "NotBeforeError";
      const status = isJwtError ? 401 : 500;
      const message = isJwtError
        ? "Unauthorized: invalid or expired token"
        : err?.message ?? "Internal server error";
      return res.status(status).json({
        success: false,
        message,
      });
    }
  };
};

export default auth;