# SendGrid Email Troubleshooting Guide

## Issue: "Email sent successfully" but email not received

This guide will help you debug and fix SendGrid email delivery issues.

---

## Step 1: Verify SendGrid Account Status

1. Go to https://app.sendgrid.com/
2. Log into your account
3. Check for any warnings or notifications
4. Verify your account is active (not suspended)

---

## Step 2: Check Sender Verification

**This is the #1 reason emails don't arrive!**

### Verify Your Sender Email:

1. Go to: **Settings** > **Sender Authentication** > **Single Sender Verification**
2. Find your sender email (the one in `FROM_EMAIL`)
3. Status should be: ✅ **Verified**

### If NOT Verified:

```bash
# Your current FROM_EMAIL in .env
FROM_EMAIL=noreply@yourdomain.com
```

**You MUST verify this exact email address!**

**To Verify:**
1. Click "Create New Sender" or "Verify"
2. Enter the EXACT email from your `FROM_EMAIL`
3. Check your email inbox (the FROM_EMAIL inbox)
4. Click the verification link SendGrid sent
5. Wait 5 minutes for verification to complete

**Common Mistake:**
```bash
# If you verified: john@example.com
# But your .env has:  FROM_EMAIL=noreply@example.com
# ❌ MISMATCH - Emails will be "sent" but not delivered!
```

**Fix:**
```bash
# Option 1: Use the verified email
FROM_EMAIL=john@example.com  # The one you verified

# Option 2: Verify the noreply email
# Go to SendGrid and verify noreply@example.com
```

---

## Step 3: Run the Email Test Script

Create `backend/test-email.js`:

```javascript
const sgMail = require('@sendgrid/mail');
require('dotenv').config();

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// IMPORTANT: Change this to YOUR actual email
const TEST_EMAIL = 'your-actual-email@gmail.com'; // ← CHANGE THIS!

const msg = {
  to: TEST_EMAIL,
  from: process.env.FROM_EMAIL, // Must be verified!
  subject: '✅ SendGrid Test - ' + new Date().toLocaleTimeString(),
  text: 'If you see this, SendGrid is working!',
  html: '<h1 style="color: green;">✅ SendGrid Working!</h1><p>Test sent at: ' + new Date().toLocaleString() + '</p>',
};

console.log('📧 Sending test email...');
console.log('From:', process.env.FROM_EMAIL);
console.log('To:', TEST_EMAIL);
console.log('API Key starts with:', process.env.SENDGRID_API_KEY?.substring(0, 10) + '...');

sgMail
  .send(msg)
  .then((response) => {
    console.log('✅ Email sent successfully!');
    console.log('Status Code:', response[0].statusCode);
    console.log('Response Headers:', response[0].headers);
    console.log('\n📬 Check your email inbox:', TEST_EMAIL);
    console.log('⚠️  Also check SPAM folder!');
  })
  .catch((error) => {
    console.error('❌ Error sending email:');
    console.error('Error message:', error.message);

    if (error.response) {
      console.error('Status:', error.response.statusCode);
      console.error('Body:', JSON.stringify(error.response.body, null, 2));
    }
  });
```

Run the test:
```bash
cd backend
node test-email.js
```

### Expected Output (Success):
```
📧 Sending test email...
From: your-verified-email@example.com
To: your-actual-email@gmail.com
API Key starts with: SG.xxxxxxxx...
✅ Email sent successfully!
Status Code: 202
Response Headers: { ... }

📬 Check your email inbox: your-actual-email@gmail.com
⚠️  Also check SPAM folder!
```

### Check Your Inbox:
1. ✅ Check primary inbox
2. ✅ Check SPAM/Junk folder
3. ✅ Check Promotions/Social tabs (Gmail)
4. ✅ Wait 2-3 minutes for delivery

---

## Step 4: Check SendGrid Activity Feed

This shows you EXACTLY what happened to your email!

1. Go to: https://app.sendgrid.com/
2. Click: **Activity** (left sidebar)
3. Find your test email
4. Check the status:

### Possible Statuses:

✅ **Delivered** - Email reached inbox (check spam folder!)
✅ **Processed** - SendGrid sent it to recipient's mail server
⚠️ **Deferred** - Temporary delay (try again in a few minutes)
❌ **Bounced** - Email address is invalid
❌ **Blocked** - Recipient's server rejected it
❌ **Dropped** - SendGrid didn't send it (usually sender verification issue)

