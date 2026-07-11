# SmartSpaceAI Backend REST API

A production-ready, secure, and modular REST API built with **Node.js**, **Express.js**, and **MongoDB (Mongoose)**. It follows clean architecture guidelines, separates business logic from controllers, implements automated JWT authentication with refresh token cookies, and features security hardening.

---

## Folder Structure

```text
src/
├── config/              # Environment config loading and defaults
├── constants/           # HTTP status codes and custom system messages
├── controllers/         # Handles HTTP requests/responses (req, res)
├── database/            # Mongoose MongoDB connection initialization
├── errors/              # Custom ApiError class and global error processing
├── helpers/             # Token creation and verification helpers
├── middlewares/         # Route protections, rate limiters, error catching, and file uploads
├── models/              # Mongoose Schema definitions
├── routes/              # Express Router definitions
├── services/            # Core business and DB transactional logic
├── utils/               # Centralized async wrappers and JSON response formatters
├── validators/          # Joi schema validations
├── app.js               # Express application middleware configuration
└── server.js            # Node server bootstrapping and process-level error handlers
```

---

## Getting Started

### 1. Prerequisites
*   [Node.js](https://nodejs.org/) (v20.19.0+)
*   [MongoDB](https://www.mongodb.com/) (running locally or a remote MongoDB Atlas URI)

### 2. Installation
Clone the repository and install the dependencies:
```bash
npm install
```

### 3. Environment Variables
Copy `.env.example` to `.env` and adjust the configuration to match your environment:
```bash
cp .env.example .env
```

### 4. Running the Server

#### Development Mode (with hot-reloading)
```bash
npm run dev
```

The server should output:
```text
Server running in development mode on port 3000
MongoDB Connected: localhost
```

---

## API Endpoints Reference

| Method | Endpoint | Description | Auth Required | Request Body / File |
|---|---|---|---|---|
| **POST** | `/api/auth/signup` | Registers a new user. | No | JSON (firstName, lastName, email, dateOfBirth, password, confirmPassword) |
| **POST** | `/api/auth/signin` | Logs in and issues tokens. | No | JSON (email, password) |
| **POST** | `/api/auth/logout` | Invalidates current refresh token. | Yes (Bearer) | None |
| **POST** | `/api/auth/refresh` | Rotates and issues a new access token. | No | Sent via HttpOnly cookie |
| **GET** | `/api/users/profile` | Fetches authenticated profile details. | Yes (Bearer) | None |
| **PATCH** | `/api/users/profile` | Updates allowed profile info and image. | Yes (Bearer) | FormData (firstName, lastName, dateOfBirth, file: `profileImage`) |

---

## Postman Collection

You can import the fully configured Postman collection to test the endpoints:

*   **Location**: `doc/postman_collection.json`
*   **Dynamic Tokens**: The collection contains automated test scripts. When you successfully call **Sign In** or **Refresh Token**, the collection variables are updated with your current `accessToken` automatically. All subsequent protected endpoints will use the token automatically.
