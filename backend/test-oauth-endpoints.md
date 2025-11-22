# OAuth Endpoints Testing Guide

This guide helps you test the OAuth2/OIDC endpoints to verify token issuance works correctly.

## Prerequisites

1. **Start the backend:**
   ```bash
   cd backend
   npm run start:dev
   ```

2. **Ensure PostgreSQL is running:**
   ```bash
   docker compose up -d
   ```

3. **Have a test user created:**
   - Use the Admin UI to create a user, or
   - Use the registration endpoint

## Test 1: OAuth2 Password Grant (Token Endpoint)

### Request
```bash
curl -X POST http://localhost:3000/api/v1/oauth/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password&username=test@csis.edu&password=Test123!&scope=openid profile email"
```

### Expected Response
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 900,
  "refresh_expires_in": 604800,
  "scope": "openid profile email"
}
```

### Verify Token
```bash
# Copy the access_token from above response
curl -X GET http://localhost:3000/api/v1/oauth/userinfo \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Test 2: Refresh Token Grant

### Request
```bash
curl -X POST http://localhost:3000/api/v1/oauth/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=refresh_token&refresh_token=YOUR_REFRESH_TOKEN"
```

### Expected Response
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 900,
  "refresh_expires_in": 604800
}
```

## Test 3: Token Introspection

### Request
```bash
curl -X POST http://localhost:3000/api/v1/oauth/introspect \
  -H "Content-Type: application/json" \
  -d '{"token": "YOUR_ACCESS_TOKEN"}'
```

### Expected Response
```json
{
  "active": true,
  "sub": "user-uuid",
  "email": "test@csis.edu",
  "email_verified": true,
  "csis_roles": ["admin"],
  "exp": 1234567890,
  "iat": 1234567890,
  "iss": "http://localhost:3000/api/v1",
  "aud": null
}
```

## Test 4: OpenID Connect Discovery

### Request
```bash
curl -X GET http://localhost:3000/api/v1/.well-known/openid-configuration
```

### Expected Response
```json
{
  "issuer": "http://localhost:3000/api/v1",
  "authorization_endpoint": "http://localhost:3000/api/v1/oauth/authorize",
  "token_endpoint": "http://localhost:3000/api/v1/oauth/token",
  "userinfo_endpoint": "http://localhost:3000/api/v1/oauth/userinfo",
  "jwks_uri": "http://localhost:3000/api/v1/.well-known/jwks.json",
  "introspection_endpoint": "http://localhost:3000/api/v1/oauth/introspect",
  "response_types_supported": ["code", "token", "id_token", ...],
  "subject_types_supported": ["public"],
  "id_token_signing_alg_values_supported": ["RS256"],
  "scopes_supported": ["openid", "profile", "email"],
  "token_endpoint_auth_methods_supported": ["client_secret_post", "client_secret_basic"],
  "claims_supported": ["sub", "email", "email_verified", "name", "preferred_username", "csis_roles", "department"]
}
```

## Test 5: JWKS (JSON Web Key Set)

### Request
```bash
curl -X GET http://localhost:3000/api/v1/.well-known/jwks.json
```

### Expected Response
```json
{
  "keys": [
    {
      "kty": "RSA",
      "use": "sig",
      "kid": "hex-string",
      "n": "base64-modulus",
      "e": "AQAB",
      "alg": "RS256"
    }
  ]
}
```

## Test 6: UserInfo Endpoint

### Request
```bash
curl -X GET http://localhost:3000/api/v1/oauth/userinfo \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Expected Response
```json
{
  "sub": "user-uuid",
  "email": "test@csis.edu",
  "email_verified": true,
  "name": "Test User",
  "preferred_username": "test@csis.edu",
  "csis_roles": ["admin"],
  "department": "CS"
}
```

## Test 7: Error Handling

### Invalid Grant Type
```bash
curl -X POST http://localhost:3000/api/v1/oauth/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=invalid"
```

### Expected Response
```json
{
  "error": "invalid_request",
  "error_description": "Unsupported grant type: invalid"
}
```

### Invalid Credentials
```bash
curl -X POST http://localhost:3000/api/v1/oauth/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password&username=test@csis.edu&password=WrongPassword"
```

### Expected Response
```json
{
  "error": "invalid_request",
  "error_description": "Invalid credentials"
}
```

## Automated Testing Script

You can also use this Node.js script for automated testing:

```javascript
const axios = require('axios');

async function testOAuthEndpoints() {
  const baseUrl = 'http://localhost:3000/api/v1';
  
  try {
    // Test 1: Password Grant
    console.log('Test 1: Password Grant');
    const tokenResponse = await axios.post(`${baseUrl}/oauth/token`, 
      new URLSearchParams({
        grant_type: 'password',
        username: 'test@csis.edu',
        password: 'Test123!',
        scope: 'openid profile email'
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    console.log('✅ Token issued:', tokenResponse.data.access_token.substring(0, 20) + '...');
    
    // Test 2: UserInfo
    console.log('\nTest 2: UserInfo');
    const userInfoResponse = await axios.get(`${baseUrl}/oauth/userinfo`, {
      headers: { Authorization: `Bearer ${tokenResponse.data.access_token}` }
    });
    console.log('✅ UserInfo:', userInfoResponse.data);
    
    // Test 3: Introspection
    console.log('\nTest 3: Token Introspection');
    const introspectResponse = await axios.post(`${baseUrl}/oauth/introspect`, {
      token: tokenResponse.data.access_token
    });
    console.log('✅ Introspection:', introspectResponse.data);
    
    // Test 4: Discovery
    console.log('\nTest 4: OIDC Discovery');
    const discoveryResponse = await axios.get(`${baseUrl}/.well-known/openid-configuration`);
    console.log('✅ Discovery:', discoveryResponse.data.issuer);
    
    // Test 5: JWKS
    console.log('\nTest 5: JWKS');
    const jwksResponse = await axios.get(`${baseUrl}/.well-known/jwks.json`);
    console.log('✅ JWKS:', jwksResponse.data.keys.length, 'key(s)');
    
    console.log('\n✅ All OAuth endpoint tests passed!');
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testOAuthEndpoints();
```

## Troubleshooting

### Token Endpoint Returns 400
- Check that `grant_type` is provided
- Verify user credentials are correct
- Ensure user account is active

### Token Endpoint Returns 401
- Verify username and password are correct
- Check user status is 'active'
- Ensure user exists in database

### JWKS Returns Empty Keys
- Check that RSA keypair was generated (look for `keys/` directory in backend)
- Verify JwtKeyService is initialized correctly
- Check backend logs for errors

### UserInfo Returns 401
- Verify access token is valid and not expired
- Check token format: `Bearer <token>`
- Ensure token hasn't been blacklisted