### If Status is "Dropped":

**Reason**: "Sender email not verified"

**Fix**:
1. Go to Sender Authentication
2. Verify the exact email in your `FROM_EMAIL`
3. Check email inbox and click verification link
4. Try sending again after 5 minutes

---

## Step 5: Common Issues and Fixes

### Issue 1: "The from email does not match a verified Sender Identity"

```bash
# Error in console:
Error: Forbidden
Body: {
  "errors": [
    {
      "message": "The from email does not match a verified Sender Identity",
      "field": "from",
      "help": null
    }
  ]
}
```

**Fix:**
```bash
# Check your .env file
cat backend/.env | grep FROM_EMAIL

# Output shows: FROM_EMAIL=noreply@example.com

# Go to SendGrid and verify this EXACT email
# OR change FROM_EMAIL to an already-verified email
```

---

### Issue 2: Email Goes to Spam

**Symptoms:**
- Email "delivered" but in spam folder
- No error in SendGrid

**Quick Fixes:**

1. **Domain Authentication** (Recommended):
   - Go to: Settings > Sender Authentication > Domain Authentication
   - Authenticate your domain (adds SPF/DKIM records)
   - This greatly improves deliverability

2. **Email Content**:
   - Avoid spam trigger words: "free", "click here", "act now"
   - Include company name and address
   - Add unsubscribe link
   - Use plain text version

3. **Warm Up Your Domain**:
   - Start with small volumes (10-20 emails/day)
   - Gradually increase over 2 weeks
   - Maintain consistent sending schedule

---

### Issue 3: API Key Invalid

```bash
# Error:
Error: Forbidden
Body: { "errors": [ { "message": "The provided authorization grant is invalid" } ] }
```

**Fix:**
```bash
# Check if API key is set
echo $SENDGRID_API_KEY

# If empty or wrong, update .env:
SENDGRID_API_KEY=SG.your-real-key-here

# Restart your backend server!
```

