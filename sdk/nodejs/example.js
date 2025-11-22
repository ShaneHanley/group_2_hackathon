/**
 * Example usage of CSIS IAM SDK
 */

const express = require('express');
const { CSISIAMClient, verifyJWT, requireRole } = require('./index');

const app = express();
app.use(express.json());

// Initialize IAM client
const iamClient = new CSISIAMClient({
  iamUrl: 'http://localhost:3000/api/v1',
  jwtSecret: 'your-jwt-secret', // Should match IAM service secret
});

// Public endpoint
app.get('/public', (req, res) => {
  res.json({ message: 'This is a public endpoint' });
});

// Protected endpoint (requires authentication)
app.get('/protected', verifyJWT(iamClient), (req, res) => {
  res.json({
    message: 'This is a protected endpoint',
    user: req.user,
  });
});

// Admin-only endpoint (requires admin role)
app.get('/admin', verifyJWT(iamClient), requireRole('admin'), (req, res) => {
  res.json({
    message: 'This is an admin-only endpoint',
    user: req.user,
  });
});

// Staff or admin endpoint
app.get(
  '/staff',
  verifyJWT(iamClient),
  requireAnyRole(['staff', 'admin']),
  (req, res) => {
    res.json({
      message: 'This endpoint is for staff or admin',
      user: req.user,
    });
  },
);

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Example app running on http://localhost:${PORT}`);
  console.log('Try accessing:');
  console.log(`  GET http://localhost:${PORT}/public`);
  console.log(`  GET http://localhost:${PORT}/protected (requires Bearer token)`);
  console.log(`  GET http://localhost:${PORT}/admin (requires admin role)`);
});

