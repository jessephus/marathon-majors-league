# Authentication System Setup Guide

## Overview

This guide explains how to set up the external services required for the Phase 2 authentication system implementation. The system supports three authentication methods:

1. **TOTP (Time-Based One-Time Password)** - Google Authenticator, Authy, etc.
2. **SMS OTP (One-Time Password)** - Via SMS delivery
3. **Magic Links** - Passwordless authentication via email

## Prerequisites

Before proceeding with authentication implementation, you need to set up:

- ✅ **Phase 1 Complete**: Database schema migration 003 must be applied
- 🔧 **External Services**: Email and SMS providers (detailed below)
- 🔑 **Environment Variables**: Secure keys for encryption and tokens

---

## Required External Services

### 1. Email Service (Required)

Email is used for:
- Magic link authentication
- Email OTP delivery
- Account verification
- Password reset (future)
- Invite system notifications

#### Recommended Providers

**Option A: SendGrid (Recommended)**
- **Free Tier**: 100 emails/day
- **Setup Time**: ~10 minutes
- **Reliability**: Excellent
- **Documentation**: https://sendgrid.com/docs/

**Option B: AWS SES**
- **Free Tier**: 62,000 emails/month (if sent from EC2)
- **Setup Time**: ~20 minutes
- **Reliability**: Excellent
- **Documentation**: https://docs.aws.amazon.com/ses/

**Option C: Resend**
- **Free Tier**: 100 emails/day
- **Setup Time**: ~5 minutes
- **Reliability**: Excellent
- **Documentation**: https://resend.com/docs

#### Setup Instructions (SendGrid Example)

1. **Create Account**
   - Go to https://sendgrid.com/
   - Sign up for free account
   - Verify your email

