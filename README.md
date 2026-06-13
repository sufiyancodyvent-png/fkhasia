# FKHASIA MERN Dashboard

Production-ready React + Express + MongoDB attendance dashboard.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create server environment file:

```bash
copy server\.env.example server\.env
```

3. Update `server/.env` with real values:

```env
MONGODB_URI=mongodb+srv://sufiyancodyvent_db_user:YOUR_PASSWORD@cluster0.xvx8a3k.mongodb.net/fkhasia?retryWrites=true&w=majority&appName=Cluster0
MONGODB_DB_NAME=fkhasia
JWT_SECRET=use-a-long-random-secret
SEED_ADMIN_EMAIL=admin@fkhasia.com
SEED_ADMIN_PASSWORD=use-a-strong-password
SEED_EMPLOYEE_EMAIL=employee@fkhasia.com
SEED_EMPLOYEE_PASSWORD=use-a-strong-password
```

Do not commit `server/.env`.

## Seed Users

After setting `server/.env`, create the first admin and employee:

```bash
npm run seed
```

## Development

Start frontend and backend together:

```bash
npm run dev
```

Optional separate commands:

```bash
npm run dev:server
npm run dev:client
```

Frontend uses `/api` and Vite proxies API calls to `http://localhost:5000`.

## Production

Build frontend:

```bash
npm run build
```

Start Express server:

```bash
npm start
```

Express serves the API and the built `dist` frontend.

## Vercel Deployment

This project is configured to run the Vite frontend and Express API on one Vercel project.

Add these environment variables in Vercel:

```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://USER:PASSWORD@HOST/fkhasia?retryWrites=true&w=majority&appName=Cluster0
MONGODB_DB_NAME=fkhasia
JWT_SECRET=use-a-long-random-secret
JWT_EXPIRES_IN=7d
CLIENT_ORIGIN=https://your-vercel-domain.vercel.app
SEED_ADMIN_EMAIL=admin@fkhasia.com
SEED_ADMIN_PASSWORD=use-a-strong-password
SEED_EMPLOYEE_EMAIL=employee@fkhasia.com
SEED_EMPLOYEE_PASSWORD=use-a-strong-password
```

After deploy, check the API:

```text
https://your-vercel-domain.vercel.app/api/health
```

It should return `{ "ok": true, "service": "fkhasia-api" }`.
