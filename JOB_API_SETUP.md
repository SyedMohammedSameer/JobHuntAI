# Job API Integration Setup Guide

## Overview

JobHuntAI integrates with 5 job boards to aggregate job listings:

| Job Board | API Key Required | Status | Jobs Available |
|-----------|------------------|--------|----------------|
| **RemoteOK** | ❌ No | ✅ Working | Yes |
| **Arbeitnow** | ❌ No | ✅ Should Work | Europe/Remote jobs |
| **USAJobs** | ✅ Yes | ⚠️ Needs Setup | US Government jobs |
| **Jooble** | ✅ Yes | ⚠️ Needs Setup | Worldwide jobs |
| **CareerJet** | ✅ Yes | ⚠️ Optional | Worldwide jobs |

---

## Quick Fix: Why Am I Only Seeing RemoteOK Jobs?

**Reason**: The other job boards require API credentials that aren't configured yet.

**Immediate Solution**:
1. Arbeitnow should already work (no API key needed)
2. For USAJobs and Jooble, follow setup instructions below

---

## Job Board Setup Instructions

### 1. RemoteOK ✅ (Already Working)
**No setup required** - Works out of the box!

- **Source**: https://remoteok.com
- **Coverage**: Remote tech jobs worldwide
- **Update Frequency**: Daily
- **API Key**: Not required

---

### 2. Arbeitnow ✅ (Should Already Work)
**No setup required** - Free public API

- **Source**: https://arbeitnow.com
- **Coverage**: Europe and remote jobs
- **Update Frequency**: Daily
- **API Key**: Not required

**If not working**: Check backend logs for errors. The API might be rate-limited.

---

### 3. USAJobs ⚠️ (Needs Setup)
**Required for US Government jobs**

#### Step 1: Get API Credentials
1. Go to https://developer.usajobs.gov/APIRequest/Index
2. Click "Request an API Key"
3. Fill out the form:
   - First Name, Last Name
   - Email Address (use your real email)
   - Purpose: "Job aggregation for student visa tracking app"
4. You'll receive:
   - **API Key**: A long string (e.g., `ABC123XYZ...`)
   - **User Agent**: Your email address

#### Step 2: Add to Environment Variables
Create or edit `backend/.env`:

```env
# USAJobs API Credentials
USAJOBS_API_KEY=YOUR_API_KEY_HERE
USAJOBS_USER_AGENT=your-email@example.com
```

#### Step 3: Restart Backend
```bash
cd backend
npm run dev
```

#### Verification:
Check logs for: `✅ Fetched X jobs from USAJOBS`

---

### 4. Jooble ⚠️ (Needs Setup)
**Required for worldwide job aggregation**

#### Step 1: Get API Key
1. Go to https://jooble.org/api/about
2. Fill out the API request form
3. Wait for approval (usually 24-48 hours)
4. You'll receive an API key via email

#### Step 2: Add to Environment Variables
Edit `backend/.env`:

```env
# Jooble API Credentials
JOOBLE_API_KEY=YOUR_API_KEY_HERE
```

#### Step 3: Restart Backend
```bash
cd backend
npm run dev
```

#### Verification:
Check logs for: `✅ Fetched X jobs from Jooble`

---

### 5. CareerJet ❓ (Optional)
**Optional - Additional job source**

Follow similar process as Jooble:
1. Get API key from https://www.careerjet.com/partners/api/
2. Add to `.env`: `CAREERJET_API_KEY=YOUR_KEY`
3. Restart backend

---

## Environment Variables Template

Copy this to your `backend/.env` file:

```env
# ========================================
# JOB API CREDENTIALS
# ========================================

# USAJobs (US Government Jobs)
USAJOBS_API_KEY=
USAJOBS_USER_AGENT=your-email@example.com

# Jooble (Worldwide)
JOOBLE_API_KEY=

# CareerJet (Optional)
CAREERJET_API_KEY=

# ========================================
# JOB SCRAPING CONFIGURATION
# ========================================

# Enable daily automatic job refresh
ENABLE_DAILY_JOB_REFRESH=true

# Cron schedule for daily refresh (2 AM daily by default)
JOB_REFRESH_CRON="0 2 * * *"
```

---

## Troubleshooting

### Issue: "Only seeing RemoteOK jobs"
**Solution**:
1. Add API keys for USAJobs and Jooble (see above)
2. Check if Arbeitnow is working (should work without API key)
3. Restart backend after adding keys

### Issue: "Arbeitnow not working"
**Check**:
```bash
cd backend
npm run dev
# Look for: "Error fetching Arbeitnow" in logs
```

**Common Causes**:
- API rate limiting (wait 1 hour and try again)
- Network issues
- API temporarily down

### Issue: "USAJobs 401 Unauthorized"
**Solution**:
- Double-check your API key is correct
- Verify your email (User Agent) is the one you registered with
- Make sure no extra spaces in `.env` file

### Issue: "Jooble not returning jobs"
**Solution**:
- Verify API key is active (check email from Jooble)
- API might have daily limits - check your quota

---

## Manual Job Refresh (Testing)

To manually trigger job refresh and see which sources work:

### Option 1: API Endpoint (if implemented)
```bash
curl -X POST http://localhost:5000/api/jobs/admin/refresh-now \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Option 2: Direct Service Call
```bash
cd backend
node -e "
const jobAggregator = require('./dist/services/jobAggregator').default;
jobAggregator.aggregateJobs().then(count => {
  console.log('Total jobs fetched:', count);
  process.exit(0);
});
"
```

---

## Expected Results After Setup

Once all APIs are configured:

| Source | Expected Jobs | Update Frequency |
|--------|--------------|------------------|
| RemoteOK | 50-200 | Daily |
| Arbeitnow | 100-300 | Daily |
| USAJobs | 200-500 | Daily |
| Jooble | 500-1000 | Daily |
| **Total** | **~850-2000 jobs** | **Daily** |

---

## Job Cleanup Policy

- Jobs older than **21 days** are automatically deleted
- Jobs older than **30 days** are marked inactive
- Daily refresh adds new jobs and removes duplicates

---

## Need Help?

1. Check backend logs: `cd backend && npm run dev`
2. Look for error messages about specific job sources
3. Verify your `.env` file has correct credentials
4. Test each API individually by checking logs

---

## Quick Start Checklist

- [ ] Copy environment variables template to `backend/.env`
- [ ] Sign up for USAJobs API (5 minutes)
- [ ] Add USAJobs credentials to `.env`
- [ ] Sign up for Jooble API (24-48 hour wait)
- [ ] Add Jooble credentials when received
- [ ] Set `ENABLE_DAILY_JOB_REFRESH=true`
- [ ] Restart backend server
- [ ] Check logs for successful job fetching
- [ ] Verify jobs appear in Jobs page

---

## Summary

**Currently Working**: RemoteOK only
**Easy to Enable**: Arbeitnow (no API key, should already work)
**Requires Registration**: USAJobs (5 min) + Jooble (24-48 hrs wait)
**Total Time to Full Setup**: 5 minutes + waiting for Jooble approval

Once setup is complete, you'll have access to 850-2000 fresh jobs daily across all sources!
