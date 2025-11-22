/**
 * CSIS IAM SDK for Node.js
 * Middleware and utilities for integrating with CSIS IAM Service
 */

const axios = require('axios');
const jwt = require('jsonwebtoken');

class CSISIAMClient {
  constructor(config) {
    this.iamUrl = config.iamUrl || 'http://localhost:3000/api/v1';
    this.jwtSecret = config.jwtSecret;
  }

  /**
   * Verify JWT token and extract user info
   */
  async verifyToken(token) {
    try {
      const decoded = jwt.verify(token, this.jwtSecret);
      return decoded;
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  /**
   * Introspect token via IAM service
   */
  async introspectToken(token) {
    try {
      const response = await axios.post(`${this.iamUrl}/oauth/introspect`, {
        token,
      });
      return response.data;
    } catch (error) {
      throw new Error('Token introspection failed');
    }
  }

  /**
   * Get user info from token
   */
  async getUserInfo(token) {
    try {
      const response = await axios.get(`${this.iamUrl}/auth/userinfo`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      throw new Error('Failed to get user info');
    }
  }

  /**
   * Check if user has required role
   */
  hasRole(user, role) {
    return user.csis_roles && user.csis_roles.includes(role);
  }

  /**
   * Check if user has any of the required roles
   */
  hasAnyRole(user, roles) {
    return roles.some((role) => this.hasRole(user, role));
  }
}

/**
 * Express middleware to verify JWT and attach user to request
 */
function verifyJWT(iamClient) {
  return async (req, res, next) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json({ error: 'No token provided' });
      }

      const user = await iamClient.verifyToken(token);
      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json({ error: 'Invalid token' });
    }
  };
}

/**
 * Express middleware to require specific role
 */
function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const iamClient = new CSISIAMClient({});
    if (!iamClient.hasRole(req.user, role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
}

/**
 * Express middleware to require any of the specified roles
 */
function requireAnyRole(roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const iamClient = new CSISIAMClient({});
    if (!iamClient.hasAnyRole(req.user, roles)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
}

module.exports = {
  CSISIAMClient,
  verifyJWT,
  requireRole,
  requireAnyRole,
};

