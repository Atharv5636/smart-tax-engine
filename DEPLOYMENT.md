# Deployment Guide

## 1) Prepare environment variables
Create a `.env` file on your server using `.env.example`:

- `PORT`
- `MONGO_URI`
- `JWT_SECRET`
- `OPENAI_API_KEY`
- `OPENAI_MODEL` (optional override)
- `OPENAI_BASE_URL` (optional)
- `UPLOAD_RETENTION_DAYS` (optional)
- `CORS_ORIGIN` (optional, comma-separated origins)

## 2) Install dependencies
At repo root:

```bash
npm install
cd client && npm install && cd ..
```

## 3) Build frontend
At repo root:

```bash
npm run build
```

This outputs frontend assets to `client/dist`, which the backend serves in production.

## 4) Start server

```bash
NODE_ENV=production npm start
```

On Windows PowerShell:

```powershell
$env:NODE_ENV="production"; npm start
```

## Notes
- API calls are environment-aware and no longer hardcoded to localhost.
- In development, Vite proxies `/api/*` to `http://localhost:5000` by default.
- In production, backend serves both API and frontend from the same domain.
