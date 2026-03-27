# Secure Authentication System

[![Node.js Version](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0+-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19+-61dafb.svg)](https://reactjs.org/)
[![License](https://img.shields.io/badge/License-ISC-blue.svg)](LICENSE)

Full-stack authentication app with a TypeScript Express API and React frontend.
It supports signup/login, secure password reset with email notifications, cookie-based JWT auth, Redis-backed token state, and IP-based rate limiting for auth endpoints.

## Features

- Email/password signup and login
- Forgot-password and reset-password flow with one-time reset tokens
- Password reset email notifications via Resend
- HTTP-only cookie authentication (`accessToken`, `refreshToken`)
- Sliding access-token rotation (middleware-driven)
- Refresh token rotation with server-side validation in Redis
- Logout by server-side token invalidation and cookie clearing
- Rate limiting for signup, login, forgot-password, and reset-password endpoints
- React frontend with Axios `withCredentials` and auto refresh flow

## Tech Stack

### Backend

- Node.js 18+
- Express 5 + TypeScript
- MongoDB + Mongoose
- Upstash Redis + @upstash/ratelimit
- bcrypt for password hashing
- jsonwebtoken for JWT handling

### Frontend

- React 19 + TypeScript
- Vite
- Axios
- React Context for auth state

## Prerequisites

- Node.js 18+
- MongoDB connection string
- Upstash Redis URL and token
- Resend API key (for password reset emails)

## Project Structure

```text
auth-system/
   backend/
      src/
         config/
         controllers/
         middleware/
         models/
         routes/
         services/
         utils/
         server.ts
      package.json
      tsconfig.json
   frontend/
      src/
         components/
         lib/
         App.tsx
         main.tsx
      package.json
   package.json
   README.md
```

## Environment Variables

Create a `.env` file in `backend/`:

```env
PORT=3000
NODE_ENV=development

MONGO_URI=mongodb://localhost:27017/auth-system

JWT_SECRET=replace-with-a-strong-secret

CLIENT_URL=http://localhost:5173

REDIS_URL=https://<your-upstash-url>
REDIS_TOKEN=<your-upstash-token>

RESEND_API_KEY=<your-resend-api-key>
```

## Installation

From the project root:

```bash
npm install
npm install --prefix backend
npm install --prefix frontend
```

## Run Locally

From the project root:

```bash
npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:3000

## Build and Start

```bash
npm run build
npm run start
```

Notes:
- Root `build` installs backend/frontend dependencies, then builds both.
- Root `start` runs the backend from `backend/dist/server.js`.
- In production mode, backend serves `frontend/dist` as static files.

## Authentication Model

- Tokens are set as HTTP-only cookies by the backend.
- Frontend never stores tokens in localStorage.
- Access token lifetime is 15 minutes per token.
- Access token has a hard max lifetime of 24 hours per issuance window.
- A new window is created when a new access token is issued on signup, login, or refresh.
- Access token is rotated automatically in auth middleware after ~10 minutes of token age (while still under hard max).
- Refresh token lifetime is 7 days and is rotated on `/auth/refresh`.
- Redis stores/validates refresh token state to enforce rotation and invalidation.
- Password reset tokens are random, SHA-256 hashed, stored in Redis for 15 minutes, and consumed once.

## API Endpoints

Base URL: `http://localhost:3000`

| Method | Endpoint | Description | Auth |
| --- | --- | --- | --- |
| POST | `/auth/signup` | Register new user | No |
| POST | `/auth/login` | Login user | No |
| POST | `/auth/forgot-password` | Request password reset link | No |
| POST | `/auth/reset-password` | Reset password using reset token | No |
| POST | `/auth/refresh` | Rotate refresh token and issue new access token cookies | Cookie (`refreshToken`) |
| POST | `/auth/logout` | Logout and invalidate refresh token | Cookie (`refreshToken`) |
| GET | `/auth/me` | Get current user profile | Cookie (`accessToken`) |

## Request Examples

Signup:

```bash
curl -X POST http://localhost:3000/auth/signup \
   -H "Content-Type: application/json" \
   -d '{"email":"user@example.com","password":"securepassword"}'
```

Login:

```bash
curl -X POST http://localhost:3000/auth/login \
   -H "Content-Type: application/json" \
   -d '{"email":"user@example.com","password":"securepassword"}'
```

Forgot password:

```bash
curl -X POST http://localhost:3000/auth/forgot-password \
   -H "Content-Type: application/json" \
   -d '{"email":"user@example.com"}'
```

Reset password:

```bash
curl -X POST http://localhost:3000/auth/reset-password \
   -H "Content-Type: application/json" \
   -d '{"token":"<reset-token>","newPassword":"newsecurepassword"}'
```

Get profile:

```bash
curl -X GET http://localhost:3000/auth/me \
   -b cookies.txt
```

Refresh token:

```bash
curl -X POST http://localhost:3000/auth/refresh \
   -b cookies.txt -c cookies.txt
```

Login and persist cookies:

```bash
curl -X POST http://localhost:3000/auth/login \
   -H "Content-Type: application/json" \
   -d '{"email":"user@example.com","password":"securepassword"}' \
   -c cookies.txt
```

## Frontend Auth Flow

- Axios client uses `withCredentials: true` so browser cookies are sent automatically.
- On app load, frontend calls `/auth/me` to derive current auth state.
- On `403`, the frontend attempts `/auth/refresh` once and retries the failed request.
- If refresh fails, frontend calls logout and clears in-memory user state.
- Login screen can switch to forgot-password view and submit reset requests.
- Reset links open frontend with `/?view=reset&token=<token>`, which renders the reset-password form.

## Security Notes

- Login rate limit: 5 requests per minute per IP.
- Signup rate limit: 3 requests per hour per IP.
- Forgot-password rate limit: 5 requests per 24 hours per IP.
- Reset-password rate limit: 5 requests per 24 hours per IP.
- Passwords are hashed with bcrypt.
- Access and refresh tokens are HTTP-only cookies.
- Refresh tokens are validated and rotated via Redis.
- Reset tokens are SHA-256 hashed, short-lived in Redis, and invalidated after first use.

## License

ISC