**Generate New API Key:**
1. Go to: Settings > API Keys
2. Click "Create API Key"
3. Name: "JobHunt Production"
4. Permissions: "Full Access"
5. Copy the key immediately (you won't see it again!)
6. Update .env with new key

---

### Issue 4: Using Personal Email (Gmail/Yahoo)

If you're using a personal email like `john@gmail.com`:

**Problems:**
- Gmail may block SendGrid from sending as you
- Your email reputation affects deliverability

**Solution:**

**Option A: Use Your Own Domain** (Best)
```bash
FROM_EMAIL=noreply@yourdomain.com
```

**Option B: Use SendGrid Domain** (Development Only)
```bash
# SendGrid allows testing with their domain
# But NOT for production!
FROM_EMAIL=test@sendgrid.net
```

**Option C: Create a Free Business Email**
1. Get a free domain from Freenom (free .tk, .ml, .ga domains)
2. Use free email hosting (Zoho Mail free tier)
3. Verify that email in SendGrid

---

## Step 6: Advanced Debugging

### Enable Detailed Logging:

Update your test script:

```javascript
const sgMail = require('@sendgrid/mail');
require('dotenv').config();

// Enable debug logging
sgMail.setClient(require('@sendgrid/client'));
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const msg = {
  to: 'your-email@example.com',
  from: process.env.FROM_EMAIL,
  subject: 'Debug Test',
  text: 'Debug test',
};

sgMail
  .send(msg, false, (error, result) => {
    if (error) {
      console.error('Full error:', JSON.stringify(error, null, 2));
    } else {
      console.log('Full response:', JSON.stringify(result, null, 2));
    }
  });
```

### Check Environment Variables:

```bash
# Print all SendGrid-related vars
cd backend
node -e "require('dotenv').config(); console.log('SENDGRID_API_KEY:', process.env.SENDGRID_API_KEY?.substring(0, 15) + '...'); console.log('FROM_EMAIL:', process.env.FROM_EMAIL); console.log('APP_URL:', process.env.APP_URL);"
```

Expected output:
```
SENDGRID_API_KEY: SG.xxxxxxxxx...
FROM_EMAIL: your-verified-email@example.com
APP_URL: http://localhost:3000
```

---

## Step 7: Verify Email Configuration Checklist

Run through this checklist:

```bash
# 1. API Key is set and starts with "SG."
echo "API Key: ${SENDGRID_API_KEY:0:10}..."
# Should show: API Key: SG.xxxxxxx...

# 2. FROM_EMAIL is set
echo "FROM_EMAIL: $FROM_EMAIL"
# Should show: FROM_EMAIL: your-email@example.com

# 3. SendGrid package is installed
npm list @sendgrid/mail
# Should show: @sendgrid/mail@x.x.x

# 4. .env file exists and is loaded
ls -la backend/.env
# Should show: -rw------- ... backend/.env
```

---

## Quick Diagnosis Script

Save this as `backend/diagnose-sendgrid.js`:

```javascript
require('dotenv').config();
const sgMail = require('@sendgrid/mail');

console.log('🔍 SendGrid Diagnosis');
console.log('='.repeat(50));

// Check 1: Environment Variables
console.log('\n1️⃣ Environment Variables:');
console.log('   SENDGRID_API_KEY:', process.env.SENDGRID_API_KEY ? '✅ Set (starts with: ' + process.env.SENDGRID_API_KEY.substring(0, 10) + '...)' : '❌ NOT SET');
console.log('   FROM_EMAIL:', process.env.FROM_EMAIL || '❌ NOT SET');
console.log('   APP_URL:', process.env.APP_URL || '❌ NOT SET');

// Check 2: API Key Format
console.log('\n2️⃣ API Key Format:');
if (process.env.SENDGRID_API_KEY) {
  if (process.env.SENDGRID_API_KEY.startsWith('SG.')) {
    console.log('   ✅ API key format looks correct');
  } else {
    console.log('   ❌ API key should start with "SG."');
  }
} else {
  console.log('   ❌ No API key found');
}

// Check 3: Package Installation
console.log('\n3️⃣ SendGrid Package:');
try {
  const version = require('@sendgrid/mail/package.json').version;
  console.log('   ✅ @sendgrid/mail installed (v' + version + ')');
} catch (e) {
  console.log('   ❌ @sendgrid/mail NOT installed');
  console.log('   Run: npm install @sendgrid/mail');
}

// Check 4: Test Connection
console.log('\n4️⃣ Testing SendGrid Connection...');
if (process.env.SENDGRID_API_KEY && process.env.FROM_EMAIL) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);

  const msg = {
    to: process.env.FROM_EMAIL, // Send to yourself
    from: process.env.FROM_EMAIL,
    subject: 'SendGrid Diagnosis Test',
    text: 'If you receive this, SendGrid is working!',
  };

  sgMail.send(msg)
    .then(() => {
      console.log('   ✅ Test email sent successfully!');
      console.log('   📬 Check inbox:', process.env.FROM_EMAIL);
      console.log('   ⚠️  Also check SPAM folder!');
    })
    .catch((error) => {
      console.log('   ❌ Error sending test email:');
      console.log('   ', error.message);
      if (error.response) {
        console.log('   Status:', error.response.statusCode);
        console.log('   Error details:', JSON.stringify(error.response.body, null, 2));
      }
    });
} else {
  console.log('   ⏭️  Skipped (missing API key or FROM_EMAIL)');
}

console.log('\n' + '='.repeat(50));
console.log('📋 Next Steps:');
console.log('1. Fix any ❌ issues above');
console.log('2. Check SendGrid Activity Feed');
console.log('3. Verify sender email in SendGrid dashboard');
console.log('4. Check spam folder');
```

Run diagnosis:
```bash
node backend/diagnose-sendgrid.js
```

---

## Still Not Working?

### Contact SendGrid Support:

1. Go to: https://support.sendgrid.com/
2. Click "Submit a Ticket"
3. Include:
   - Your SendGrid username
   - FROM_EMAIL you're using
   - Error messages from Activity Feed
   - Screenshots of sender verification page

### Common Resolution Time:
- Sender verification issues: Instant (once verified)
- Deliverability issues: 24-48 hours
- API key issues: Instant (regenerate key)
- Account issues: 1-2 business days

---

## Success Checklist

- [ ] SendGrid account is active
- [ ] FROM_EMAIL is verified in SendGrid (Single Sender Verification)
- [ ] API key starts with "SG." and has "Full Access" or "Mail Send" permission
- [ ] API key is correctly set in backend/.env
- [ ] @sendgrid/mail package is installed
- [ ] Test script sends email successfully (statusCode 202)
- [ ] Email appears in SendGrid Activity Feed as "Delivered"
- [ ] Email received in inbox (or spam folder)

---

Once all items are checked ✅, your SendGrid is fully configured!
