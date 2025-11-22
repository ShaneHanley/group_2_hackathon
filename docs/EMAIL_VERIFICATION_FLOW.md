# Email Verification Flow

## Yes, Email Verification is Required! ✅

When a user registers, **they MUST verify their email before they can login**. Here's how it works:

---

## Current Registration Flow

### Step 1: User Registers
- User fills out registration form at `/register`
- User is created with status: **`PENDING`**
- Email verification token is generated
- Verification email is sent (or logged to console if SMTP not configured)

### Step 2: User Receives Email
- Email contains link: `http://localhost:5173/verify-email?token=abc123...`
- Link expires in **7 days**
- Email subject: "Verify Your Email - CSIS IAM"

### Step 3: User Clicks Link
- Frontend page `/verify-email` loads
- Backend endpoint `GET /auth/verify-email/:token` is called
- If token is valid:
  - User status changes: `PENDING` → **`ACTIVE`**
  - Welcome email is sent
  - User can now login

### Step 4: User Can Login
- Only users with status `ACTIVE` can login
- If status is `PENDING`, login is rejected with: "Account is not active"

---

## What Happens If User Tries to Login Before Verification?

**Login will be REJECTED** ❌

```
POST /auth/login
Response: 401 Unauthorized
{
  "message": "Account is not active"
}
```

The user **must** verify their email first.

---

## Email Verification States

| Status | Can Login? | Description |
|--------|-----------|-------------|
| `PENDING` | ❌ No | User registered but email not verified |
| `ACTIVE` | ✅ Yes | Email verified, account active |
| `SUSPENDED` | ❌ No | Account suspended by admin |
| `DEACTIVATED` | ❌ No | Account deactivated |

---

## Verification Link Details

- **URL Format:** `/verify-email?token=<32-character-hex-token>`
- **Expiration:** 7 days from registration
- **One-time use:** Token can only be used once
- **Auto-cleanup:** Old tokens are deleted after verification

---

## What If User Doesn't Receive Email?

### Option 1: Resend Verification Email
- Endpoint: `POST /auth/resend-verification`
- Body: `{ "email": "user@csis.edu" }`
- Rate limited: 3 requests per hour
- Sends new verification email

### Option 2: Admin Activation
- Admin can manually activate user in admin dashboard
- Changes status from `PENDING` to `ACTIVE`
- User can then login without email verification

---

## Frontend Pages

1. **`/register`** - User registration form
2. **`/verify-email`** - Email verification page (handles token)
3. **`/login`** - Login page (only works for ACTIVE users)

---

## Backend Endpoints

1. **`POST /auth/register`** - Create user (status: PENDING)
2. **`GET /auth/verify-email/:token`** - Verify email token
3. **`POST /auth/resend-verification`** - Resend verification email
4. **`POST /auth/login`** - Login (requires ACTIVE status)

---

## Example Flow

```
1. User registers
   ↓
2. User receives email (or sees token in console logs)
   ↓
3. User clicks verification link
   ↓
4. Frontend calls: GET /auth/verify-email/:token
   ↓
5. Backend verifies token and activates account
   ↓
6. User can now login
```

---

## Development Mode (No SMTP)

If SMTP is not configured:
- Email is **logged to console** instead of sent
- Check backend logs for the verification link
- Copy the link and open in browser manually
- Or use the token from logs: `/verify-email?token=<token-from-logs>`

**Example Console Output:**
```
📧 Email (Development Mode):
To: user@csis.edu
From: noreply@csis.edu
Subject: Verify Your Email - CSIS IAM

Verify Your Email
Please verify your email by clicking this link: 
http://localhost:5173/verify-email?token=abc123...
```

---

## Production Mode (SMTP Configured)

If SMTP is configured:
- Real email is sent to user's inbox
- User receives email with verification link
- User clicks link to verify
- Account is activated automatically

---

## Security Features

1. **Token Expiration** - Links expire after 7 days
2. **One-time Use** - Tokens can only be used once
3. **Rate Limiting** - Resend limited to 3 per hour
4. **Token Cleanup** - Old tokens are automatically deleted
5. **Status Check** - Login requires ACTIVE status

---

## Summary

✅ **Yes, email verification is required**
- Users start as `PENDING`
- Must verify email to become `ACTIVE`
- Cannot login until verified
- Verification link expires in 7 days
- Can resend verification email if needed

---

*This ensures only users with valid email addresses can access the system.*

