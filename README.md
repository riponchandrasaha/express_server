# Vehicle Rental System – Express Backend

## Technology Stack

- **Node.js** + **TypeScript**
- **Express.js** (web framework)
- **PostgreSQL** (database)
- **bcrypt** (password hashing)
- **jsonwebtoken** (JWT authentication)

---
live link: https://vehicle-rental-system-express-backe.vercel.app/

## User Roles

| Role      | Access |
|----------|--------|
| **Admin**   | Full system access: manage vehicles, users, and all bookings. |
| **Customer**| Register, view vehicles, create and manage own bookings and profile. |

---

## Authentication Flow

- Passwords are **hashed with bcrypt** before storage.
- **Login** via `POST /api/v1/auth/signin` — returns a **JWT** (JSON Web Token).
- **Protected endpoints** require the token in the header:
  `Authorization: Bearer <token>`
- The server validates the token and checks user permissions.
- **401 Unauthorized** — missing or invalid/expired token.
- **403 Forbidden** — valid token but insufficient role (e.g. customer accessing admin-only route).

---

## Features

- **Vehicles** — Manage vehicle inventory with availability tracking (`available` / `booked`).
- **Customers** — Manage customer accounts and profiles (Admin: all users; Customer: own profile).
- **Bookings** — Handle vehicle rentals, returns, and cost calculation (Admin: all bookings; Customer: own only).
- **Authentication** — Role-based access control (Admin and Customer roles).

---

## API Base

- Auth: `/api/v1/auth` (signup, signin)
- Users: `/api/v1/users`
- Vehicles: `/api/v1/vehicles`
- Bookings: `/api/v1/bookings`

---

## Users API

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `GET` | `/api/v1/users` | Admin only | View all users in the system |
| `PUT` | `/api/v1/users/:userId` | Admin or Own | Admin: Update any user's role or details. Customer: Update own profile only |
| `DELETE` | `/api/v1/users/:userId` | Admin only | Delete user (only if no active bookings exist) |

---

## Vehicles API

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `POST` | `/api/v1/vehicles` | Admin only | Add new vehicle with name, type, registration, daily rent price and availability status |
| `GET` | `/api/v1/vehicles` | Public | View all vehicles in the system |
| `GET` | `/api/v1/vehicles/:vehicleId` | Public | View specific vehicle details |
| `PUT` | `/api/v1/vehicles/:vehicleId` | Admin only | Update vehicle details, daily rent price or availability status |
| `DELETE` | `/api/v1/vehicles/:vehicleId` | Admin only | Delete vehicle (only if no active bookings exist) |
