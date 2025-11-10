# Phase 2 Setup Guides

Complete setup instructions for LinkedIn API and SendGrid email services.

---

## Part 1: LinkedIn Job Search API Setup (RapidAPI)

### Step 1: Create RapidAPI Account

1. Go to https://rapidapi.com/
2. Click "Sign Up" (top right)
3. Create account with email or Google

### Step 2: Subscribe to LinkedIn Job Search API

1. Visit: https://rapidapi.com/marketplace
2. Search for "LinkedIn Job Search"
3. Select "LinkedIn Job Search1" by fantastic-jobs
4. Click "Subscribe to Test"
5. Choose a plan:
   - **Free Tier**: 100 requests/month (good for testing)
   - **Basic**: $10/month - 500 requests
   - **Pro**: $30/month - 2,000 requests
   - **Ultra**: $100/month - 10,000 requests

### Step 3: Get Your API Key

1. After subscribing, you'll be on the API page
2. Look for the "Header Parameters" section
3. Find `X-RapidAPI-Key`: `your-key-here`
4. Click the copy button to copy your API key

### Step 4: Add API Key to Environment

```bash
# In backend/.env
RAPIDAPI_KEY=your-actual-rapidapi-key-here
```

### Step 5: Test the Integration

```bash
# Start your backend
cd backend
npm start

# In another terminal, test the endpoint
curl http://localhost:5000/api/jobs/university

# Or trigger manual job aggregation
curl -X POST http://localhost:5000/api/jobs/aggregate \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### API Endpoint Details

**Endpoint**: `GET /api/jobs/university`

**Query Parameters**:
- `page` (number): Page number (default: 1)
- `limit` (number): Results per page (default: 50)
- `keywords` (string): Search keywords
- `location` (string): Job location
- `employmentType` (string): INTERNSHIP, FULL_TIME, etc.

**Response**:
```json
{
  "success": true,
  "data": {
    "jobs": [...],
    "pagination": {
      "total": 150,
      "page": 1,
      "limit": 50,
      "pages": 3
    },
    "stats": {
      "total": 150,
      "handshake": 45,
      "linkedin": 80,
      "other": 25
    }
  }
}
```

### Rate Limits

**Free Tier**:
- 100 requests/month
- ~3 requests/day
- Good for testing

**Recommendation**:
- Use cron job to fetch jobs once per day
- Cache results for 24 hours
- Upgrade to Basic plan ($10/month) for production

### Troubleshooting

**Error: "You are not subscribed to this API"**
- Make sure you subscribed to the API on RapidAPI
- Check that you copied the correct API key
- Wait a few minutes after subscribing

**Error: "Rate limit exceeded"**
- You've hit your monthly limit
- Upgrade your plan or wait until next month
- Check your usage at: https://rapidapi.com/developer/billing

**Error: "Invalid API key"**
- Double-check the API key in .env
- Make sure there are no extra spaces
- Try regenerating the key on RapidAPI

**No Jobs Returned**:
- Check if mock data is being used (warning in logs)
- Verify API key is set correctly
- Check RapidAPI dashboard for any issues

---

## Part 2: SendGrid Email Service Setup

### Step 1: Create SendGrid Account

1. Go to https://sendgrid.com/
2. Click "Start for Free"
3. Fill out the registration form
4. Verify your email address

**Free Tier**: 100 emails/day (3,000/month) - Perfect for getting started!

### Step 2: Verify Your Sender Email

**Important**: SendGrid requires sender verification to send emails.

#### Option A: Single Sender Verification (Easiest)

1. Go to: Settings > Sender Authentication > Single Sender Verification
2. Click "Create New Sender"
3. Fill in the form:
   - **From Name**: Your App Name (e.g., "JobHunt AI")
   - **From Email**: Your email (e.g., noreply@yourdomain.com)
   - **Reply To**: Your support email
   - **Company Address**: Your address (required)
4. Click "Create"
5. Check your email for verification link
6. Click the verification link

#### Option B: Domain Authentication (Recommended for Production)

1. Go to: Settings > Sender Authentication > Domain Authentication
2. Click "Authenticate Your Domain"
3. Enter your domain (e.g., yourdomain.com)
4. Follow DNS setup instructions
5. Add the provided CNAME records to your DNS
6. Click "Verify" after DNS propagation (may take 24-48 hours)

**For development**: Use Option A (Single Sender) with your personal email

### Step 3: Create API Key

1. Go to: Settings > API Keys
2. Click "Create API Key"
3. Name: "JobHunt AI Production"
4. Permissions: "Full Access" (or "Mail Send" only)
5. Click "Create & View"
6. **Copy the API key immediately** (you won't see it again!)

### Step 4: Add API Key to Environment

```bash
# In backend/.env
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
FROM_EMAIL=noreply@yourdomain.com
APP_URL=http://localhost:3000
```

**Important**: Replace `noreply@yourdomain.com` with the email you verified in Step 2.

### Step 5: Install SendGrid Package

```bash
cd backend
npm install @sendgrid/mail
```

### Step 6: Test Email Sending

Create a test file `backend/test-email.js`:

```javascript
const sgMail = require('@sendgrid/mail');
require('dotenv').config();

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const msg = {
  to: 'your-test-email@example.com', // Your actual email
  from: process.env.FROM_EMAIL,
  subject: 'Test Email from JobHunt AI',
  text: 'If you receive this, SendGrid is working!',
  html: '<strong>If you receive this, SendGrid is working!</strong>',
};

