# Express.js + TypeScript + Prisma + Neon Postgres

A Repo for building REST APIs with **Express.js**, **TypeScript**, **Prisma ORM**, and **Neon Postgres** (serverless Postgres). This project provides a solid foundation with a clean architecture, environment configuration, and database integration.

## Features

- ⚡ **Express.js** – Fast, unopinionated, minimalist web framework.
- 🔷 **TypeScript** – Static typing and modern ES features.
- 🗄️ **Prisma** – Next-generation ORM with type-safe database queries.
- 🐘 **Neon Postgres** – Serverless Postgres with branching and scaling.
- 📁 **Modular structure** – Routes, controllers, services, and middleware separated.
- 🔐 **Environment variables** – Securely manage configuration with `dotenv`.
- 🛠️ **Nodemon** – Automatic server restarts during development.
- 📦 **Pre-configured scripts** – Build, start, dev, and Prisma commands.

## Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- [npm](https://www.npmjs.com/) or [pnpm](https://pnpm.io/)
- A [Neon](https://neon.tech/) account (free tier available)

### Project Structure

```bash
src/
├── config/          # Queue, and storage configuration
├── controllers/     # HTTP request/response handlers
├── lib/             # Prisma configuration
├── middlewares/     # asyncHandler, errorHandler, validateRequest, etc.
├── models/          # PostgreSQL models and TypeScript interfaces
├── routes/          # API route definitions
├── types/           # Shared TypeScript type definitions
├── utils/           # AppError, logger, response helpers
├── validations/     # express-validator schemas
├── app.ts           # Express app setup
└── index.ts         # Server entry point
```  

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/ZinHt9tHlaing/ExpressJS-Prisma7-NeonPostgres.git
cd your-repo-name
```

### 2. Install dependencies

```bash
npm install
```
or

```bash
pnpm install
```

### 3. Set up environment variables

## 🐘 Neon Database

This project uses **Neon serverless PostgreSQL**.

Steps:

1. Go to https://neon.tech

2. Create a new project

3. Copy the connection string

4. Add it to .env.local

```bash
PORT=
CLIENT_URL=

DATABASE_URL="postgresql://<user>:<password>@<host>/<dbname>?sslmode=require"

NODE_ENV=

JWT_SECRET=
```

### 4. Set up Prisma and the database

Generate Prisma client.
```bash
# npx prisma generate
npm run db:generate
```

Run database migrations.
```bash
# npx prisma migrate dev
npm run db:migrate
```

Open Prisma Studio.
```bash
npm run db:studio
```

### 5. Run the development server

```bash
npm run dev
```
or

```bash
pnpm dev
```


