# Changelog

## [Unreleased] - 2024-01-XX

### Added
- ✅ **Token Refresh Endpoint** (`POST /api/v1/auth/refresh`)
  - Validates refresh token
  - Issues new access and refresh tokens
  - Implements token rotation (old refresh token blacklisted)
  - Includes audit logging

- ✅ **Logout Endpoint** (`POST /api/v1/auth/logout`)
  - Invalidates access token by adding to blacklist
  - Optionally invalidates refresh token
  - Audit logs logout events
  - Token blacklist checked on every authenticated request

- ✅ **Token Blacklist System**
  - New `token_blacklist` database table
  - Automatic cleanup of expired tokens
  - Integrated into JWT authentication guard
  - Prevents use of revoked tokens

### Technical Details

**New Files:**
- `backend/src/auth/entities/token-blacklist.entity.ts` - Token blacklist entity
- `backend/src/auth/dto/refresh-token.dto.ts` - Refresh token DTO

**Modified Files:**
- `backend/src/auth/auth.service.ts` - Added `refreshToken()` and `logout()` methods
- `backend/src/auth/auth.controller.ts` - Added refresh and logout endpoints
- `backend/src/auth/guards/jwt-auth.guard.ts` - Added blacklist checking
- `backend/src/database/database.module.ts` - Added TokenBlacklist entity

### API Changes

**New Endpoints:**
```http
POST /api/v1/auth/refresh
Content-Type: application/json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}

Response:
{
  "accessToken": "...",
  "refreshToken": "..."
}
```

```http
POST /api/v1/auth/logout
Authorization: Bearer <access_token>
Content-Type: application/json
{
  "refreshToken": "..." // optional
}

Response:
{
  "message": "Logged out successfully"
}
```

### Security Improvements
- Tokens can now be revoked via logout
- Token blacklist prevents reuse of logged-out tokens
- Token rotation on refresh enhances security
- All token operations are audit logged

### Testing
To test the new endpoints:

1. **Test Token Refresh:**
```bash
# First login to get tokens
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@csis.edu", "password": "Admin123!"}'

# Use refresh token to get new tokens
curl -X POST http://localhost:3000/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "YOUR_REFRESH_TOKEN"}'
```

2. **Test Logout:**
```bash
# Logout with access token
curl -X POST http://localhost:3000/api/v1/auth/logout \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "YOUR_REFRESH_TOKEN"}'

# Try to use the token after logout (should fail)
curl -X GET http://localhost:3000/api/v1/auth/userinfo \
  -H "Authorization: Bearer REVOKED_TOKEN"
```

### Next Steps
- [ ] Implement password reset (currently placeholder)
- [ ] Add rate limiting
- [ ] Complete Keycloak integration
- [ ] Add email verification

