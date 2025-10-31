# Manual Job Fetch Guide

## Quick Start: Fetch Jobs Immediately (Without Waiting for 2AM Cron)

### Prerequisites

1. **Create .env file** in `backend/.env` with your actual API keys:

```bash
# Server Configuration
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Database (REQUIRED - Add your MongoDB URI)
MONGODB_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@YOUR_CLUSTER.mongodb.net/jobhuntai?retryWrites=true&w=majority

# JWT Secret (REQUIRED)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# OpenAI API (REQUIRED for resume tailoring & cover letters)
OPENAI_API_KEY=sk-your-openai-api-key-here

# Job Board APIs
# RemoteOK - No API key needed ✅
# Arbeitnow - No API key needed ✅
USAJOBS_API_KEY=your-usajobs-api-key-here
USAJOBS_USER_AGENT=your-email@example.com
JOOBLE_API_KEY=your-jooble-api-key-here
CAREERJET_AFFID=your-careerjet-affiliate-id-here

# Daily Job Refresh
ENABLE_DAILY_JOB_REFRESH=false
JOB_REFRESH_CRON=0 2 * * *

# Stripe (Optional for now)
STRIPE_SECRET_KEY=your-stripe-secret-key-here
STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret-here

# File Upload
MAX_FILE_SIZE=5242880
ALLOWED_FILE_TYPES=application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document
```

### Method 1: Run Manual Fetch Script (Standalone)

```bash
cd backend
ts-node src/scripts/manualJobFetch.ts
```

This will:
- Connect to MongoDB
- Fetch jobs from ALL configured APIs:
  - RemoteOK ✅ (No key needed)
  - Arbeitnow ✅ (No key needed)
  - USAJOBS (if API key provided)
  - Jooble (if API key provided)
  - CareerJet (if affiliate ID provided)
- Display total jobs fetched
- Save jobs to database

**Expected Output:**
```
🚀 Manual job fetch started...
✅ Connected to MongoDB
📡 Fetching jobs from all APIs...
✅ RemoteOK: 20 jobs fetched
✅ Arbeitnow: 15 jobs fetched
✅ USAJOBS: 25 jobs fetched
✅ Jooble: 18 jobs fetched
✅ Job fetch complete! Total jobs fetched: 78
```

### Method 2: Via API Endpoint (Requires Running Server)

1. Start the backend server:
```bash
cd backend
npm run dev
```

2. Send POST request to trigger job aggregation:
```bash
# You need to be authenticated
curl -X POST http://localhost:5000/api/jobs/aggregate \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

OR trigger full refresh (aggregation + cleanup + deduplication):
```bash
curl -X POST http://localhost:5000/api/jobs/system/refresh \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Troubleshooting

**Issue: "Cannot find module 'dotenv'"**
- Solution: Run `npm install` in the backend directory

**Issue: "MongoDB connection failed"**
- Solution: Check your MONGODB_URI in .env file
- Make sure your IP is whitelisted in MongoDB Atlas

**Issue: "Only seeing RemoteOK jobs"**
- Reason: Other APIs require API keys
- Solution: Add USAJOBS_API_KEY and JOOBLE_API_KEY to .env
- RemoteOK and Arbeitnow work without keys

**Issue: "Error: Cannot read property 'length' of undefined"**
- Reason: Job API returned unexpected data
- Solution: Check API key validity or API service status

### Verifying Results

After running the script, check your Jobs listing page:
```bash
# In your frontend
# Navigate to: http://localhost:5173/jobs
# You should see jobs from multiple sources
```

Or check via API:
```bash
curl http://localhost:5000/api/jobs/search?limit=10
```

### Expected Job Sources

With all API keys configured, you should see jobs from:
- ✅ RemoteOK (always works)
- ✅ Arbeitnow (always works)
- ✅ USAJOBS (if API key valid)
- ✅ Jooble (if API key valid)
- ⏳ CareerJet (if affiliate ID valid)

### Next Steps

After fetching jobs manually:
1. Check the Jobs listing page to verify all sources are working
2. Test the search and filter functionality
3. Test bookmarking jobs
4. Try the Resume tailoring feature with the new jobs
5. Generate cover letters for the jobs

---

## Summary

**Quick Command to Fetch Jobs NOW:**
```bash
cd backend && ts-node src/scripts/manualJobFetch.ts
```

**Requirements:**
- MongoDB URI in .env
- OpenAI API key in .env (for resume/cover letter features)
- USAJOBS & Jooble API keys in .env (for those specific sources)
