# TRENDS

Phase 1 establishes a maintainable full-stack foundation while retaining the original legacy files at the repository root.

## Structure

- `client/` — React + Vite frontend foundation.
- `server/` — Express + MongoDB/Mongoose API.
- `assets/` — reusable copies of legacy product imagery.
- legacy root HTML/CSS/JS files — retained temporarily and are no longer the main application.

## Local setup

1. Start MongoDB locally, use MongoDB Atlas, or run `docker compose up mongo`. For a local database, use `MONGODB_URI=mongodb://127.0.0.1:27017/trendz`.
2. Copy `.env.example` to `.env` and provide that connection string and a long random `JWT_SECRET`.
3. Install packages: `npm install --prefix server` and `npm install --prefix client`.
4. Start the API: `npm run dev --prefix server`.
5. Seed safe sample data: `npm run seed --prefix server`.
6. Start the frontend: `npm run dev --prefix client`.

The seed script uses upserts keyed by product name: it inserts missing sample products and updates only its own sample records. It does not delete database records.

## Docker

After adding `JWT_SECRET` to `.env`, `docker compose up --build` starts MongoDB, the API, and the frontend foundation.

## Phase 1 API

- `GET /api/health`
- `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`
- `GET /api/products`, `GET /api/products/:id`, `GET /api/products/search?q=shirt`
- `GET /api/products/category/:gender/:category`
- Admin bearer-token routes: `POST`, `PUT`, and `DELETE /api/products/:id`

## Admin setup (local development)

Set `ADMIN_EMAIL` and a strong `ADMIN_PASSWORD` in `.env` before starting the API to create the initial administrator. The password is hashed by the User model and is never logged. If that email already belongs to an account, the server promotes it to `admin` but never changes its password. New public registrations always receive the `user` role and `active` status. Disabled accounts cannot authenticate or use protected routes. If this project has legacy plaintext password fields, run `npm run migrate:password-hashes --prefix server` once before signing in; it hashes legacy values and removes the plaintext field.
