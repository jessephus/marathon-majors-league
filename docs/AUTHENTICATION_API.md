# Authentication API Documentation

## Overview

This document provides complete API documentation for the Marathon Majors League authentication system. The system supports multiple authentication methods: TOTP (Google Authenticator), SMS OTP, Email OTP, and Magic Links.

## Table of Contents

- [Base URL](#base-url)
- [Authentication Methods](#authentication-methods)
- [API Endpoints](#api-endpoints)
  - [User Registration](#user-registration)
  - [User Login](#user-login)
  - [TOTP Management](#totp-management)
  - [OTP Management](#otp-management)
  - [Magic Links](#magic-links)
  - [Session Management](#session-management)
- [Error Codes](#error-codes)
- [Rate Limiting](#rate-limiting)
- [Security Considerations](#security-considerations)

---

## Base URL

**Production:** `https://your-domain.com/api/auth`  
**Development:** `http://localhost:3000/api/auth`

---

## Authentication Methods

The system supports four authentication methods:

### 1. TOTP (Time-Based One-Time Password)
- **Apps:** Google Authenticator, Authy, 1Password, etc.
- **Code:** 6-digit, changes every 30 seconds
- **Setup:** Scan QR code or enter secret manually
- **Recovery:** 10 backup codes provided during setup

### 2. SMS OTP
- **Delivery:** Via SMS to registered phone number
- **Code:** 6-digit numeric
- **Expiry:** 5 minutes
- **Requires:** Verified phone number

### 3. Email OTP
- **Delivery:** Via email to registered address
- **Code:** 6-digit numeric
- **Expiry:** 5 minutes
- **Requires:** Verified email address

### 4. Magic Links
- **Delivery:** Via email to registered address
- **Token:** 256-bit cryptographically secure
- **Expiry:** 15 minutes (login), 7 days (invites)
- **One-time use:** Token is invalidated after verification

---

## API Endpoints

### User Registration

Register a new user account with invite code.

**Endpoint:** `POST /api/auth/register`

**Request Body:**
```json
{
  "email": "user@example.com",
  "phoneNumber": "+1234567890",  // Optional
  "displayName": "John Doe",      // Optional
  "inviteCode": "INV-ABC12345"    // Required (preview phase)
}
```

**Response (201 Created):**
```json
{
  "message": "Account created successfully",
  "user": {
    "id": 123,
    "email": "user@example.com",
    "displayName": "John Doe",
    "emailVerified": false
  },
  "nextSteps": [
    "Check your email for verification link",
    "Set up TOTP authentication (recommended)",
    "Complete your profile"
  ]
}
```

**Error Responses:**
- `400` - Missing required field, invalid email/phone format
- `409` - User already exists
- `400` - Invalid or expired invite code

---

### User Login

Authenticate user with email and authentication method.

**Endpoint:** `POST /api/auth/login`

#### Step 1: Check Authentication Methods

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response (200 OK):**
```json
{
  "message": "User found. Please provide authentication method.",
  "userId": 123,
  "email": "user@example.com",
  "availableMethods": ["totp", "sms", "email", "magic_link"],
  "requiresMFA": true
}
```

#### Step 2: Login with TOTP

**Request:**
```json
{
  "email": "user@example.com",
  "method": "totp",
  "code": "123456"
}
```

**Response (200 OK):**
```json
{
  "message": "Login successful",
  "sessionToken": "abc123...",
  "user": {
    "id": 123,
    "email": "user@example.com",
    "displayName": "John Doe",
    "emailVerified": true,
    "phoneVerified": false,
    "totpEnabled": true,
    "isAdmin": false,
    "isStaff": false
  }
}
```

#### Step 3: Login with Backup Code

**Request:**
```json
{
  "email": "user@example.com",
  "backupCode": "A1B2C3D4"
}
```

**Response (200 OK):**
```json
{
  "message": "Login successful with backup code",
  "sessionToken": "abc123...",
  "warning": "You have 9 backup codes remaining. Consider regenerating them soon.",
  "user": { /* user object */ }
}
```

**Error Responses:**
- `400` - Invalid email format, missing required field
- `401` - Invalid credentials, invalid code
- `403` - Account disabled
- `404` - User not found

---

### TOTP Management

#### Setup TOTP

Generate TOTP secret and QR code for authenticator app.

**Endpoint:** `POST /api/auth/totp?action=setup`

**Request:**
```json
{
  "userId": 123
}
```

**Response (200 OK):**
```json
{
  "message": "TOTP setup initiated. Scan QR code with authenticator app.",
  "qrCode": "data:image/png;base64,...",
  "secret": "JBSWY3DPEHPK3PXP",
  "email": "user@example.com"
}
```

#### Verify TOTP Setup

Verify TOTP code and enable TOTP authentication.

**Endpoint:** `POST /api/auth/totp?action=verify-setup`

**Request:**
```json
{
  "userId": 123,
  "code": "123456"
}
```

**Response (200 OK):**
```json
{
  "message": "TOTP successfully enabled",
  "backupCodes": [
    "A1B2C3D4",
    "E5F6G7H8",
    "..."
  ],
  "warning": "Save these backup codes in a secure location. They will not be shown again."
}
```

#### Verify TOTP Code

Verify a TOTP code during login.

**Endpoint:** `POST /api/auth/totp?action=verify`

**Request:**
```json
{
  "userId": 123,
  "code": "123456"
}
```

**Response (200 OK):**
```json
{
  "message": "TOTP code verified successfully",
  "valid": true
}
```

#### Disable TOTP

Disable TOTP authentication for a user.

**Endpoint:** `POST /api/auth/totp?action=disable`

**Request:**
```json
{
  "userId": 123,
  "code": "123456"  // Optional: verify before disabling
}
```

**Response (200 OK):**
```json
{
  "message": "TOTP successfully disabled"
}
```

**Error Responses:**
- `400` - TOTP not setup, TOTP already enabled, invalid code
- `403` - Account disabled
- `404` - User not found

---

### OTP Management

#### Send OTP

Send a one-time password via SMS or email.

**Endpoint:** `POST /api/auth/otp?action=send`

**Request:**
```json
{
  "identifier": "user@example.com",  // Email, phone, or userId
  "method": "sms",                    // 'sms' or 'email'
  "purpose": "login"                  // Optional: 'login', 'verify_phone', etc.
}
```

**Response (200 OK):**
```json
{
  "message": "OTP sent successfully via sms",
  "success": true,
  "method": "sms"
}
```

**Development Mode Response:**
```json
{
  "message": "OTP sent successfully via email",
  "success": true,
  "method": "email",
  "otpCode": "123456"  // Only in development
}
```

#### Verify OTP

Verify a one-time password.

**Endpoint:** `POST /api/auth/otp?action=verify`

**Request:**
```json
{
  "identifier": "user@example.com",
  "code": "123456",
  "method": "email"
}
```

**Response (200 OK):**
```json
{
  "message": "OTP verified successfully",
  "valid": true,
  "userId": 123
}
```

**Error Responses:**
- `400` - Missing required field, invalid method, invalid identifier
- `400` - Invalid or expired OTP code
- `404` - User not found
- `500` - Failed to send OTP (email/SMS service error)

---

### Magic Links

#### Send Magic Link

Generate and send a magic link via email.

**Endpoint:** `POST /api/auth/magic-link?action=send`

**Request:**
```json
{
  "email": "user@example.com",
  "purpose": "login"  // 'login', 'verify_email', 'reset_totp', 'invite'
}
```

**Response (200 OK):**
```json
{
  "message": "Magic link sent successfully",
  "success": true
}
```

**Development Mode Response:**
```json
{
  "message": "Magic link sent successfully",
  "success": true,
  "token": "abc123..."  // Only in development
}
```

#### Verify Magic Link

Verify a magic link token and create session.

**Endpoint:** `GET /api/auth/magic-link?action=verify&token={token}`

Or:

**Endpoint:** `POST /api/auth/magic-link?action=verify`

**Request (POST):**
```json
{
  "token": "abc123..."
}
```

**Response (200 OK):**
```json
{
  "message": "Magic link verified successfully",
  "valid": true,
  "userId": 123,
  "purpose": "login",
  "sessionToken": "def456..."  // Only for 'login' purpose
}
```

**Error Responses:**
- `400` - Missing token, invalid email format
- `400` - Invalid or expired magic link
- `403` - Account disabled
- `500` - Failed to send email

---

### Session Management

#### Get Session

Verify and retrieve current session information.

**Endpoint:** `GET /api/auth/session`

**Headers:**
```
Authorization: Bearer {sessionToken}
```

Or use query parameter:
```
GET /api/auth/session?token={sessionToken}
```

**Response (200 OK):**
```json
{
  "valid": true,
  "session": {
    "userId": 123,
    "createdAt": "2025-10-22T10:00:00.000Z",
    "expiresAt": "2025-11-21T10:00:00.000Z"
  },
  "user": {
    "id": 123,
    "email": "user@example.com",
    "displayName": "John Doe",
    "emailVerified": true,
    "phoneVerified": false,
    "totpEnabled": true,
    "isAdmin": false,
    "isStaff": false
  }
}
```

#### Delete Session (Logout)

Logout and revoke session.

**Endpoint:** `DELETE /api/auth/session`

**Headers:**
```
Authorization: Bearer {sessionToken}
```

Or:

**Request Body:**
```json
{
  "token": "abc123...",
  "allDevices": false  // Optional: logout from all devices
}
```

**Response (200 OK):**
```json
{
  "message": "Logged out successfully"
}
```

**Logout from All Devices:**
```json
{
  "token": "abc123...",
  "allDevices": true
}
```

**Response:**
```json
{
  "message": "Logged out from all devices successfully"
}
```

**Error Responses:**
- `401` - No session token provided, expired session
- `403` - Account disabled
- `404` - User not found

---

## Error Codes

All error responses follow this format:

```json
{
  "error": "Error message",
  "message": "Additional details (optional)",
  "details": "Stack trace or specific error (development only)"
}
```

### Common Error Codes

| HTTP Code | Error | Description |
|-----------|-------|-------------|
| 400 | MISSING_REQUIRED_FIELD | Required field is missing |
| 400 | INVALID_EMAIL_FORMAT | Email address format is invalid |
| 400 | INVALID_PHONE_FORMAT | Phone number format is invalid (use E.164) |
| 400 | INVALID_TOKEN | Invalid or expired token |
| 400 | INVALID_OTP | Invalid or expired OTP code |
| 400 | INVALID_TOTP | Invalid TOTP code |
| 400 | INVALID_BACKUP_CODE | Invalid backup code |
| 400 | TOTP_NOT_SETUP | TOTP not set up for this account |
| 400 | TOTP_ALREADY_SETUP | TOTP already set up for this account |
| 400 | INVITE_CODE_INVALID | Invalid or expired invite code |
| 400 | INVITE_CODE_USED | Invite code has already been used |
| 401 | INVALID_CREDENTIALS | Invalid email or password |
| 401 | EXPIRED_TOKEN | Token has expired |
| 401 | EXPIRED_OTP | OTP has expired |
| 401 | EXPIRED_SESSION | Session has expired |
| 403 | ACCOUNT_DISABLED | Account has been disabled |
| 403 | EMAIL_NOT_VERIFIED | Email address not verified |
| 403 | PHONE_NOT_VERIFIED | Phone number not verified |
| 404 | User not found | User account does not exist |
| 409 | USER_ALREADY_EXISTS | An account with this email already exists |
| 429 | RATE_LIMIT_EXCEEDED | Too many attempts. Please try again later |
| 500 | Internal server error | Server-side error occurred |
| 503 | SERVICE_UNAVAILABLE | Authentication service temporarily unavailable |

---

## Rate Limiting

The API implements rate limiting to prevent abuse:

### OTP Requests
- **Limit:** 5 OTP requests per hour per user
- **Window:** 60 minutes
- **Response:** 429 Too Many Requests

### Login Attempts
- **Limit:** 10 failed login attempts per hour per email
- **Window:** 60 minutes
- **Response:** 429 Too Many Requests

### Magic Link Requests
- **Limit:** 3 magic link requests per 15 minutes per email
- **Window:** 15 minutes
- **Response:** 429 Too Many Requests

When rate limited, the response includes a `Retry-After` header indicating when to retry.

---

## Security Considerations

### HTTPS Required
All API requests must be made over HTTPS. HTTP requests will be rejected.

### CORS
The API allows cross-origin requests from configured domains. Default: `*` (all origins).

### Token Security
- **Session tokens:** 256-bit cryptographically secure random
- **Magic link tokens:** 256-bit cryptographically secure random
- **OTP codes:** 6-digit random numeric
- **TOTP secrets:** Base32 encoded, encrypted at rest (AES-256-GCM)

### Password-less Authentication
The system does NOT use passwords. All authentication is via:
- TOTP codes (something you have)
- OTP codes (sent to verified email/phone)
- Magic links (sent to verified email)
- Backup codes (generated during TOTP setup)

### Account Recovery
If a user loses access to all authentication methods:
1. Use backup codes (if TOTP was enabled)
2. Request magic link to verified email
3. Contact administrator for manual recovery

### Best Practices

**For Developers:**
- Always use HTTPS in production
- Store session tokens securely (httpOnly cookies recommended)
- Implement CSRF protection for session-based auth
- Never log or expose sensitive tokens
- Rotate SESSION_SECRET and TOTP_ENCRYPTION_KEY regularly

**For Users:**
- Enable TOTP for strongest security
- Save backup codes in a secure location
- Keep email and phone number up to date
- Use unique email addresses for each service
- Report suspicious activity immediately

---

## Example Flows

### Complete Registration Flow

1. **Register account:**
   ```bash
   POST /api/auth/register
   {
     "email": "user@example.com",
     "displayName": "John Doe",
     "inviteCode": "INV-ABC123"
   }
   ```

2. **Verify email:**
   - Check email for verification link
   - Click link or:
   ```bash
   GET /api/auth/magic-link?action=verify&token={token}
   ```

3. **Setup TOTP:**
   ```bash
   POST /api/auth/totp?action=setup
   { "userId": 123 }
   ```
   - Scan QR code with authenticator app

4. **Verify TOTP setup:**
   ```bash
   POST /api/auth/totp?action=verify-setup
   {
     "userId": 123,
     "code": "123456"
   }
   ```
   - Save backup codes securely

### Complete Login Flow (TOTP)

1. **Check auth methods:**
   ```bash
   POST /api/auth/login
   { "email": "user@example.com" }
   ```

2. **Login with TOTP:**
   ```bash
   POST /api/auth/login
   {
     "email": "user@example.com",
     "method": "totp",
     "code": "123456"
   }
   ```

3. **Use session token:**
   ```bash
   GET /api/auth/session
   Authorization: Bearer {sessionToken}
   ```

### Complete Login Flow (Magic Link)

1. **Request magic link:**
   ```bash
   POST /api/auth/magic-link?action=send
   {
     "email": "user@example.com",
     "purpose": "login"
   }
   ```

2. **Verify magic link:**
   - User clicks link in email
   - Token verified automatically
   - Session created

### Complete Login Flow (SMS OTP)

1. **Request OTP:**
   ```bash
   POST /api/auth/otp?action=send
   {
     "identifier": "+1234567890",
     "method": "sms",
     "purpose": "login"
   }
   ```

2. **Verify OTP:**
   ```bash
   POST /api/auth/otp?action=verify
   {
     "identifier": "+1234567890",
     "code": "123456",
     "method": "sms"
   }
   ```

3. **Complete login:**
   ```bash
   POST /api/auth/login
   {
     "email": "user@example.com",
     "method": "sms",
     "code": "123456"
   }
   ```

---

## Testing

### Development Mode Features

When `NODE_ENV=development`:
- OTP codes are returned in API responses
- Magic link tokens are returned in API responses
- More detailed error messages
- Stack traces included in errors

### Example Test Requests

Use curl or Postman to test the API:

```bash
# Register new user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "displayName": "Test User",
    "inviteCode": "INV-TEST123"
  }'

# Setup TOTP
curl -X POST "http://localhost:3000/api/auth/totp?action=setup" \
  -H "Content-Type: application/json" \
  -d '{"userId": 1}'

# Send OTP via email
curl -X POST "http://localhost:3000/api/auth/otp?action=send" \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "test@example.com",
    "method": "email"
  }'

# Verify session
curl -X GET http://localhost:3000/api/auth/session \
  -H "Authorization: Bearer your-session-token"
```

---

## Support

For issues or questions:
- Review this documentation
- Check `docs/AUTHENTICATION_SETUP.md` for setup instructions
- See error codes section for specific errors
- Create GitHub issue with:
  - Request/response examples
  - Error messages
  - Steps to reproduce
  - Environment details

---

## Changelog

### Version 2.0 (2025-10-22)
- Initial authentication system implementation
- TOTP, OTP, and Magic Link support
- Multi-factor authentication
- Invite code system
- Session management
- Comprehensive error handling
