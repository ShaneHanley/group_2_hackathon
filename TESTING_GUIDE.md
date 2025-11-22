# CSIS IAM Testing Guide

Complete guide for testing your IAM project - from manual testing to automated tests.

## 📋 Table of Contents

1. [Quick Start Testing](#quick-start-testing)
2. [Manual API Testing](#manual-api-testing)
3. [Automated Testing](#automated-testing)
4. [OAuth2/OIDC Testing](#oauth2oidc-testing)
5. [Frontend Testing](#frontend-testing)
6. [Security Testing](#security-testing)
7. [Integration Testing](#integration-testing)

---

## 🚀 Quick Start Testing

### Prerequisites

1. **Start all services:**
   ```bash
   # Start database
   docker compose up -d
   
   # Start backend (Terminal 1)
   cd backend
   npm run start:dev
   
   # Start frontend (Terminal 2)
   cd frontend
   npm run dev
   ```

2. **Verify services are running:**
   - Backend API: http://localhost:3000
   - Swagger UI: http://localhost:3000/api
   - Admin UI: http://localhost:5173
   - Health Check: http://localhost:3000/api/v1/health

### Quick Health Check

```bash
# Check if API is running
curl http://localhost:3000/api/v1/health

# Check database connectivity
curl http://localhost:3000/api/v1/health/ready
```

---

## 🔧 Manual API Testing

### Option 1: Swagger UI (Recommended)

1. **Open Swagger UI:**
   - Navigate to: http://localhost:3000/api
   - Interactive API documentation with "Try it out" buttons

2. **Test Authentication:**
   - Click on `POST /api/v1/auth/login`
   - Click "Try it out"
   - Enter credentials:
     ```json
     {
       "email": "shane@csis.edu",
       "password": "Admin_123!"
     }
     ```
   - Click "Execute"
   - Copy the `accessToken` from response

3. **Authorize in Swagger:**
   - Click the "Authorize" button (top right)
   - Paste your `accessToken`
   - Click "Authorize"
   - Now all protected endpoints will use this token

4. **Test Protected Endpoints:**
   - Try `GET /api/v1/users` - Should return user list
   - Try `GET /api/v1/roles` - Should return roles
   - Try `GET /api/v1/admin/users` - Should return all users (admin only)

### Option 2: cURL Commands

#### 1. Register a New User
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@csis.edu",
    "password": "NewP@ssw0rd!",
    "displayName": "New User",
    "department": "CS"
  }'
```

#### 2. Login
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "shane@csis.edu",
    "password": "Admin_123!"
  }'
```

**Save the `accessToken` from response for next commands.**

#### 3. Get User Info
```bash
curl -X GET http://localhost:3000/api/v1/auth/userinfo \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### 4. Get All Users (Admin Only)
```bash
curl -X GET http://localhost:3000/api/v1/admin/users \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### 5. Get All Roles
```bash
curl -X GET http://localhost:3000/api/v1/roles \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### 6. Create a Role (Admin Only)
```bash
curl -X POST http://localhost:3000/api/v1/roles \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "lab_manager",
    "permissions": ["manage_equipment", "view_bookings"]
  }'
```

#### 7. Assign Role to User (Admin Only)
```bash
curl -X POST http://localhost:3000/api/v1/roles/users/USER_ID/assign \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "roleId": "ROLE_ID"
  }'
```

#### 8. Refresh Token
```bash
curl -X POST http://localhost:3000/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }'
```

#### 9. Logout
```bash
curl -X POST http://localhost:3000/api/v1/auth/logout \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }'
```

---

## 🧪 Automated Testing

### Unit Tests

```bash
cd backend
npm run test:unit
```

Tests individual services and functions.

### E2E Tests

```bash
cd backend
npm run test:e2e
```

Tests complete API endpoints with database.

**Note:** E2E tests require:
- Database running (Docker)
- Test database configured
- May create/delete test data

### Run All Tests

```bash
cd backend
npm run test:all
```

### Test Coverage

```bash
cd backend
npm run test:cov
```

Generates coverage report in `coverage/` directory.

### Watch Mode (Development)

```bash
cd backend
npm run test:watch
```

Reruns tests on file changes.

---

## 🔐 OAuth2/OIDC Testing

### Automated OAuth Test Script

```bash
cd backend
node test-oauth.js
```

This script tests:
- ✅ Token issuance (password grant)
- ✅ UserInfo endpoint
- ✅ Token introspection
- ✅ OIDC discovery
- ✅ JWKS endpoint

### Manual OAuth Testing

See `backend/test-oauth-endpoints.md` for detailed curl commands.

#### 1. Get OAuth Token
```bash
curl -X POST http://localhost:3000/api/v1/oauth/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password&username=test@csis.edu&password=Test123!&scope=openid profile email"
```

#### 2. Get UserInfo
```bash
curl -X GET http://localhost:3000/api/v1/oauth/userinfo \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### 3. Introspect Token
```bash
curl -X POST http://localhost:3000/api/v1/oauth/introspect \
  -H "Content-Type: application/json" \
  -d '{"token": "YOUR_ACCESS_TOKEN"}'
```

#### 4. Get OIDC Discovery
```bash
curl http://localhost:3000/api/v1/.well-known/openid-configuration
```

#### 5. Get JWKS
```bash
curl http://localhost:3000/api/v1/.well-known/jwks.json
```

---

## 🖥️ Frontend Testing

### Manual UI Testing

1. **Access Admin UI:**
   - Open: http://localhost:5173
   - Login with admin credentials

2. **Test User Management:**
   - Navigate to "Users" page
   - Create a new user
   - Edit user details
   - Activate/deactivate user
   - Assign roles to user

3. **Test Role Management:**
   - Navigate to "Roles" page
   - Create a new role
   - Edit role permissions
   - Delete role

4. **Test Audit Logs:**
   - Navigate to "Audit Logs" page
   - View recent activity
   - Filter by action type

5. **Test Dashboard:**
   - View user statistics
   - View role statistics
   - Check system health

### Browser DevTools Testing

1. **Open DevTools (F12)**
2. **Network Tab:**
   - Monitor API requests
   - Check response status codes
   - Verify request/response payloads

3. **Console Tab:**
   - Check for JavaScript errors
   - View API responses
   - Debug authentication issues

4. **Application Tab:**
   - Check localStorage for tokens
   - Verify token expiration
   - Clear storage for testing

---

## 🔒 Security Testing

### 1. Password Strength Validation

**Test weak passwords:**
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test2@csis.edu",
    "password": "weak",
    "displayName": "Test"
  }'
```
**Expected:** 400 Bad Request (password too weak)

**Test valid password:**
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test2@csis.edu",
    "password": "StrongP@ssw0rd!",
    "displayName": "Test"
  }'
```
**Expected:** 201 Created

### 2. Account Lockout

**Test failed login attempts:**
```bash
# Try wrong password 5 times
for i in {1..5}; do
  curl -X POST http://localhost:3000/api/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email": "test@csis.edu", "password": "WrongPassword"}'
done
```
**Expected:** Account locked after 5 attempts

### 3. Rate Limiting

**Test rate limits:**
```bash
# Make 11 requests quickly (limit is 10 per minute)
for i in {1..11}; do
  curl -X POST http://localhost:3000/api/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email": "test@csis.edu", "password": "Test123!"}'
done
```
**Expected:** 429 Too Many Requests on 11th request

### 4. Token Validation

**Test invalid token:**
```bash
curl -X GET http://localhost:3000/api/v1/auth/userinfo \
  -H "Authorization: Bearer invalid-token"
```
**Expected:** 401 Unauthorized

**Test expired token:**
- Wait for token to expire (15 minutes)
- Try to use it
- **Expected:** 401 Unauthorized

**Test blacklisted token:**
- Login to get token
- Logout (blacklists token)
- Try to use token
- **Expected:** 401 Unauthorized

### 5. CORS Testing

**Test from different origin:**
```bash
curl -X GET http://localhost:3000/api/v1/health \
  -H "Origin: http://example.com" \
  -v
```
**Expected:** CORS headers in response

---

## 🔗 Integration Testing

### Test Complete User Flow

1. **Register User:**
   ```bash
   curl -X POST http://localhost:3000/api/v1/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "email": "integration@csis.edu",
       "password": "TestP@ssw0rd!",
       "displayName": "Integration Test",
       "department": "CS"
     }'
   ```

2. **Activate User** (via Admin UI or database)

3. **Login:**
   ```bash
   curl -X POST http://localhost:3000/api/v1/auth/login \
     -H "Content-Type: application/json" \
     -d '{
       "email": "integration@csis.edu",
       "password": "TestP@ssw0rd!"
     }'
   ```

4. **Get User Info:**
   ```bash
   curl -X GET http://localhost:3000/api/v1/auth/userinfo \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

5. **Assign Role** (as admin):
   ```bash
   curl -X POST http://localhost:3000/api/v1/admin/users/USER_ID/roles/ROLE_ID \
     -H "Authorization: Bearer ADMIN_TOKEN"
   ```

6. **Verify Role Assignment:**
   ```bash
   curl -X GET http://localhost:3000/api/v1/auth/userinfo \
     -H "Authorization: Bearer USER_TOKEN"
   ```
   **Expected:** Roles array includes assigned role

### Test OAuth Integration Flow

1. **Get Token via OAuth:**
   ```bash
   curl -X POST http://localhost:3000/api/v1/oauth/token \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "grant_type=password&username=test@csis.edu&password=Test123!"
   ```

2. **Use Token to Access Protected Resource:**
   ```bash
   curl -X GET http://localhost:3000/api/v1/oauth/userinfo \
     -H "Authorization: Bearer OAUTH_TOKEN"
   ```

3. **Refresh Token:**
   ```bash
   curl -X POST http://localhost:3000/api/v1/oauth/token \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "grant_type=refresh_token&refresh_token=YOUR_REFRESH_TOKEN"
   ```

---

## 📊 Test Checklist

### Authentication & Authorization
- [ ] User registration with valid data
- [ ] User registration with invalid data (validation)
- [ ] Login with correct credentials
- [ ] Login with incorrect credentials
- [ ] Login with inactive account
- [ ] Token refresh
- [ ] Logout and token blacklisting
- [ ] Password reset flow
- [ ] Email verification flow
- [ ] Account lockout after failed attempts

### Role-Based Access Control
- [ ] Create role (admin only)
- [ ] List roles (authenticated)
- [ ] Assign role to user (admin only)
- [ ] Remove role from user (admin only)
- [ ] Access admin endpoints without admin role (should fail)
- [ ] Access admin endpoints with admin role (should succeed)

### User Management
- [ ] Create user (admin only)
- [ ] List users (admin only)
- [ ] Get user details
- [ ] Update user (admin only)
- [ ] Delete user (admin only)
- [ ] Activate/deactivate user

### OAuth2/OIDC
- [ ] Token endpoint (password grant)
- [ ] Token endpoint (refresh token grant)
- [ ] UserInfo endpoint
- [ ] Token introspection
- [ ] OIDC discovery document
- [ ] JWKS endpoint

### Security
- [ ] Password strength validation
- [ ] Rate limiting on sensitive endpoints
- [ ] CORS configuration
- [ ] Security headers (Helmet)
- [ ] Token expiration
- [ ] Token blacklisting

### Health & Monitoring
- [ ] Health check endpoint
- [ ] Readiness check endpoint
- [ ] Database connectivity
- [ ] Memory usage reporting

---

## 🛠️ Testing Tools

### Recommended Tools

1. **Swagger UI** - http://localhost:3000/api
   - Interactive API testing
   - Built-in authentication
   - Request/response examples

2. **Postman**
   - Import OpenAPI spec from Swagger
   - Create test collections
   - Automated test scripts

3. **cURL**
   - Command-line testing
   - Scriptable
   - Good for CI/CD

4. **Browser DevTools**
   - Network monitoring
   - Console debugging
   - Storage inspection

---

## 🐛 Troubleshooting Tests

### Common Issues

**"Cannot connect to database"**
- Check Docker is running: `docker compose ps`
- Verify database credentials in `.env`
- Check database port (5433)

**"401 Unauthorized"**
- Verify token is valid
- Check token hasn't expired
- Ensure user has required roles

**"429 Too Many Requests"**
- Wait for rate limit window to reset
- Check rate limit configuration
- Use `@SkipThrottle()` for testing endpoints

**Tests fail randomly**
- Ensure database is clean before tests
- Check for test data conflicts
- Verify test isolation

---

## 📝 Test Data

### Test Users

- **Admin:** shane@csis.edu / Admin_123!
- **Test User:** test@csis.edu / Test123!

### Test Roles

- admin
- staff
- student
- developer
- class_rep

---

## 🎯 Quick Test Commands

```bash
# Health check
curl http://localhost:3000/api/v1/health

# OAuth test
cd backend && node test-oauth.js

# Run all tests
cd backend && npm run test:all

# Run E2E tests
cd backend && npm run test:e2e

# Check database
.\scripts\quick-db-view.bat
```

---

For more detailed testing instructions, see:
- `backend/test-oauth-endpoints.md` - OAuth testing
- `backend/test/README.md` - E2E test documentation
- Swagger UI at http://localhost:3000/api - Interactive testing

