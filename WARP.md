# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Commands

### Backend service (Node + Express + MongoDB)

The backend lives in `backend/` and is a standalone Node.js service using ES modules, Express, and Mongoose.

- **Install dependencies**
  - `cd backend && npm install`

- **Run in development mode (with auto-reload via nodemon)**
  - `cd backend && npm run dev`

- **Run in production mode**
  - `cd backend && npm start`

- **Environment configuration**
  - Copy `backend/.env.example` to `.env` and adjust as needed.
  - Important variables (see `backend/.env.example` and usages in code):
    - `PORT` (defaults to `4000` in `src/server.js`)
    - `MONGODB_URI` (defaults to `mongodb://localhost:27017/home_services_crm` in `src/config/db.js`)
    - `JWT_SECRET` (required for auth in `src/middleware/authMiddleware.js`)
    - `JWT_EXPIRES_IN` (used by auth logic if implemented elsewhere)

- **Database seeding**
  - `cd backend && npm run seed`
  - Note: `package.json` references `src/seed/seed.js`, but that file/directory does not currently exist. Expect this command to fail until a seed script is added or the script is updated.

- **Tests / linting**
  - There are currently **no test or lint scripts** defined in `backend/package.json`, and no test files or lint configs in the repo. Before asking Warp to "run tests" or "run lint", add the appropriate tooling and scripts to `backend/package.json`.

## High-level architecture

### Overall layout

- `backend/`
  - `package.json` – Node/Express backend entry points and scripts.
  - `.env.example` – sample environment configuration.
  - `src/`
    - `server.js` – process entry point: loads env vars, connects to MongoDB, starts HTTP server.
    - `app.js` – Express app configuration: middleware and API route mounting.
    - `config/db.js` – MongoDB connection via Mongoose.
    - `models/` – Mongoose models for core domain entities.
    - `middleware/` – shared Express middleware (auth, error handling).
- `frontend/`
  - `src/css/main.css` – global CSS and layout utilities, tuned for responsive UI.
  - `src/quasar-variables.sass` – Quasar/Vue theme variables and breakpoint configuration.

There is no top-level `package.json` or build tooling at the repo root; the only Node package is the backend.

### Backend request flow

1. **Process startup** (`backend/src/server.js`)
   - Loads environment variables via `dotenv`.
   - Computes `PORT` from `process.env.PORT || 4000`.
   - Calls `connectDB()` from `src/config/db.js` to establish a MongoDB connection.
   - Creates an HTTP server wrapping the Express app from `src/app.js` and starts listening.

2. **Database layer** (`backend/src/config/db.js`)
   - Builds the MongoDB URI from `process.env.MONGODB_URI` or falls back to a local `home_services_crm` database.
   - Configures Mongoose (`strictQuery`, `autoIndex`) and connects.
   - This module is the single place to adjust MongoDB connection behavior.

3. **Express application** (`backend/src/app.js`)
   - Sets up core middleware:
     - `cors()` for cross-origin requests.
     - `express.json({ limit: '5mb' })` for JSON body parsing.
     - `morgan('dev')` for HTTP logging.
   - Defines a health check endpoint at `GET /api/health`.
   - Mounts route modules under these prefixes:
     - `/api/auth` – `authRoutes.js`
     - `/api/contacts` – `contactRoutes.js`
     - `/api/projects` – `projectRoutes.js`
     - `/api/subscriptions` – `subscriptionRoutes.js`
     - `/api/calendar` – `calendarRoutes.js`
     - `/api/files` – `fileRoutes.js`
   - Finishes with `notFound` and `errorHandler` middleware for consistent error responses.

   **Important:** the route modules referenced above (`src/routes/*.js`) are **not present** in the current repository snapshot. When implementing new API endpoints, either:
   - Create the corresponding files under `backend/src/routes/`, or
   - Update `app.js` to point at the actual route locations.

4. **Domain models** (`backend/src/models/*.js`)

   All domain logic persists through Mongoose models. These models are the primary abstraction for working with the database.

   - `User.js`
     - Fields: `name`, `email`, `password`, `role`, `divisionAccess`.
     - Roles: `Owner`, `Admin`, `Sales`, `BDC`, `Installer`.
     - Divisions: `Renovations`, `Radiance`.
     - Hooks:
       - `pre('save')` hashes passwords with `bcryptjs` when modified.
       - `pre('save')` auto-populates `divisionAccess` for `Owner`/`Admin` if none is set.
     - Methods:
       - `toJSON()` strips `password` from serialized output.
       - `comparePassword(candidate)` compares plaintext to the stored hash.

   - `Contact.js`
     - Represents CRM contacts with rich metadata.
     - Includes `activityLog` subdocuments (timestamp, userName, action).
     - Key enums: `leadSource`, `contactType`, `contactCategory` and `divisions` (aligned with domain terminology like `Renovations`/`Radiance`).

   - `Project.js`
     - Tied to a `Contact` via `contact` reference.
     - Tracks contract amounts, contract/workbook PDFs, assigned installers (`User` refs), status, install dates, cost breakdown (`materials`, `labor`, `processing`, `misc`), prior credit declines, photos, and notes.
     - Adds indexes on `contact` and `status` for efficient querying.

   - `Subscription.js`
     - Represents subscription tiers for services (`Glow`, `Brilliance`, `Eternal`).
     - Fields for pricing, billing cycle, start/renewal dates, visits remaining, repairs credit used, lights included, status, and `serviceHistory` entries (date, serviceType, notes, photos).
     - `pre('save')` hook sets default `monthlyPrice` and `annualPrice` based on tier if missing.
     - Validates that `repairsCreditUsed` does not exceed 800 for the `Eternal` tier.

5. **Middleware** (`backend/src/middleware`)

   - `authMiddleware.js`
     - `authMiddleware` extracts and verifies a `Bearer` token from the `Authorization` header using `process.env.JWT_SECRET`.
     - On success, loads the `User` by ID and attaches it as `req.user`.
     - On failure, returns 401 JSON responses (`Not authenticated`, `User not found`, or `Invalid token`).
     - `requireRoles(roles, divisions)` returns a middleware that:
       - Ensures `req.user` exists.
       - Enforces allowed roles via `req.user.role`.
       - Optionally enforces allowed divisions via `req.user.divisionAccess`.

   - `errorHandler.js`
     - `notFound` sets status 404 and forwards an error with the requested URL.
     - `errorHandler` logs the error and returns a JSON payload with `message` and an appropriate status code (defaults to 500 if unset).

### Frontend assets

The `frontend/` directory contains styling and theme configuration, but **no JavaScript/TypeScript entrypoint or build tooling** in this repo.

- `frontend/src/css/main.css`
  - Defines CSS variables for primary/secondary colors, typography, layout, and responsive spacing.
  - Includes mobile optimizations (content-visibility for images, larger tap targets, print styles, reduced CLS via minimum image heights).

- `frontend/src/quasar-variables.sass`
  - Defines Quasar design tokens: primary/secondary/accent colors, dark theme colors, feedback colors (positive/negative/info/warning), and custom breakpoint values.
  - Intended to be consumed by a Quasar (Vue) project configuration that is not present in this repository.

## Notes for future Warp usage

- When asked to add or modify API endpoints, place Express route handlers under `backend/src/routes/` (aligned with the imports in `app.js`) or adjust `app.js` if a different structure is chosen.
- When working with authentication/authorization, reuse `authMiddleware` and `requireRoles` to keep access control consistent across new routes.
- When extending domain behavior, prefer to add logic to the Mongoose models (hooks, instance methods, statics) rather than duplicating business rules in multiple controllers.
