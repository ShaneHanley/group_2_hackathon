# CSIS IAM System - Process Outline

## Table of Contents
1. [System Architecture Overview](#system-architecture-overview)
2. [User Registration Flow](#user-registration-flow)
3. [Authentication Flow](#authentication-flow)
4. [Authorization Flow (RBAC)](#authorization-flow-rbac)
5. [OAuth2/OIDC Integration Flow](#oauth2oidc-integration-flow)
6. [User Lifecycle Management](#user-lifecycle-management)
7. [Security Mechanisms](#security-mechanisms)
8. [Integration Patterns](#integration-patterns)

---

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    CSIS IAM System                           │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │   Frontend   │    │   Backend    │    │  PostgreSQL  │  │
│  │  (React UI)  │◄──►│  (NestJS)    │◄──►│  (Database)  │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│         │                   │                    │            │
│         │                   │                    │            │
│         └───────────────────┴────────────────────┘            │
│                          │                                    │
│         ┌────────────────┴────────────────┐                 │
│         │                                  │                 │
│    ┌────▼────┐                      ┌─────▼─────┐           │
│    │  Redis  │                      │   Email   │           │
│    │ (Cache) │                      │  Service  │           │
│    └─────────┘                      └───────────┘           │
│                                                               │
└─────────────────────────────────────────────────────────────┘
         │
         │ OAuth2/OIDC APIs
         │
┌────────▼────────────────────────────────────────────┐
│         External CSIS Systems                       │
│  (Equipment Booking, FYP Portal, CMS, etc.)        │
└─────────────────────────────────────────────────────┘
```

### Core Components

1. **Backend API (NestJS)**
   - Authentication Service
   - User Management Service
   - Role Management Service
   - OAuth2/OIDC Service
   - Audit Service
   - Email Service

2. **Database (PostgreSQL)**
   - Users table
   - Roles table
   - User-Roles junction table
   - Audit logs
   - Token blacklist
   - Email verification tokens
   - Password reset tokens

3. **Frontend (React)**
   - Admin Dashboard
   - User Management UI
   - Role Management UI
   - Audit Log Viewer

---

## User Registration Flow

```
┌──────────┐
│   User   │
└────┬─────┘
     │
     │ 1. POST /auth/register
     │    { email, password, displayName, department }
     │
     ▼
┌─────────────────────────────────┐
│   Auth Service                  │
│   - Validate input              │
│   - Check password strength     │
│   - Check email uniqueness      │
└────┬────────────────────────────┘
     │
     │ 2. Hash password (bcrypt)
     │
     ▼
┌─────────────────────────────────┐
│   Database                      │
│   - Create user (status: PENDING)
│   - Generate verification token │
└────┬────────────────────────────┘
     │
     │ 3. Send verification email
     │
     ▼
┌─────────────────────────────────┐
│   Email Service                 │
│   - Send verification link       │
│   - Token expires in 7 days    │
└────┬────────────────────────────┘
     │
     │ 4. User clicks link
     │
     ▼
┌─────────────────────────────────┐
│   GET /auth/verify-email/:token │
│   - Validate token              │
│   - Update status: ACTIVE       │
│   - Send welcome email          │
└─────────────────────────────────┘
```

### Steps:
1. **User submits registration form** → Frontend validates client-side
2. **Backend validates** → Password strength, email format, uniqueness
3. **Password hashing** → bcrypt (10 rounds)
4. **User creation** → Status set to `PENDING`
5. **Verification token** → Generated (32-byte hex), expires in 7 days
6. **Email sent** → Verification link via SMTP (or console in dev)
7. **User verifies email** → Status changes to `ACTIVE`
8. **Welcome email** → Sent automatically
9. **Audit log** → `user_created` event recorded

---

## Authentication Flow

### Standard Login Flow

```
┌──────────┐
│   User   │
└────┬─────┘
     │
     │ 1. POST /auth/login
     │    { email, password }
     │
     ▼
┌─────────────────────────────────┐
│   Auth Service                  │
│   - Check account lockout       │
│   - Verify user exists          │
│   - Check user status (ACTIVE)  │
└────┬────────────────────────────┘
     │
     │ 2. Verify password
     │
     ▼
┌─────────────────────────────────┐
│   Password Verification         │
│   - bcrypt.compare()            │
│   - Track failed attempts      │
└────┬────────────────────────────┘
     │
     │ 3. Fetch user roles
     │
     ▼
┌─────────────────────────────────┐
│   Database                      │
│   - Get user with roles         │
│   - Clear failed attempts      │
└────┬────────────────────────────┘
     │
     │ 4. Generate JWT tokens
     │
     ▼
┌─────────────────────────────────┐
│   JWT Service                   │
│   - Access token (15 min)       │
│   - Refresh token (7 days)     │
│   - Include roles in payload   │
└────┬────────────────────────────┘
     │
     │ 5. Return tokens
     │
     ▼
┌─────────────────────────────────┐
│   Response                      │
│   { accessToken, refreshToken,  │
│     user: { id, email, roles } }│
└─────────────────────────────────┘
```

### Account Lockout Mechanism

```
Failed Login Attempt
     │
     ▼
┌─────────────────────────────────┐
│   Track Attempt                 │
│   - Increment counter           │
│   - Store IP address            │
└────┬────────────────────────────┘
     │
     │ If attempts >= 5
     │
     ▼
┌─────────────────────────────────┐
│   Lock Account                  │
│   - Set lockedUntil (15 min)   │
│   - Log audit event             │
└─────────────────────────────────┘
```

### Token Refresh Flow

```
┌──────────┐
│  Client  │
└────┬─────┘
     │
     │ 1. POST /auth/refresh
     │    { refreshToken }
     │
     ▼
┌─────────────────────────────────┐
│   Auth Service                  │
│   - Validate refresh token      │
│   - Check blacklist             │
│   - Verify expiration           │
└────┬────────────────────────────┘
     │
     │ 2. Fetch fresh user data
     │
     ▼
┌─────────────────────────────────┐
│   Database                      │
│   - Get user with latest roles  │
└────┬────────────────────────────┘
     │
     │ 3. Generate new tokens
     │
     ▼
┌─────────────────────────────────┐
│   Token Blacklist               │
│   - Blacklist old refresh token │
└────┬────────────────────────────┘
     │
     │ 4. Return new tokens
     │
     ▼
┌─────────────────────────────────┐
│   Response                      │
│   { accessToken, refreshToken } │
└─────────────────────────────────┘
```

### Logout Flow

```
┌──────────┐
│  Client  │
└────┬─────┘
     │
     │ 1. POST /auth/logout
     │    { refreshToken }
     │    Header: Bearer <accessToken>
     │
     ▼
┌─────────────────────────────────┐
│   Auth Service                  │
│   - Validate access token       │
│   - Blacklist access token      │
│   - Blacklist refresh token     │
└────┬────────────────────────────┘
     │
     │ 2. Store in blacklist
     │
     ▼
┌─────────────────────────────────┐
│   Token Blacklist Table         │
│   - Access token (expires 15m) │
│   - Refresh token (expires 7d) │
└─────────────────────────────────┘
```

---

## Authorization Flow (RBAC)

### Role-Based Access Control Process

```
┌─────────────────────────────────────────────────────────┐
│              Request with JWT Token                      │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│   JwtAuthGuard                                          │
│   - Extract token from Authorization header             │
│   - Verify token signature (RSA public key)             │
│   - Check token expiration                              │
│   - Check token blacklist                               │
│   - Fetch fresh user roles from database                │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ Token valid
                     ▼
┌─────────────────────────────────────────────────────────┐
│   Attach User to Request                                │
│   request.user = {                                      │
│     id, email, displayName,                            │
│     csis_roles: ['admin', 'staff'],                     │
│     department                                          │
│   }                                                     │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│   RolesGuard (if @Roles() decorator present)            │
│   - Read required roles from decorator                   │
│   - Compare with user.csis_roles                        │
│   - Allow if user has ANY required role                  │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ Authorized
                     ▼
┌─────────────────────────────────────────────────────────┐
│   Controller Method                                      │
│   - Execute business logic                               │
│   - Return response                                      │
└─────────────────────────────────────────────────────────┘
```

### Role Assignment Flow

```
┌──────────┐
│  Admin   │
└────┬─────┘
     │
     │ 1. POST /admin/users/:userId/roles/:roleId
     │
     ▼
┌─────────────────────────────────┐
│   Admin Service                  │
│   - Verify admin role            │
│   - Check role exists            │
└────┬────────────────────────────┘
     │
     │ 2. Create user_role record
     │
     ▼
┌─────────────────────────────────┐
│   Database                      │
│   - Insert into user_roles      │
│   - Record granted_by, granted_at│
└────┬────────────────────────────┘
     │
     │ 3. Log audit event
     │
     ▼
┌─────────────────────────────────┐
│   Audit Service                 │
│   - Log role_assigned           │
│   - Include IP address          │
└─────────────────────────────────┘
```

### Permission Check Example

```typescript
// Endpoint protected by role
@Post('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
createUser(@Body() dto: CreateUserDto) {
  // Only users with 'admin' role can access
}

// Permission-based check (in service)
if (!user.permissions.includes('manage_users')) {
  throw new ForbiddenException();
}
```

---

## OAuth2/OIDC Integration Flow

### OAuth2 Token Endpoint Flow

```
┌──────────────────┐
│  External System │
└────────┬─────────┘
         │
         │ 1. POST /oauth/token
         │    grant_type: password
         │    username: user@csis.edu
         │    password: ****
         │
         ▼
┌─────────────────────────────────┐
│   OAuth Service                 │
│   - Validate grant type          │
│   - Authenticate user            │
│   - Verify account status        │
└────┬────────────────────────────┘
     │
     │ 2. Generate tokens
     │
     ▼
┌─────────────────────────────────┐
│   JWT Key Service               │
│   - Sign with RSA private key   │
│   - Include roles in claims     │
└────┬────────────────────────────┘
     │
     │ 3. Return OAuth2 response
     │
     ▼
┌─────────────────────────────────┐
│   Response                      │
│   {                             │
│     access_token: "...",        │
│     refresh_token: "...",       │
│     token_type: "Bearer",       │
│     expires_in: 900             │
│   }                             │
└─────────────────────────────────┘
```

### OpenID Connect UserInfo Flow

```
┌──────────────────┐
│  External System │
└────────┬─────────┘
         │
         │ 1. GET /oauth/userinfo
         │    Header: Bearer <access_token>
         │
         ▼
┌─────────────────────────────────┐
│   JwtAuthGuard                  │
│   - Validate token              │
│   - Extract user from token     │
└────┬────────────────────────────┘
     │
     │ 2. Return OIDC claims
     │
     ▼
┌─────────────────────────────────┐
│   Response (OIDC Standard)      │
│   {                             │
│     sub: "user-id",             │
│     email: "user@csis.edu",     │
│     email_verified: true,        │
│     name: "Display Name",       │
│     preferred_username: "...",  │
│     csis_roles: ["admin"],      │
│     department: "CS"            │
│   }                             │
└─────────────────────────────────┘
```

### JWKS Discovery Flow

```
┌──────────────────┐
│  External System │
└────────┬─────────┘
         │
         │ 1. GET /.well-known/jwks.json
         │
         ▼
┌─────────────────────────────────┐
│   OAuth Service                 │
│   - Get RSA public key          │
│   - Format as JWKS              │
└────┬────────────────────────────┘
     │
     │ 2. Return public key
     │
     ▼
┌─────────────────────────────────┐
│   Response (JWKS Format)        │
│   {                             │
│     keys: [{                    │
│       kty: "RSA",               │
│       use: "sig",               │
│       kid: "...",               │
│       n: "...",                 │
│       e: "AQAB"                 │
│     }]                          │
│   }                             │
└─────────────────────────────────┘
```

### Token Introspection Flow

```
┌──────────────────┐
│  External System │
└────────┬─────────┘
         │
         │ 1. POST /oauth/introspect
         │    { token: "..." }
         │
         ▼
┌─────────────────────────────────┐
│   OAuth Service                 │
│   - Decode token                │
│   - Check expiration            │
│   - Check blacklist             │
│   - Verify signature            │
└────┬────────────────────────────┘
     │
     │ 2. Return introspection
     │
     ▼
┌─────────────────────────────────┐
│   Response (RFC 7662)           │
│   {                             │
│     active: true,               │
│     sub: "user-id",             │
│     exp: 1234567890,             │
│     csis_roles: ["admin"]       │
│   }                             │
└─────────────────────────────────┘
```

---

## User Lifecycle Management

### User Status Transitions

```
┌──────────┐
│  PENDING │  ← New registration
└────┬─────┘
     │
     │ Email verification
     │
     ▼
┌──────────┐
│  ACTIVE  │  ← Normal operation
└────┬─────┘
     │
     │ Admin action
     │
     ├──────────┐
     │          │
     ▼          ▼
┌──────────┐  ┌──────────────┐
│SUSPENDED │  │ DEACTIVATED  │
└────┬─────┘  └──────────────┘
     │
     │ Admin reactivation
     │
     ▼
┌──────────┐
│  ACTIVE  │
└──────────┘
```

### User Deletion Flow

```
┌──────────┐
│  Admin   │
└────┬─────┘
     │
     │ 1. DELETE /users/:id
     │
     ▼
┌─────────────────────────────────┐
│   Users Service                │
│   - Verify user exists          │
│   - Check admin permissions     │
└────┬────────────────────────────┘
     │
     │ 2. Cascade delete
     │
     ▼
┌─────────────────────────────────┐
│   Delete Related Records       │
│   1. user_roles                │
│   2. email_verification_tokens │
│   3. password_reset_tokens     │
│   4. user record               │
└────┬────────────────────────────┘
     │
     │ 3. Audit log
     │
     ▼
┌─────────────────────────────────┐
│   Audit Service                 │
│   - Log user_deleted            │
└─────────────────────────────────┘
```

---

## Security Mechanisms

### Password Security

```
User Input Password
     │
     ▼
┌─────────────────────────────────┐
│   Password Strength Validation │
│   - Min 8 characters            │
│   - Uppercase letter            │
│   - Lowercase letter            │
│   - Number                      │
│   - Special character           │
└────┬────────────────────────────┘
     │
     │ Valid
     ▼
┌─────────────────────────────────┐
│   bcrypt Hashing               │
│   - 10 rounds                  │
│   - Unique salt per password   │
└────┬────────────────────────────┘
     │
     ▼
┌─────────────────────────────────┐
│   Database Storage              │
│   - Store hash only             │
│   - Never store plaintext       │
└─────────────────────────────────┘
```

### Token Security

```
Token Generation
     │
     ▼
┌─────────────────────────────────┐
│   RSA Keypair                  │
│   - Private key: Sign tokens   │
│   - Public key: Verify tokens  │
│   - Exposed via JWKS           │
└────┬────────────────────────────┘
     │
     ▼
┌─────────────────────────────────┐
│   JWT Claims                   │
│   - sub: user ID               │
│   - email: user email          │
│   - csis_roles: user roles     │
│   - exp: expiration            │
│   - iat: issued at             │
└─────────────────────────────────┘
```

### Rate Limiting

```
Request
     │
     ▼
┌─────────────────────────────────┐
│   ThrottlerGuard               │
│   - Check request count         │
│   - Check time window           │
│   - Track by IP/user            │
└────┬────────────────────────────┘
     │
     │ If limit exceeded
     ▼
┌─────────────────────────────────┐
│   ThrottlerException            │
│   - Return 429 Too Many Requests│
│   - Include retry-after        │
└─────────────────────────────────┘
```

### Security Headers (Helmet.js)

```
Request
     │
     ▼
┌─────────────────────────────────┐
│   Helmet Middleware             │
│   - XSS Protection             │
│   - Clickjacking Protection    │
│   - Content Security Policy     │
│   - HSTS                       │
└─────────────────────────────────┘
```

---

## Integration Patterns

### How External Systems Integrate

```
┌─────────────────────────────────────┐
│   External CSIS System              │
│   (Equipment Booking, FYP Portal)   │
└──────────────┬──────────────────────┘
               │
               │ 1. Discovery
               │ GET /.well-known/openid-configuration
               │
               ▼
┌─────────────────────────────────────┐
│   Get Configuration                 │
│   - token_endpoint                  │
│   - userinfo_endpoint               │
│   - jwks_uri                        │
└──────────────┬──────────────────────┘
               │
               │ 2. Get Public Key
               │ GET /.well-known/jwks.json
               │
               ▼
┌─────────────────────────────────────┐
│   Store Public Key                  │
│   - For token verification          │
└──────────────┬──────────────────────┘
               │
               │ 3. User Login
               │ POST /oauth/token
               │ grant_type: password
               │
               ▼
┌─────────────────────────────────────┐
│   Receive Tokens                    │
│   - access_token                    │
│   - refresh_token                   │
└──────────────┬──────────────────────┘
               │
               │ 4. Validate Token
               │ POST /oauth/introspect
               │
               ▼
┌─────────────────────────────────────┐
│   Get User Info                     │
│   GET /oauth/userinfo               │
│   Header: Bearer <access_token>     │
└──────────────┬──────────────────────┘
               │
               │ 5. Use Roles/Permissions
               │
               ▼
┌─────────────────────────────────────┐
│   Authorize Actions                 │
│   - Check csis_roles               │
│   - Enforce permissions            │
└─────────────────────────────────────┘
```

### SDK Integration Pattern

```javascript
// External system uses SDK
const iamSDK = require('@csis/iam-sdk');

// Initialize
const client = iamSDK.init({
  baseUrl: 'http://iam.csis.edu',
  jwksUri: '/.well-known/jwks.json'
});

// Verify token middleware
app.use(client.verifyJWT());

// Check role
app.get('/admin', client.requireRole('admin'), (req, res) => {
  // User has admin role
});
```

---

## Data Flow Summary

### Request Flow

```
1. Client Request
   ↓
2. CORS Check
   ↓
3. Rate Limiting
   ↓
4. Helmet Security Headers
   ↓
5. Validation Pipe
   ↓
6. JWT Auth Guard (if protected)
   ↓
7. Roles Guard (if role required)
   ↓
8. Controller Method
   ↓
9. Service Layer
   ↓
10. Database Query
   ↓
11. Audit Logging
   ↓
12. Response
```

### Token Validation Flow

```
1. Extract Token from Header
   ↓
2. Decode JWT
   ↓
3. Verify Signature (RSA public key)
   ↓
4. Check Expiration
   ↓
5. Check Blacklist
   ↓
6. Fetch Fresh User Roles
   ↓
7. Attach User to Request
```

---

## Key Design Decisions

1. **Custom IAM Implementation** - No external dependencies (Keycloak removed)
2. **Database-First Roles** - Roles fetched fresh on each request (no stale tokens)
3. **Token Blacklist** - Database-based (can migrate to Redis)
4. **RSA Keypairs** - For JWT signing (RS256)
5. **Cascade Deletes** - Manual cleanup to avoid FK violations
6. **Audit Everything** - All actions logged for compliance

---

*This outline represents the current implementation of the CSIS IAM system.*

