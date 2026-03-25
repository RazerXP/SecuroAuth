# Secure Authentication System

[![Node.js Version](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0+-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19+-61dafb.svg)](https://reactjs.org/)
[![License](https://img.shields.io/badge/License-ISC-blue.svg)](LICENSE)

Full-stack authentication app with a TypeScript Express API and React frontend.
It supports signup/login, JWT access and refresh tokens, Redis-backed refresh token rotation, and IP-based rate limiting for auth endpoints.

## Features

- Email/password signup and login
- JWT access token authentication
- Refresh token rotation with server-side validation
- Logout by token invalidation in Redis
- Rate limiting for signup and login endpoints
- React frontend with Axios interceptors and auto refresh flow

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

REDIS_URL=https://<your-upstash-url>
REDIS_TOKEN=<your-upstash-token>
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

## API Endpoints

Base URL: `http://localhost:3000`

| Method | Endpoint | Description | Auth |
| --- | --- | --- | --- |
| POST | `/auth/signup` | Register new user | No |
| POST | `/auth/login` | Login user | No |
| POST | `/auth/refresh` | Rotate refresh token and issue new access token | Yes (Bearer access token) |
| POST | `/auth/logout` | Logout and invalidate refresh token | Yes (Bearer access token) |
| GET | `/auth/me` | Get current user profile | Yes (Bearer access token) |

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

Get profile:

```bash
curl -X GET http://localhost:3000/auth/me \
   -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

Refresh token:

```bash
curl -X POST http://localhost:3000/auth/refresh \
   -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
   -H "Content-Type: application/json" \
   -d '{"refreshToken":"YOUR_REFRESH_TOKEN"}'
```

## Frontend Auth Flow

- Tokens are stored in localStorage (`accessToken`, `refreshToken`).
- Axios request interceptor sends `Authorization: Bearer <accessToken>`.
- On `403`, the frontend attempts `/auth/refresh` once and retries the failed request.
- If refresh fails, local tokens are cleared and user is logged out.

## Security Notes

- Login rate limit: 5 requests per minute per IP.
- Signup rate limit: 3 requests per hour per IP.
- Passwords are hashed with bcrypt.
- Refresh tokens are validated and rotated via Redis.

## License

ISC