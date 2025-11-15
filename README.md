# Event Management System

This repository contains a Node.js/Express backend and a Vite + React frontend (in `client/`) for an event management system. The project is prepared for local development, Docker, and deployment to Azure App Service via GitHub Actions.

## Contents
- `server.js` - Express API server
- `client/` - React frontend (Vite)
- `Dockerfile` - multi-stage Dockerfile that builds the client and packages the server
- `docker-compose.yml` - local compose file (reads secrets from `.env`)
- `.github/workflows/` - CI workflows for Azure deployment

## Prerequisites
- Node.js 18+ (for local dev)
- npm
- Docker & Docker Compose (for containerized testing)
- Azure CLI (if you want to run Azure commands locally)

## Quick start — Local (no Docker)
1. Install server deps:
```powershell
npm ci
```
2. Install client deps and build client:
```powershell
cd client
npm ci
npm run build
cd ..
```
3. Copy built client to the `public/` folder (the server serves static files from `public/`):
```powershell
mkdir -p public
cp -r client/dist/* public/
```
4. Create a `.env` file (copy `.env.example`) and fill values:
```powershell
copy .env.example .env
# edit .env and add MONGO_URL, JWT_SECRET, etc.
```
5. Start the server:
```powershell
npm start
```

The server listens on `process.env.PORT || 4000` by default. Health endpoints:
- `GET /healthz` — liveness
- `GET /readyz` — readiness (DB connection state)

## Quick start — Docker Compose (local)
1. Copy `.env.example` to `.env` and fill values (DO NOT commit `.env`).
2. Run:
```powershell
docker-compose up --build
```
3. Access:
- API: `http://localhost:4000`
- Client: `http://localhost:3000`

Note: the compose file reads env values from the repo root `.env`.

## Docker image
The repository contains a multi-stage `Dockerfile` that builds the React client and packages the Node server. The image serves the built client from the server's `public/` directory.

Build locally:
```powershell
docker build -t event-management-system:local .
docker run -e PORT=4000 -p 4000:4000 event-management-system:local
```

## Azure Deployment (GitHub Actions)
This repo includes workflows to deploy to Azure App Service. There are two common setups:

- Publish profile (simplest): keep `AZUREAPPSERVICE_PUBLISHPROFILE_WEBAPP_EMS` secret in GitHub and use the provided workflow `main_webapp-ems.yml`.
- Service principal (for `az` CLI operations): set `AZURE_CREDENTIALS` or the ARM_* secrets and `AZURE_RESOURCE_GROUP` so the workflow can set App Settings.

### Required GitHub Secrets
Add the following secrets to your repository (Settings → Secrets and variables → Actions):

- `AZUREAPPSERVICE_PUBLISHPROFILE_WEBAPP_EMS` (publish profile XML) — OR use service principal method below
- `AZURE_CREDENTIALS` (optional) — JSON from `az ad sp create-for-rbac --sdk-auth`
- `AZURE_RESOURCE_GROUP` (required if using `az` steps)
- `MONGO_URL` — MongoDB connection string
- `JWT_SECRET` — server JWT secret (generate securely; >=64 bytes recommended)
- `CORS_ORIGINS` — comma-separated allowed origins (e.g. `https://yourapp.azurewebsites.net`)

If you prefer service principal secrets (ARM style) instead of `AZURE_CREDENTIALS`, provide these as repository secrets: `ARM_CLIENT_ID`, `ARM_CLIENT_SECRET`, `ARM_SUBSCRIPTION_ID`, `ARM_TENANT_ID` (workflows may use them).

### Triggering deployment
Push to `main` (the workflows run on `push` to `main`). Monitor the Actions tab for logs and status.

## Security notes
- Never commit `.env` or secrets to the repository — `.env` is in `.gitignore`.
- The workflow was updated to avoid committing secrets and to use GitHub Actions secrets for runtime configuration.
- For production file uploads, App Service's filesystem is ephemeral on scale-out — consider using Azure Blob Storage for persistent uploads.

## Troubleshooting
- If GitHub Actions fails during packaging: make sure `client/dist` exists (client build step must have succeeded). The workflow copies client build files into the deployment package.
- If Docker build fails referencing `web.config`, the project `Dockerfile` was updated to not require `web.config`. You can add a `web.config` file to repo root only when deploying to Windows App Service with iisnode.
- If the `az webapp config appsettings set` step fails, ensure `AZURE_RESOURCE_GROUP` is set and `AZURE_CREDENTIALS` (or equivalent ARM secrets) allow access.

## Contacts
If you want me to continue: I can
- add App Service startup instructions, or
- create a simplified workflow that uses only publish-profile deploy without `az` commands, or
- help with configuring Azure Blob Storage for uploads.

---
Generated on: 2025-11-15
