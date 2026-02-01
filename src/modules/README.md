# Feature-based modules

The app is organized into **feature-based modules** with a clear **layering** and **separation of concerns**.

## Module layout

Each feature lives in its own folder under `src/modules/`:

| Module    | Path           | Responsibility                                      |
|-----------|----------------|-----------------------------------------------------|
| **auth**  | `modules/auth`  | Login, registration, JWT                            |
| **user**  | `modules/user`  | Customer accounts and profiles (CRUD)                |
| **vehicles** | `modules/vehicles` | Vehicle inventory and availability tracking     |
| **bookings** | `modules/bookings` | Rentals, returns, cost calculation              |

## Layering (per module)

Every module follows the same three layers:

1. **Routes** (`*.routes.ts`)
   - Define HTTP endpoints and attach middleware (e.g. auth).
   - Only delegate to controllers; no business logic.

2. **Controllers** (`*.controller.ts`)
   - Handle `Request` / `Response`: parse body, params, `req.user`.
   - Call services and send JSON responses.
   - No direct DB or external calls.

3. **Services** (`*.service.ts`)
   - Contain business logic and data access (e.g. `pool.query`).
   - No Express types; reusable outside HTTP.

**Flow:** `routes → controllers → services`

## Public API

The app mounts modules via their **index** only. Each module exposes its router in `index.ts`:

- `import { authRoutes } from "./modules/auth"`
- `import { userRoutes } from "./modules/user"`
- `import { vehicleRoutes } from "./modules/vehicles"`
- `import { bookingRoutes } from "./modules/bookings"`

Internal files (controllers, services) stay inside the module and are not imported by other modules or by `app.ts`.

## Role-based access

| Role       | Permissions |
|-----------|-------------|
| **Admin** | Full system access: manage vehicles (CRUD), manage users (CRUD), view and manage all bookings. |
| **Customer** | Can register (`POST /auth/register`); view vehicles (list and single); create bookings (as self) and manage only their own bookings (list, get, update, return, cancel). Can view and update only their own profile. |