sgMail
  .send(msg)
  .then(() => {
    console.log('✅ Email sent successfully!');
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    if (error.response) {
      console.error(error.response.body);
    }
  });
```

Run the test:
```bash
node backend/test-email.js
```

**Check**:
1. ✅ Console shows "Email sent successfully"
2. ✅ You receive the email (check spam folder too!)

### Step 7: Configure Email Templates

SendGrid email templates are now in:
- `backend/src/services/emailService.ts` (to be created in Phase 2B)

Templates include:
- Welcome email
- Job alerts
- Weekly digest
- Application updates
- Password reset

### Common SendGrid Issues

**Error: "The from email does not match a verified Sender Identity"**
- Your FROM_EMAIL must match the verified sender from Step 2
- Go back to Single Sender Verification and verify the email
- Wait a few minutes after verification

**Error: "Forbidden"**
- API key doesn't have the right permissions
- Create a new API key with "Full Access" or "Mail Send"
- Make sure API key is set correctly in .env

**Emails Going to Spam**
- Domain Authentication (Option B in Step 2) helps with this
- Add SPF and DKIM records to your DNS
- Avoid spam trigger words in subject lines
- Include unsubscribe link in emails

**Rate Limiting**
- Free tier: 100 emails/day
- Monitor usage in SendGrid dashboard
- Upgrade if you need more: https://sendgrid.com/pricing/

### Monitoring Email Delivery

1. Go to SendGrid Dashboard: https://app.sendgrid.com/
2. Click "Activity" in sidebar
3. See all sent emails, deliveries, opens, clicks
4. Filter by email, date, status

**Key Metrics to Watch**:
- **Delivered**: % of emails that reached inbox
- **Bounced**: Invalid email addresses
- **Spam Reports**: Users marking as spam
- **Unsubscribes**: Users opting out

**Best Practices**:
- Keep bounce rate < 5%
- Keep spam report rate < 0.1%
- Honor unsubscribe requests immediately
- Send consistent volume (avoid sudden spikes)

---

## Part 3: Integrating Both Services

### Environment Variables Checklist

```bash
# Job APIs
RAPIDAPI_KEY=your-rapidapi-key              # ✓ For LinkedIn jobs
HANDSHAKE_API_KEY=your-handshake-key        # ✓ For Handshake jobs

# Email
SENDGRID_API_KEY=SG.xxxxxxxxxx              # ✓ For sending emails
FROM_EMAIL=noreply@yourdomain.com           # ✓ Verified sender
APP_URL=http://localhost:3000               # ✓ Your frontend URL
```

### Cron Job Schedule

Jobs will run automatically once Phase 2B is complete:

```
Daily (2 AM):    Fetch new jobs from all sources
Daily (9 AM):    Send job alert emails to users
Monday (8 AM):   Send weekly digest emails
```

### Production Deployment Checklist

**LinkedIn API**:
- [ ] Upgrade to at least Basic plan ($10/month)
- [ ] Monitor rate limits in RapidAPI dashboard
- [ ] Set up error alerting

**SendGrid**:
- [ ] Complete Domain Authentication
- [ ] Add unsubscribe link to all emails
- [ ] Set up email preference center
- [ ] Monitor delivery rates
- [ ] Upgrade plan if needed

**Security**:
- [ ] Never commit API keys to git
- [ ] Use environment variables for all secrets
- [ ] Rotate API keys periodically
- [ ] Monitor for suspicious activity

---

## Cost Estimates

### Development (Free Tier)
- **RapidAPI LinkedIn**: $0/month (100 requests)
- **SendGrid**: $0/month (100 emails/day)
- **Total**: $0/month

### Production (Small Scale - 100 users)
- **RapidAPI LinkedIn**: $10/month (500 requests)
- **SendGrid**: $19.95/month (Essentials 50k emails)
- **Total**: ~$30/month

### Production (Medium Scale - 1,000 users)
- **RapidAPI LinkedIn**: $30/month (2,000 requests)
- **SendGrid**: $89.95/month (Pro 1.5M emails)
- **Total**: ~$120/month

### Production (Large Scale - 10,000 users)
- **RapidAPI LinkedIn**: $100/month (10,000 requests)
- **SendGrid**: Custom pricing
- **Total**: ~$200+/month

---

## Next Steps

1. ✅ Set up LinkedIn API (this guide)
2. ✅ Set up SendGrid (this guide)
3. ⏳ Implement email service (Phase 2B)
4. ⏳ Create email cron jobs (Phase 2B)
5. ⏳ Build email preferences UI (Phase 2B)

---

## Support Resources

**LinkedIn Job Search API**:
- Documentation: https://rapidapi.com/fantastic-jobs-fantastic-jobs-default/api/linkedin-job-search1
- Support: Contact via RapidAPI support
- Status: https://status.rapidapi.com/

**SendGrid**:
- Documentation: https://docs.sendgrid.com/
- Support: https://support.sendgrid.com/
- Status: https://status.sendgrid.com/
- Community: https://community.sendgrid.com/

**For Issues**:
- Check the troubleshooting sections above
- Review logs in your application
- Check service status pages
- Contact support if needed

---

**Last Updated**: Phase 2A Implementation
**Next Phase**: Phase 2B - Email Notification System