2. **Create API Key**
   - Navigate to Settings > API Keys
   - Click "Create API Key"
   - Choose "Restricted Access"
   - Enable "Mail Send" permission only
   - Copy the API key (you'll only see it once!)

3. **Verify Sender Identity**
   - Navigate to Settings > Sender Authentication
   - Choose "Single Sender Verification" (easier) or "Domain Authentication" (better)
   - Follow verification steps

4. **Add to Environment Variables**
   ```env
   EMAIL_SERVICE_PROVIDER=sendgrid
   SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   EMAIL_FROM_ADDRESS=noreply@yourdomain.com
   EMAIL_FROM_NAME=Marathon Majors League
   ```

### 2. SMS Service (Optional but Recommended)

SMS is used for:
- SMS OTP delivery as alternative to TOTP
- Phone number verification

**⚠️ Note**: SMS is OPTIONAL. Users can use TOTP or Magic Links if SMS is not configured.

#### Recommended Providers

**Option A: Twilio (Recommended)**
- **Free Trial**: $15 credit
- **Cost**: ~$0.0075 per SMS (US)
- **Setup Time**: ~15 minutes
- **Documentation**: https://www.twilio.com/docs/

**Option B: AWS SNS**
- **Free Tier**: 100 SMS/month
- **Setup Time**: ~20 minutes
- **Documentation**: https://docs.aws.amazon.com/sns/

#### Setup Instructions (Twilio Example)

1. **Create Account**
   - Go to https://www.twilio.com/
   - Sign up for trial account
   - Verify your phone number

2. **Get Credentials**
   - From Twilio Console dashboard
   - Note your Account SID
   - Note your Auth Token

3. **Get Phone Number**
   - Navigate to Phone Numbers > Buy a Number
   - Choose a number with SMS capabilities
   - Note the phone number (E.164 format: +1234567890)

4. **Add to Environment Variables**
   ```env
   SMS_SERVICE_PROVIDER=twilio
   TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   TWILIO_PHONE_NUMBER=+1234567890
   ```

---

## Required Environment Variables

Add these environment variables to your Vercel project or `.env.local` file:

### Core Security Keys

```env
# Session secret for JWT/session token generation (generate with: openssl rand -base64 32)
SESSION_SECRET=your-random-secret-here-min-32-chars

# TOTP encryption key for encrypting TOTP secrets at rest (generate with: openssl rand -base64 32)
TOTP_ENCRYPTION_KEY=your-encryption-key-here-base64-encoded

# Application URL for magic link generation
APP_URL=https://yourdomain.com
```

### Email Service (Required)

Choose one provider:

**SendGrid:**
```env
EMAIL_SERVICE_PROVIDER=sendgrid
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM_ADDRESS=noreply@yourdomain.com
EMAIL_FROM_NAME=Marathon Majors League
```

**AWS SES:**
```env
EMAIL_SERVICE_PROVIDER=ses
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIAxxxxxxxxxxxxxxxx
AWS_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM_ADDRESS=noreply@yourdomain.com
EMAIL_FROM_NAME=Marathon Majors League
```

**Resend:**
```env
EMAIL_SERVICE_PROVIDER=resend
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM_ADDRESS=noreply@yourdomain.com
EMAIL_FROM_NAME=Marathon Majors League
```

### SMS Service (Optional)

**Twilio:**
```env
SMS_SERVICE_PROVIDER=twilio
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+1234567890
```

**AWS SNS:**
```env
SMS_SERVICE_PROVIDER=sns
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIAxxxxxxxxxxxxxxxx
AWS_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## Generating Required Keys

### Session Secret
```bash
openssl rand -base64 32
```

### TOTP Encryption Key
```bash
openssl rand -base64 32
```

### Example Output
```
SESSION_SECRET=kJ8mNx2pQ4rS6tU8vWxYzA1bC3dE5fG7hI9jK0lM2nO4pQ6rS8tU0vW2xY4zA6b=
TOTP_ENCRYPTION_KEY=aB1cD2eF3gH4iJ5kL6mN7oP8qR9sT0uV1wX2yZ3aB4cD5eF6gH7iJ8kL9mN0oP1q=
```

---

## Adding Environment Variables to Vercel

### Via Vercel Dashboard

1. Go to your project on Vercel
2. Navigate to Settings > Environment Variables
3. Add each variable:
   - **Name**: Variable name (e.g., `SESSION_SECRET`)
   - **Value**: The secret value
   - **Environments**: Select Production, Preview, and Development
4. Click "Save"

### Via Vercel CLI

```bash
# Add production environment variable
vercel env add SESSION_SECRET production

# Add to all environments at once
vercel env add SESSION_SECRET production preview development

# Pull environment variables locally
vercel env pull
```

---

## Local Development Setup

1. **Create `.env.local` file**
   ```bash
   cp .env.example .env.local
   ```

2. **Add all environment variables** (see sections above)

3. **Pull from Vercel** (if already set up there)
   ```bash
   vercel link
   vercel env pull
   ```

4. **Verify variables are loaded**
   ```bash
   # In Node.js REPL or test script
   console.log(process.env.SESSION_SECRET ? '✓ SESSION_SECRET set' : '✗ Missing SESSION_SECRET');
   console.log(process.env.EMAIL_SERVICE_PROVIDER ? '✓ Email configured' : '✗ Email not configured');
   ```

---

## Testing External Services

### Test Email Service

Create a test file `test-email.js`:

```javascript
import { sendEmail } from './pages/api/lib/email.js';

await sendEmail({
  to: 'your-email@example.com',
  subject: 'Test Email from Marathon Majors League',
  text: 'If you receive this, email service is working!',
  html: '<p>If you receive this, email service is working!</p>'
});

console.log('✓ Email sent successfully!');
```

Run:
```bash
node test-email.js
```

### Test SMS Service

Create a test file `test-sms.js`:

```javascript
import { sendSMS } from './pages/api/lib/sms.js';

await sendSMS({
  to: '+1234567890',  // Your phone number
  message: 'Test SMS from Marathon Majors League. Your code is: 123456'
});

console.log('✓ SMS sent successfully!');
```

Run:
```bash
node test-sms.js
```

---

## Security Recommendations

### Production Checklist

- [ ] Use strong, randomly generated secrets (minimum 32 bytes)
- [ ] Never commit secrets to version control
- [ ] Rotate secrets periodically (every 90 days recommended)
- [ ] Use different secrets for production/preview/development
- [ ] Enable MFA on all external service accounts
- [ ] Restrict API key permissions to minimum required
- [ ] Monitor API usage for anomalies
- [ ] Set up billing alerts on paid services
- [ ] Use environment-specific sender addresses if possible

### Key Rotation Procedure

1. Generate new secret
2. Add new secret to environment variables with temporary name
3. Update code to try new secret, fallback to old
4. Deploy and verify
5. Remove old secret after 24-48 hours
6. Update environment variables to use new secret

---

## Cost Estimates

### Free Tier Usage

**Expected Monthly Volume (Small League - 50 users):**
- Email: ~500 emails/month (well within all free tiers)
- SMS: ~100 SMS/month (within free tiers or ~$0.75/month)

**Expected Monthly Volume (Medium League - 500 users):**
- Email: ~5,000 emails/month (SendGrid free tier limit is 100/day = 3,000/month)
- SMS: ~1,000 SMS/month (~$7.50/month on Twilio)

### Recommendations by Scale

**Small Scale (< 100 users):**
- SendGrid free tier for email
- Twilio trial credit for SMS
- **Total Cost**: $0/month

**Medium Scale (100-1,000 users):**
- SendGrid paid plan ($14.95/month for 40k emails)
- Twilio pay-as-you-go (~$10/month)
- **Total Cost**: ~$25/month

**Large Scale (1,000+ users):**
- SendGrid or AWS SES
- AWS SNS or Twilio
- Consider dedicated email infrastructure
- **Total Cost**: Varies, consult pricing

---

## Fallback Strategies

If external services are unavailable:

### Without SMS Service
- Users can still use TOTP (Google Authenticator)
- Users can still use Magic Links via email
- Disable SMS OTP option in UI
- **Impact**: Minimal - TOTP is more secure anyway

### Without Email Service
- ⚠️ **Critical**: Email is required for Magic Links and account verification
- Must set up email service before enabling user accounts
- Consider using admin-only TOTP setup for initial accounts

### Degraded Mode Operation
- If SMS fails: Log error, notify user to use alternative method
- If email fails: Queue for retry, notify admin
- Implement health checks for external services

---

## Troubleshooting

### Email Not Sending

**Issue**: Emails not being received

**Common Causes**:
- API key not set or incorrect
- Sender not verified in email service
- Email in spam folder
- Email service account suspended

**Solutions**:
1. Check API key is correct: `echo $SENDGRID_API_KEY`
2. Verify sender in service dashboard
3. Check service logs/dashboard for errors
4. Test with a different recipient email
5. Check spam folder

### SMS Not Sending

**Issue**: SMS not being received

**Common Causes**:
- Trial account restrictions (Twilio requires verified numbers)
- Phone number format incorrect (must be E.164)
- Account out of credits
- Country/carrier restrictions

**Solutions**:
1. Verify phone number format: `+1234567890` (E.164)
2. Check trial account verified numbers list
3. Check account balance/credits
4. Test with verified phone number first
5. Check service logs for delivery status

### TOTP Not Working

**Issue**: TOTP codes not validating

**Common Causes**:
- Server time drift
- Wrong secret encoding
- User device time not synced

**Solutions**:
1. Verify server time is accurate: `date`
2. Check TOTP secret is base32 encoded
3. Test with multiple authenticator apps
4. Allow time drift window (±1 period)
5. Ask user to sync device time

---

## Next Steps After Setup

Once external services are configured:

1. **Verify environment variables**
   ```bash
   vercel env pull
   # Check .env.local has all required variables
   ```

2. **Test services**
   - Send test email
   - Send test SMS (if configured)

3. **Deploy authentication endpoints**
   ```bash
   vercel --prod
   ```

4. **Test authentication flow**
   - Register new account
   - Complete email verification
   - Set up TOTP
   - Test login with each method

5. **Monitor usage**
   - Check email service dashboard
   - Check SMS service dashboard
   - Set up billing alerts

---

## Support and Resources

### Documentation Links

- **TOTP Standard**: [RFC 6238](https://tools.ietf.org/html/rfc6238)
- **SendGrid**: https://sendgrid.com/docs/
- **Twilio**: https://www.twilio.com/docs/
- **AWS SES**: https://docs.aws.amazon.com/ses/
- **AWS SNS**: https://docs.aws.amazon.com/sns/

### Getting Help

If you encounter issues:

1. Check this documentation
2. Review service provider documentation
3. Check service status pages
4. Review application logs
5. Create GitHub issue with details

---

## Summary Checklist

Before proceeding with authentication implementation:

- [ ] Email service account created and verified
- [ ] Email API key generated and added to environment variables
- [ ] SMS service account created (optional)
- [ ] SMS credentials added to environment variables (if using)
- [ ] SESSION_SECRET generated and added
- [ ] TOTP_ENCRYPTION_KEY generated and added
- [ ] APP_URL configured
- [ ] Test email sent successfully
- [ ] Test SMS sent successfully (if using)
- [ ] Environment variables verified in Vercel
- [ ] Local .env.local file configured
- [ ] Secrets backed up securely (password manager, etc.)

**Once all items are checked, you're ready to proceed with Phase 2 implementation!**
