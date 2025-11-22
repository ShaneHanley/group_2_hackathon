# CSIS IAM Integration Guide

This guide explains how to integrate other CSIS systems (Equipment Booking, FYP Showcase, Department CMS, Lab Timetable) with the CSIS IAM Service.

## Overview

The CSIS IAM Service provides:
- OAuth2/OpenID Connect authentication
- JWT-based access tokens
- Role-Based Access Control (RBAC)
- Token introspection
- User information endpoints

## Integration Methods

### Method 1: Using the Node.js SDK (Recommended)

1. Install the SDK:
```bash
npm install @csis/iam-sdk
```

2. Use in your Express application:
```javascript
const { verifyJWT, requireRole } = require('@csis/iam-sdk');

// Protect routes
app.get('/api/protected', verifyJWT(iamClient), (req, res) => {
  // req.user contains decoded JWT with user info and roles
  res.json({ user: req.user });
});

// Require specific role
app.get('/api/admin', verifyJWT(iamClient), requireRole('admin'), (req, res) => {
  res.json({ message: 'Admin only' });
});
```

### Method 2: Direct API Integration

#### 1. User Login Flow

```javascript
// Step 1: User logs in via IAM
const loginResponse = await fetch('http://iam.csis.local/api/v1/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@csis.edu',
    password: 'password',
  }),
});

const { accessToken, refreshToken } = await loginResponse.json();

// Step 2: Store token in your app (cookie, localStorage, etc.)
// Step 3: Include token in subsequent requests
```

#### 2. Validate Token on Each Request

```javascript
// In your middleware
async function validateToken(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  // Option A: Introspect via IAM service
  const introspection = await fetch('http://iam.csis.local/api/v1/oauth/introspect', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });

  const tokenInfo = await introspection.json();
  
  if (!tokenInfo.active) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  req.user = {
    id: tokenInfo.sub,
    email: tokenInfo.email,
    roles: tokenInfo.csis_roles,
  };

  next();
}

// Option B: Verify JWT locally (if you have the public key)
const jwt = require('jsonwebtoken');
const publicKey = await fetch('http://iam.csis.local/.well-known/jwks.json');
// ... verify token
```

#### 3. Check User Roles

```javascript
function requireRole(role) {
  return (req, res, next) => {
    if (!req.user?.csis_roles?.includes(role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}

// Usage
app.get('/api/equipment', validateToken, requireRole('student'), handler);
```

## OAuth2 Client Credentials Flow (Server-to-Server)

For service-to-service authentication:

```javascript
const tokenResponse = await fetch('http://iam.csis.local/realms/CSIS/protocol/openid-connect/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: 'your-client-id',
    client_secret: 'your-client-secret',
  }),
});

const { access_token } = await tokenResponse.json();
```

## Example: Equipment Booking System Integration

```javascript
const express = require('express');
const { verifyJWT, requireRole } = require('@csis/iam-sdk');

const app = express();

// Initialize IAM client
const iamClient = new CSISIAMClient({
  iamUrl: 'http://iam.csis.local/api/v1',
});

// All equipment endpoints require authentication
app.use('/api/equipment', verifyJWT(iamClient));

// Book equipment (students and staff)
app.post('/api/equipment/book', requireAnyRole(['student', 'staff']), async (req, res) => {
  const { equipmentId } = req.body;
  const userId = req.user.sub;
  
  // Your booking logic here
  res.json({ message: 'Equipment booked', userId });
});

// Manage equipment (staff only)
app.post('/api/equipment/manage', requireRole('staff'), async (req, res) => {
  // Staff-only logic
  res.json({ message: 'Equipment managed' });
});
```

## Environment Variables

Set these in your application:

```bash
IAM_URL=http://iam.csis.local/api/v1
IAM_JWT_SECRET=your-jwt-secret
IAM_CLIENT_ID=your-client-id
IAM_CLIENT_SECRET=your-client-secret
```

## Error Handling

```javascript
try {
  const user = await iamClient.verifyToken(token);
} catch (error) {
  if (error.message === 'Invalid token') {
    // Token expired or invalid
    return res.status(401).json({ error: 'Please login again' });
  }
  // Other errors
  return res.status(500).json({ error: 'Authentication service error' });
}
```

## Testing Integration

1. Register a test user via IAM API
2. Login and get access token
3. Use token to access your protected endpoints
4. Test role-based access control

## Support

For issues or questions, contact the CSIS IAM team.

