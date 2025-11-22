# Email Setup Guide

## Current Status

**Yes, the system CAN send real emails!** However, it needs SMTP configuration to work.

### How It Works

The email service has two modes:

1. **Development Mode (Current)** - If SMTP is not configured, emails are logged to the console
2. **Production Mode** - If SMTP is configured, emails are sent via SMTP to real email addresses

---

## Setting Up Real Email Sending

### Step 1: Choose an Email Provider

You can use any SMTP provider. Here are popular options:

#### Option A: Gmail (Free, Easy Setup)
- **SMTP Host:** `smtp.gmail.com`
- **SMTP Port:** `587` (TLS) or `465` (SSL)
- **Requires:** Gmail account with "App Password" (not regular password)

#### Option B: SendGrid (Free Tier: 100 emails/day)
- **SMTP Host:** `smtp.sendgrid.net`
- **SMTP Port:** `587`
- **Requires:** SendGrid account and API key

#### Option C: Mailgun (Free Tier: 5,000 emails/month)
- **SMTP Host:** `smtp.mailgun.org`
- **SMTP Port:** `587`
- **Requires:** Mailgun account

#### Option D: Outlook/Hotmail
- **SMTP Host:** `smtp-mail.outlook.com`
- **SMTP Port:** `587`
- **Requires:** Outlook account

#### Option E: University Email Server
- Use your university's SMTP server (ask IT department)

---

### Step 2: Configure Environment Variables

Edit `backend/.env` file and add your SMTP credentials:

```env
# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_SECURE=false
SMTP_FROM=noreply@csis.edu
```

---

### Step 3: Gmail Setup (Most Common)

If using Gmail, you need to create an "App Password":

1. **Enable 2-Factor Authentication** on your Google account
2. Go to: https://myaccount.google.com/apppasswords
3. Create a new app password for "Mail"
4. Copy the 16-character password
5. Use it as `SMTP_PASS` in your `.env` file

**Example `.env` for Gmail:**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=yourname@gmail.com
SMTP_PASS=abcd efgh ijkl mnop  # App password (16 chars, spaces optional)
SMTP_SECURE=false
SMTP_FROM=yourname@gmail.com
```

---

### Step 4: SendGrid Setup (Recommended for Production)

1. **Sign up:** https://sendgrid.com
2. **Create API Key:**
   - Go to Settings → API Keys
   - Create new API key
   - Copy the key
3. **Configure `.env`:**
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=SG.your-api-key-here
SMTP_SECURE=false
SMTP_FROM=noreply@csis.edu
```

---

### Step 5: Test Email Sending

After configuring SMTP, restart your backend:

```bash
cd backend
npm run start:dev
```

Then try registering a new user. You should receive a real email!

---

## Verification

### Check if SMTP is Configured

When the backend starts, check the logs:

**If SMTP is configured:**
```
✅ Email service initialized with SMTP
```

**If SMTP is NOT configured:**
```
⚠️ Email service is not fully configured. Emails will be logged to console.
```

### Test Registration

1. Go to `/register`
2. Create a new account
3. Check your email inbox (and spam folder)
4. You should receive a verification email

---

## Email Types Sent

The system sends these emails:

1. **Email Verification** - When user registers
   - Subject: "Verify Your Email - CSIS IAM"
   - Contains verification link

2. **Password Reset** - When user requests password reset
   - Subject: "Password Reset Request - CSIS IAM"
   - Contains reset link (expires in 1 hour)

3. **Welcome Email** - After email verification
   - Subject: "Welcome to CSIS IAM!"
   - Confirms account activation

---

## Troubleshooting

### Emails Not Sending

1. **Check SMTP credentials** - Verify all fields in `.env`
2. **Check firewall** - Port 587/465 must be open
3. **Check spam folder** - Emails might be filtered
4. **Check backend logs** - Look for error messages
5. **Test SMTP connection** - Use a tool like `telnet` or online SMTP tester

### Common Errors

**Error: "Invalid login"**
- Wrong username/password
- For Gmail: Make sure you're using App Password, not regular password

**Error: "Connection timeout"**
- Firewall blocking port 587/465
- Wrong SMTP host
- Network issues

**Error: "Authentication failed"**
- Wrong credentials
- Some providers require specific authentication method

---

## Development vs Production

### Development (Current)
- Emails logged to console
- No SMTP needed
- Good for testing locally

### Production
- Real emails sent via SMTP
- Requires SMTP configuration
- Use professional email service (SendGrid, Mailgun)

---

## Security Notes

1. **Never commit `.env` file** - Contains sensitive credentials
2. **Use App Passwords** - Don't use your main account password
3. **Restrict SMTP access** - Only allow from your server IP if possible
4. **Use environment variables** - Don't hardcode credentials

---

## Quick Setup Checklist

- [ ] Choose email provider (Gmail, SendGrid, etc.)
- [ ] Get SMTP credentials
- [ ] Add to `backend/.env` file
- [ ] Restart backend server
- [ ] Test registration to verify emails work
- [ ] Check spam folder if emails don't arrive

---

## Example Configurations

### Gmail
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=yourname@gmail.com
SMTP_PASS=your-16-char-app-password
SMTP_SECURE=false
SMTP_FROM=yourname@gmail.com
```

### SendGrid
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=SG.your-sendgrid-api-key
SMTP_SECURE=false
SMTP_FROM=noreply@csis.edu
```

### Mailgun
```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=postmaster@your-domain.mailgun.org
SMTP_PASS=your-mailgun-password
SMTP_SECURE=false
SMTP_FROM=noreply@csis.edu
```

---

*Once configured, your IAM system will send real emails for registration, password reset, and welcome messages!*

