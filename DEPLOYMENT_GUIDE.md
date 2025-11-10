# 🚀 AI Job Hunt - Production Deployment Guide

Complete guide to deploying AI Job Hunt to production.

## 📋 Table of Contents
1. [Prerequisites](#prerequisites)
2. [Email Service Setup (SendGrid)](#email-service-setup)
3. [Error Monitoring Setup (Sentry)](#error-monitoring-setup)
4. [Database Setup (MongoDB Atlas)](#database-setup)
5. [Backend Deployment (Railway)](#backend-deployment)
6. [Stripe Webhook Configuration](#stripe-webhook-configuration)
7. [Frontend Deployment (Netlify)](#frontend-deployment)
8. [Post-Deployment Testing](#post-deployment-testing)
9. [Monitoring & Maintenance](#monitoring--maintenance)

---

## Prerequisites

Before deploying, ensure you have:

- ✅ GitHub account
- ✅ Railway account (https://railway.app)
- ✅ Netlify account (https://netlify.com)
- ✅ SendGrid account (https://sendgrid.com)
- ✅ Sentry account (https://sentry.io)
- ✅ MongoDB Atlas account (https://www.mongodb.com/cloud/atlas)
- ✅ Stripe account with live API keys
- ✅ OpenAI API key
- ✅ Domain name (optional)

---

## 📧 Email Service Setup (SendGrid)

### Step 1: Create SendGrid Account
1. Go to https://sendgrid.com
2. Sign up for free account (100 emails/day)
3. Complete email verification

### Step 2: Create API Key
1. Navigate to Settings → API Keys
2. Click "Create API Key"
3. Name it "JobHuntAI Production"
4. Select "Full Access"
5. Copy the API key (save it securely)

### Step 3: Verify Sender Identity
1. Go to Settings → Sender Authentication
2. Click "Verify a Single Sender"
3. Enter your email (e.g., noreply@yourdomain.com)
4. Complete verification process

### Step 4: (Optional) Set up Domain Authentication
1. Go to Settings → Sender Authentication
2. Click "Authenticate Your Domain"
3. Follow DNS setup instructions
4. Wait for DNS propagation (24-48 hours)

**Environment Variables Needed:**
```bash
SENDGRID_API_KEY=SG.your_api_key_here
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
SENDGRID_FROM_NAME=AI Job Hunt
```

---

## 🔍 Error Monitoring Setup (Sentry)

### Step 1: Create Sentry Account
1. Go to https://sentry.io
2. Sign up (free for 5,000 events/month)
3. Create new organization

### Step 2: Create Projects
1. Click "Create Project"
2. Select "Node.js" → Name: "JobHuntAI-Backend"
3. Copy the DSN key
4. Repeat for frontend: "Express" → Name: "JobHuntAI-Frontend"

### Step 3: Configure Source Maps (Optional)
For better error tracking with source maps:
```bash
# In backend/package.json
"scripts": {
  "build": "tsc",
  "sentry:upload": "sentry-cli releases files <RELEASE> upload-sourcemaps ./dist"
}
```

**Environment Variables Needed:**
```bash
# Backend
SENTRY_DSN=https://your_backend_dsn@sentry.io/project_id
SENTRY_ENVIRONMENT=production

# Frontend (add to Netlify)
VITE_SENTRY_DSN=https://your_frontend_dsn@sentry.io/project_id
VITE_ENVIRONMENT=production
```

---

## 💾 Database Setup (MongoDB Atlas)

### Step 1: Create Cluster
1. Go to https://www.mongodb.com/cloud/atlas
2. Create free M0 cluster
3. Choose cloud provider and region (closest to Railway deployment)
4. Wait for cluster creation

### Step 2: Configure Security
1. **Database Access:**
   - Click "Database Access"
   - Add new database user
   - Choose password authentication
   - Save username and password

2. **Network Access:**
   - Click "Network Access"
   - Add IP Address
   - Click "Allow Access from Anywhere" (0.0.0.0/0)
   - Confirm

### Step 3: Get Connection String
1. Click "Connect" on your cluster
2. Choose "Connect your application"
3. Copy connection string
4. Replace `<username>` and `<password>` with your credentials
5. Replace `<dbname>` with your database name (e.g., `jobhuntai`)

**Connection String Format:**
```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/jobhuntai?retryWrites=true&w=majority
```

---

## 🚂 Backend Deployment (Railway)

### Step 1: Prepare Backend Code
1. Ensure all changes are committed to GitHub
2. Verify `backend/package.json` has correct scripts:
```json
{
  "scripts": {
    "start": "node dist/server.js",
    "build": "tsc"
  }
}
```

### Step 2: Create Railway Project
1. Go to https://railway.app
2. Click "New Project"
3. Choose "Deploy from GitHub repo"
4. Select your repository
5. Railway auto-detects Node.js

### Step 3: Configure Build Settings
Railway should auto-detect, but verify:
- **Root Directory:** `backend`
- **Build Command:** `npm install && npm run build`
- **Start Command:** `npm start`

### Step 4: Add MongoDB Plugin
1. In Railway dashboard, click "+ New"
2. Select "Database" → "Add MongoDB"
3. Railway provides connection string automatically
4. OR use your MongoDB Atlas connection string

### Step 5: Configure Environment Variables
In Railway dashboard, add all variables from `backend/.env.production.example`:

```bash
NODE_ENV=production
PORT=5000
MONGODB_URI=<your-mongodb-connection-string>
JWT_SECRET=<generate-strong-secret-32+chars>
JWT_REFRESH_SECRET=<generate-different-strong-secret>
FRONTEND_URL=https://your-app.netlify.app
OPENAI_API_KEY=<your-openai-key>
STRIPE_SECRET_KEY=sk_live_<your-stripe-live-key>
STRIPE_WEBHOOK_SECRET=<will-add-after-webhook-setup>
SENDGRID_API_KEY=<your-sendgrid-key>
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
SENDGRID_FROM_NAME=AI Job Hunt
SENTRY_DSN=<your-sentry-backend-dsn>
SENTRY_ENVIRONMENT=production
```

**Generate Strong Secrets:**
```bash
# Use this command to generate secrets:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 6: Deploy
1. Railway auto-deploys on push to main
2. Monitor deployment logs
3. Once deployed, get your URL: `https://your-app.up.railway.app`
4. Test health endpoint: `https://your-app.up.railway.app/health`

---

## 💳 Stripe Webhook Configuration

### Step 1: Get Webhook Secret
1. Go to Stripe Dashboard → Developers → Webhooks
2. Click "+ Add endpoint"
3. Endpoint URL: `https://your-app.up.railway.app/api/webhooks/stripe`
4. Select events to listen to:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Click "Add endpoint"
6. Copy the "Signing secret" (starts with `whsec_`)

### Step 2: Update Railway Environment
1. Go back to Railway dashboard
2. Add/Update environment variable:
```bash
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

### Step 3: Test Webhook
1. In Stripe Dashboard, click on your webhook
2. Click "Send test webhook"
3. Select an event type
4. Check Railway logs for successful processing

---

## 🌐 Frontend Deployment (Netlify)

**Note:** This guide assumes you have a frontend built with Vite/React. If your frontend is not yet set up, please ensure the frontend code is in the repository first.

### Step 1: Prepare Environment Variables
Create a production environment file (if using Vite):

**`.env.production`:**
```bash
VITE_API_URL=https://your-app.up.railway.app
VITE_SENTRY_DSN=https://your_frontend_dsn@sentry.io/project_id
VITE_ENVIRONMENT=production
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key
```

### Step 2: Create `netlify.toml`
In the root directory, create:

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[build.environment]
  NODE_VERSION = "18"
```

### Step 3: Deploy to Netlify

**Option A: Git Integration (Recommended)**
1. Go to https://app.netlify.com
2. Click "Add new site" → "Import an existing project"
3. Connect GitHub repository
4. Configure build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
5. Add environment variables in Netlify dashboard (from `.env.production`)
6. Click "Deploy site"

**Option B: CLI Deployment**
```bash
npm install -g netlify-cli
netlify login
netlify init
netlify deploy --prod
```

### Step 4: Configure Custom Domain (Optional)
1. In Netlify: Site settings → Domain management
2. Click "Add custom domain"
3. Enter your domain (e.g., `jobhuntai.com`)
4. Follow DNS configuration instructions
5. SSL certificate provisioned automatically

### Step 5: Update Backend CORS
After deploying frontend, update Railway environment:
```bash
FRONTEND_URL=https://jobhuntai.com
# OR if using Netlify subdomain:
FRONTEND_URL=https://your-app.netlify.app
```

Redeploy backend for CORS changes to take effect.

---

## ✅ Post-Deployment Testing

### Backend Health Check
```bash
curl https://your-app.up.railway.app/health
```

Expected response:
```json
{
  "success": true,
  "message": "Server is running",
  "environment": "production",
  "timestamp": "2025-11-01T12:00:00.000Z"
}
```

### Production Test Checklist

#### Authentication & User Flow:
- [ ] Visit production frontend URL
- [ ] Sign up with a new test account
- [ ] Verify welcome email received
- [ ] Log in successfully
- [ ] Update profile information

#### Core Features:
- [ ] Search for jobs
- [ ] Upload resume (test with PDF and DOCX)
- [ ] Generate AI cover letter
- [ ] Create job application
- [ ] Update visa tracker (Premium feature)
- [ ] Check all pages load correctly

#### Payment Flow:
- [ ] Navigate to Premium page
- [ ] Click upgrade button
- [ ] Complete Stripe checkout with **REAL TEST CARD**:
  - Card: `4242 4242 4242 4242`
  - Exp: Any future date
  - CVC: Any 3 digits
- [ ] Verify subscription status updates
- [ ] Confirm premium welcome email received
- [ ] Access Stripe customer portal

#### Email Notifications:
- [ ] Sign up → Receive welcome email
- [ ] Check spam folder if not in inbox
- [ ] Verify email renders correctly on mobile/desktop

#### Performance & Security:
- [ ] Run Lighthouse audit (aim for 90+ score)
- [ ] Test on mobile device
- [ ] Check HTTPS padlock in browser
- [ ] Test security headers: https://securityheaders.com
- [ ] Verify CORS (try API from unauthorized domain → should fail)

#### Monitoring:
- [ ] Check Sentry for any errors
- [ ] Verify Railway logs are clean
- [ ] Monitor database connections in MongoDB Atlas

---

## 📊 Monitoring & Maintenance

### Daily Checks
1. **Sentry Dashboard**
   - Review error count
   - Check for new issues
   - Monitor performance metrics

2. **Railway Metrics**
   - Check CPU/Memory usage
   - Monitor response times
   - Review logs for errors

3. **MongoDB Atlas**
   - Monitor database size
   - Check slow queries
   - Review connection count

### Weekly Tasks
1. **SendGrid Dashboard**
   - Check email delivery rates
   - Review bounce/spam reports
   - Monitor quota usage (100/day on free tier)

2. **Stripe Dashboard**
   - Review successful payments
   - Check failed charges
   - Monitor subscription status

3. **Performance**
   - Run Lighthouse audit
   - Check page load times
   - Review API response times

### Monthly Tasks
1. **Security Updates**
   - Run `npm audit` in both projects
   - Update dependencies:
     ```bash
     npm update
     npm audit fix
     ```
   - Review Sentry security advisories

2. **Cost Review**
   - Railway usage (upgrade if needed)
   - MongoDB Atlas storage
   - SendGrid email count
   - OpenAI API usage

3. **Backups**
   - Export MongoDB data
   - Backup environment variables
   - Document any configuration changes

---

## 🔧 Troubleshooting

### Backend Issues

**500 Internal Server Error:**
1. Check Railway logs: `railway logs`
2. Verify all environment variables are set
3. Check Sentry for detailed error
4. Ensure MongoDB connection is working

**Email Not Sending:**
1. Verify SendGrid API key is correct
2. Check SendGrid dashboard for blocked emails
3. Verify sender email is authenticated
4. Check Railway logs for email errors

**Stripe Webhooks Failing:**
1. Verify webhook secret is correct
2. Check webhook endpoint URL is accessible
3. Test with Stripe CLI:
   ```bash
   stripe listen --forward-to your-app.up.railway.app/api/webhooks/stripe
   ```

### Frontend Issues

**404 on Page Refresh:**
- Ensure `netlify.toml` has redirect rules
- Redeploy if needed

**CORS Errors (CRITICAL FIX):**
If you see this error in the browser console:
```
Access to XMLHttpRequest at 'https://your-backend.railway.app/api/...' from origin 'https://your-frontend.netlify.app'
has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

**Solution:**
1. Go to your Railway project dashboard
2. Navigate to "Variables" tab
3. Ensure `FRONTEND_URL` is set to your **exact** Netlify URL
   ```
   FRONTEND_URL=https://jobs4uai.netlify.app
   ```
   ⚠️ **Must be exact match - no trailing slash, must include https://**
4. Redeploy your backend on Railway
5. Clear browser cache and test again

**Common mistakes:**
- ❌ `FRONTEND_URL=http://jobs4uai.netlify.app` (wrong protocol)
- ❌ `FRONTEND_URL=https://jobs4uai.netlify.app/` (trailing slash)
- ❌ `FRONTEND_URL` not set at all
- ✅ `FRONTEND_URL=https://jobs4uai.netlify.app` (correct!)

**API Calls Failing:**
- Check `VITE_API_URL` is correct in Netlify environment variables
- Verify CORS settings in backend (see CORS errors above)
- Check browser console for errors
- Test backend health endpoint: `https://your-backend.railway.app/health`

**Build Failures:**
- Check Netlify build logs
- Verify all dependencies are in `package.json`
- Ensure environment variables are set

---

## 📞 Support & Resources

### Documentation
- Railway: https://docs.railway.app
- Netlify: https://docs.netlify.com
- SendGrid: https://docs.sendgrid.com
- Sentry: https://docs.sentry.io
- Stripe: https://stripe.com/docs

### Monitoring Tools
- Sentry Dashboard: https://sentry.io
- Railway Dashboard: https://railway.app/dashboard
- Netlify Dashboard: https://app.netlify.com
- MongoDB Atlas: https://cloud.mongodb.com
- SendGrid: https://app.sendgrid.com

### Status Pages
- Railway Status: https://status.railway.app
- Netlify Status: https://www.netlifystatus.com
- MongoDB Atlas Status: https://status.cloud.mongodb.com

---

## 🎉 Deployment Complete!

Your AI Job Hunt application is now live! 🚀

**Next Steps:**
1. Share the URL with beta testers
2. Monitor logs for the first 24 hours
3. Set up uptime monitoring (e.g., UptimeRobot)
4. Create a status page for users
5. Plan your marketing launch!

---

**Questions or Issues?**
Check the troubleshooting section above or review the application logs in Railway/Netlify dashboards.
