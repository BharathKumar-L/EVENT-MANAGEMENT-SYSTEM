# 🚀 Quick Deployment Checklist

## ✅ Pre-Deployment (One-Time Setup)

### Step 1: Azure Setup
- [ ] Create Azure App Service (Linux, Node 18 LTS runtime)
- [ ] Note your App Service name: `webapp-ems`
- [ ] Note your Resource Group name

### Step 2: MongoDB Setup
- [ ] Have MongoDB Atlas connection string ready
- [ ] Whitelist Azure datacenter IPs in MongoDB Atlas
- [ ] Test connection string locally

### Step 3: GitHub Secrets
Configure in: **GitHub Repository → Settings → Secrets and variables → Actions**

- [ ] `AZUREAPPSERVICE_PUBLISHPROFILE_WEBAPP_EMS` (from Azure Portal → App Service → Deployment Center)
- [ ] `MONGO_URL` (MongoDB connection string)
- [ ] `JWT_SECRET` (generate: `openssl rand -hex 64`)
- [ ] `CORS_ORIGINS` (e.g., `https://webapp-ems.azurewebsites.net`)

### Step 4: Local Environment
- [ ] Copy `.env.example` to `.env`
- [ ] Fill in real values in `.env` (for local testing only)
- [ ] Verify `.env` is in `.gitignore` ✅ (already done)

## 🔄 Deploy to Azure

### Automatic Deployment (Recommended)
```bash
git add .
git commit -m "Deploy to Azure with secured configuration"
git push origin main
```

GitHub Actions will automatically:
1. ✅ Install dependencies
2. ✅ Build React client
3. ✅ Package application
4. ✅ Set environment variables in Azure
5. ✅ Deploy to Azure App Service

### Monitor Deployment
1. Go to GitHub → Actions tab
2. Click on the running workflow
3. Watch the deployment progress
4. Check for any errors

## 🧪 Test Deployment

After deployment completes:

```bash
# Health check
curl https://webapp-ems.azurewebsites.net/healthz

# Readiness check (DB connection)
curl https://webapp-ems.azurewebsites.net/readyz

# Test endpoint
curl https://webapp-ems.azurewebsites.net/test

# Open in browser
open https://webapp-ems.azurewebsites.net
```

## 🐛 If Something Goes Wrong

### View Azure Logs
```bash
az webapp log tail --name webapp-ems --resource-group YOUR_RESOURCE_GROUP
```

### Common Issues

**"Application Error"**
- Check Azure logs
- Verify all environment variables are set in Azure App Settings
- Check MongoDB connection string

**"502 Bad Gateway"**
- App may be starting up (wait 1-2 minutes)
- Check if PORT is set to 4000 in Azure App Settings

**"CORS Error"**
- Add your Azure URL to `CORS_ORIGINS` secret in GitHub
- Redeploy

**"Database connection failed"**
- Verify MongoDB Atlas allows Azure IP addresses
- Test connection string locally
- Check MongoDB credentials

## 📝 Important Notes

### Security ✅
- ✅ Secrets removed from `docker-compose.yml`
- ✅ `.env.example` sanitized (no real secrets)
- ✅ `.env` in `.gitignore`
- ✅ GitHub Secrets configured
- ✅ Azure App Settings will store production secrets

### What Changed
1. ✅ `docker-compose.yml` - Now uses environment variables from `.env`
2. ✅ `Dockerfile` - Fixed to build client and serve from server
3. ✅ `server.js` - Added static file serving for React app
4. ✅ `.env.example` - Sanitized template without real secrets
5. ✅ `.dockerignore` - Optimized for faster builds
6. ✅ GitHub Actions - Updated to build client and set Azure env vars

### File Structure After Deployment
```
Azure App Service
├── server.js (Node.js backend)
├── models/ (Database models)
├── public/ (Built React app)
├── uploads/ (User uploads)
└── package.json
```

## 🎯 Next Steps After First Deployment

1. **Set up custom domain** (optional)
   - Azure Portal → App Service → Custom domains

2. **Enable SSL** (free with App Service)
   - Azure Portal → App Service → TLS/SSL settings

3. **Configure monitoring**
   - Enable Application Insights
   - Set up alerts

4. **Enable CI/CD**
   - Already configured! ✅
   - Every push to `main` deploys automatically

5. **Update CORS_ORIGINS**
   - Add your custom domain to the secret
   - Redeploy

## 💡 Tips

- **Local Testing:** Use `docker-compose up` to test before pushing
- **Fast Iteration:** GitHub Actions runs on every push to `main`
- **Rollback:** Redeploy previous commit if needed
- **Monitoring:** Check `/healthz` and `/readyz` endpoints regularly

---

**Ready to deploy? Push to main branch! 🚀**
