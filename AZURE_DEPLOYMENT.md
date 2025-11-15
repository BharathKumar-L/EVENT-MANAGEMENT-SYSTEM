# Azure Deployment Guide

This guide explains how to deploy the Event Management System to Azure App Service using GitHub Actions.

## Prerequisites

1. Azure account with an active subscription
2. Azure App Service created (Linux, Node 18 LTS)
3. GitHub repository connected
4. MongoDB Atlas database (or Azure Cosmos DB)

## Required GitHub Secrets

Configure these secrets in your GitHub repository (Settings → Secrets and variables → Actions):

### Option 1: Using Publish Profile (Simpler)

1. **AZUREAPPSERVICE_PUBLISHPROFILE_WEBAPP_EMS**
   - Download from Azure Portal: App Service → Deployment Center → Manage publish profile
   - Copy the entire XML content

2. **MONGO_URL**
   - Your MongoDB connection string
   - Example: `mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority`

3. **JWT_SECRET**
   - Generate a secure random string (minimum 64 characters)
   - Example: `openssl rand -hex 64`

4. **CORS_ORIGINS**
   - Comma-separated list of allowed origins
   - Example: `https://webapp-ems.azurewebsites.net,https://yourdomain.com`

### Option 2: Using Azure Credentials (More Control)

1. **AZURE_CREDENTIALS**
   - Create service principal:
   ```bash
   az ad sp create-for-rbac --name "github-actions-webapp-ems" --role contributor \
     --scopes /subscriptions/{subscription-id}/resourceGroups/{resource-group} \
     --sdk-auth
   ```
   - Copy the entire JSON output

2. **AZURE_RESOURCE_GROUP**
   - Name of your Azure resource group

3. **MONGO_URL**, **JWT_SECRET**, **CORS_ORIGINS** (same as Option 1)

## Deployment Methods

### Method 1: Standard Node.js Deployment (Current)

Uses `.github/workflows/main_webapp-ems.yml`

**Features:**
- Builds React client and Node.js server
- Deploys as a standard Node.js app
- Sets environment variables via Azure CLI

**To Use:**
1. Ensure all GitHub secrets are configured
2. Push to `main` branch
3. GitHub Actions will automatically build and deploy

### Method 2: Container Deployment (Alternative)

Uses `.github/workflows/azure-container-deploy.yml`

**Features:**
- Builds Docker container with client and server
- Pushes to GitHub Container Registry
- Deploys container to Azure App Service

**To Use:**
1. Enable container deployment in Azure:
   ```bash
   az webapp config container set \
     --name webapp-ems \
     --resource-group {resource-group} \
     --docker-custom-image-name ghcr.io/{github-username}/event-management-system:latest
   ```

2. Rename or disable `main_webapp-ems.yml`

3. Ensure `azure-container-deploy.yml` has required secrets

4. Push to `main` branch

## Azure App Service Configuration

### Application Settings

Set these in Azure Portal → Configuration → Application Settings (if not set via GitHub Actions):

```
NODE_ENV=production
PORT=4000
MONGO_URL={your-mongodb-connection-string}
JWT_SECRET={your-jwt-secret}
CORS_ORIGINS={your-allowed-origins}
```

### Startup Command (if needed)

In Azure Portal → Configuration → General settings:
```
node server.js
```

### Health Check Path

In Azure Portal → Configuration → Health check:
```
/healthz
```

## Local Testing

### Using Docker Compose

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` with your actual values:
   ```
   NODE_ENV=production
   PORT=4000
   MONGO_URL=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   CORS_ORIGINS=http://localhost:3000
   ```

3. Run with Docker Compose:
   ```bash
   docker-compose up --build
   ```

4. Access the application:
   - Client: http://localhost:3000
   - API: http://localhost:4000

### Without Docker

1. Install dependencies:
   ```bash
   npm install
   cd client && npm install && cd ..
   ```

2. Build client:
   ```bash
   cd client && npm run build && cd ..
   ```

3. Copy built client to public folder:
   ```bash
   mkdir -p public
   cp -r client/dist/* public/
   ```

4. Create `.env` file (copy from `.env.example`)

5. Start server:
   ```bash
   npm start
   ```

## Troubleshooting

### Deployment Fails

1. Check GitHub Actions logs for errors
2. Verify all secrets are correctly set
3. Ensure Azure resource names match workflow files

### Application Not Starting

1. Check Azure App Service logs:
   ```bash
   az webapp log tail --name webapp-ems --resource-group {resource-group}
   ```

2. Verify environment variables are set in Azure Portal

3. Check health endpoint: `https://webapp-ems.azurewebsites.net/healthz`

### Database Connection Errors

1. Verify MongoDB connection string is correct
2. Ensure MongoDB allows connections from Azure IPs
3. Check MongoDB Atlas network access settings

### CORS Errors

1. Update `CORS_ORIGINS` in Azure App Settings
2. Include your Azure App Service URL: `https://webapp-ems.azurewebsites.net`

## Security Checklist

- [ ] All secrets stored in GitHub Secrets (not in code)
- [ ] `.env` file added to `.gitignore`
- [ ] MongoDB connection string uses strong password
- [ ] JWT secret is at least 64 characters
- [ ] HTTPS enabled on Azure App Service
- [ ] Azure App Service has firewall rules configured (if needed)
- [ ] MongoDB Atlas has IP whitelisting configured

## Post-Deployment

1. Test health endpoint: `https://webapp-ems.azurewebsites.net/healthz`
2. Test readiness endpoint: `https://webapp-ems.azurewebsites.net/readyz`
3. Test API: `https://webapp-ems.azurewebsites.net/test`
4. Access application: `https://webapp-ems.azurewebsites.net`

## Monitoring

1. Enable Application Insights in Azure Portal
2. Set up alerts for:
   - High response times
   - Failed requests
   - Health check failures
3. Monitor logs regularly

## Rollback

If deployment fails, rollback to previous version:

```bash
az webapp deployment slot swap \
  --name webapp-ems \
  --resource-group {resource-group} \
  --slot staging \
  --target-slot production
```

Or redeploy previous commit from GitHub Actions.
