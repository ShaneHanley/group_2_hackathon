# CSIS Identity & Access Management (IAM) Service

A centralized IAM service for CSIS department systems, providing authentication, authorization, and user management capabilities.

## Features

- ✅ OAuth2/OpenID Connect support via Keycloak
- ✅ User registration, login, and password reset
- ✅ Role-Based Access Control (RBAC)
- ✅ Admin dashboard for user/role management
- ✅ Audit logging
- ✅ Token introspection and validation
- ✅ Integration SDK for downstream systems

## Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 18+ and npm
- PostgreSQL 15+ (or use Docker)

### Setup

1. **Start Keycloak and PostgreSQL:**
   ```bash
   docker compose up -d
   ```

2. **Configure Keycloak:**
   - Access http://localhost:8080/admin
   - Login: `admin` / `admin`
   - Create realm: `CSIS`
   - Create roles: `admin`, `staff`, `student`, `developer`
   - Create OAuth client: `csis-iam-api` (Client Authentication: On)

3. **Install dependencies:**
   ```bash
   npm run setup
   ```

4. **Configure environment:**
   ```bash
   cp backend/.env.example backend/.env
   # Edit backend/.env with your Keycloak settings
   ```

5. **Run database migrations:**
   ```bash
   cd backend
   npm run migration:run
   ```

6. **Start services:**
   ```bash
   npm run start:all
   ```

## Project Structure

```
.
├── backend/          # NestJS API service
├── frontend/         # React admin UI
├── sdk/              # Integration SDK for client apps
├── docker-compose.yml
└── IAM-Service-Plan.md
```

## API Documentation

Once running, access:
- API: http://localhost:3000
- Swagger UI: http://localhost:3000/api
- Admin UI: http://localhost:5173
- Keycloak: http://localhost:8080

## Integration Guide

See `docs/INTEGRATION.md` for details on integrating other CSIS systems.

## Team

Built by CSIS Hackathon Team (6 members)

