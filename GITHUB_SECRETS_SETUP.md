# GitHub Secrets Configuration Required

Before deploying to Azure, configure these secrets in your GitHub repository:

**GitHub Repository Settings → Secrets and variables → Actions → New repository secret**

## Required Secrets

### 1. AZUREAPPSERVICE_PUBLISHPROFILE_WEBAPP_EMS
**How to get:**
1. Go to Azure Portal
2. Navigate to your App Service (webapp-ems)
3. Click "Deployment Center" in the left menu
4. Click "Manage publish profile"
5. Copy the entire downloaded XML content
6. Paste into GitHub secret

### 2. MONGO_URL
**Format:** 
```
mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority
```

**Your current value** (from .env - KEEP THIS SECURE!):
- Get from your MongoDB Atlas dashboard
- DO NOT commit this to Git

### 3. JWT_SECRET
**How to generate:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```
OR
```bash
openssl rand -hex 64
```

**Your current value** (from .env - KEEP THIS SECURE!):
- Generate a new one for production
- Minimum 64 characters

### 4. CORS_ORIGINS
**Format:** Comma-separated URLs
```
https://webapp-ems.azurewebsites.net,https://yourdomain.com
```

**For testing, include:**
```
https://webapp-ems.azurewebsites.net
```

## Optional (For Azure CLI method)

### 5. AZURE_CREDENTIALS
**How to get:**
```bash
az ad sp create-for-rbac --name "github-actions-webapp-ems" --role contributor \
  --scopes /subscriptions/YOUR_SUBSCRIPTION_ID/resourceGroups/YOUR_RESOURCE_GROUP \
  --sdk-auth
```
Copy the entire JSON output

### 6. AZURE_RESOURCE_GROUP
Your Azure resource group name (e.g., `rg-webapp-ems`)

---

## After Configuring Secrets

1. **Verify** all secrets are added in GitHub
2. **Push to main branch** to trigger deployment:
   ```bash
   git add .
   git commit -m "Configure Azure deployment with secured secrets"
   git push origin main
   ```
3. **Monitor** deployment in GitHub Actions tab
4. **Check** Azure App Service logs if issues occur

## Important Notes

- ✅ **NEVER** commit `.env` file with real secrets
- ✅ Secrets in `.env.example` are templates only
- ✅ Real secrets are in GitHub Secrets and Azure App Settings
- ✅ docker-compose.yml now reads from `.env` (not hardcoded)
