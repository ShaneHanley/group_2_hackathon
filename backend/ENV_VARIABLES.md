# Environment Variables Configuration

This document lists all required environment variables for the CSIS IAM backend.

## Required Variables

Create a `.env` file in the `backend/` directory with the following variables:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=iam
DB_PASSWORD=iam
DB_DATABASE=iam

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Application Configuration
PORT=3000
NODE_ENV=development
BASE_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:5173
FRONTEND_URL=http://localhost:5173

# Rate Limiting
THROTTLE_TTL=60000
THROTTLE_LIMIT=10

# Redis Configuration (optional - for caching and rate limiting)
REDIS_ENABLED=false
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Email Configuration (optional - for sending emails)
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_SECURE=false
SMTP_FROM=noreply@csis.edu
```

## Variable Descriptions

### Database Configuration
- `DB_HOST`: PostgreSQL host (default: `localhost`)
- `DB_PORT`: PostgreSQL port (default: `5432`)
- `DB_USERNAME`: Database username (default: `iam`)
- `DB_PASSWORD`: Database password (default: `iam`)
- `DB_DATABASE`: Database name (default: `iam`)

### JWT Configuration
- `JWT_SECRET`: Secret key for signing JWT tokens (REQUIRED - use a strong random string)
  - Generate with: `openssl rand -base64 32`
- `JWT_EXPIRES_IN`: Access token expiration time (default: `15m`)
- `JWT_REFRESH_EXPIRES_IN`: Refresh token expiration time (default: `7d`)

### Application Configuration
- `PORT`: Backend API port (default: `3000`)
- `NODE_ENV`: Environment mode (`development` or `production`)
- `BASE_URL`: Base URL for the API (used in OAuth/OIDC endpoints)
- `CORS_ORIGIN`: Allowed CORS origins (comma-separated for multiple)
- `FRONTEND_URL`: Frontend URL (used for password reset links, etc.)

### Rate Limiting
- `THROTTLE_TTL`: Time window for rate limiting in milliseconds (default: `60000` = 1 minute)
- `THROTTLE_LIMIT`: Maximum requests per time window (default: `10`)

### Redis Configuration (Optional)
- `REDIS_ENABLED`: Enable Redis (default: `false`). Set to `true` to enable Redis caching.
- `REDIS_HOST`: Redis host (default: `localhost`)
- `REDIS_PORT`: Redis port (default: `6379`)
- `REDIS_PASSWORD`: Redis password (optional)

**Note:** Redis is optional. The application will work without it. To use Redis, set `REDIS_ENABLED=true` and ensure the Redis container is running (`docker compose up -d redis`).

### Email Configuration (Optional)
- `SMTP_HOST`: SMTP server hostname
- `SMTP_PORT`: SMTP server port (default: `587`)
- `SMTP_USER`: SMTP username
- `SMTP_PASS`: SMTP password
- `SMTP_SECURE`: Use TLS/SSL (default: `false`)
- `SMTP_FROM`: From email address (default: `noreply@csis.edu`)

**Note:** If SMTP is not configured, emails will be logged to console in development mode.

## Setup Instructions

1. Copy this template to create your `.env` file:
   ```bash
   cd backend
   # Create .env file manually or copy from this template
   ```

2. Generate a secure JWT secret:
   ```bash
   openssl rand -base64 32
   ```

3. Update the `JWT_SECRET` value in your `.env` file with the generated secret.

4. For production, ensure all secrets are strong and unique.

## Security Notes

- **Never commit `.env` files to version control**
- Use strong, random values for `JWT_SECRET` in production
- Change default database passwords in production
- Use environment-specific values for `NODE_ENV`
- Restrict `CORS_ORIGIN` in production to specific domains

