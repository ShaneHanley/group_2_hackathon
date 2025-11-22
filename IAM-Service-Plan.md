# CSIS IAM Service Plan

## 1. Project Goals
- Deliver a centralized IAM backend that all departmental systems call for authentication, RBAC, user lifecycle, and auditing.
- Support OAuth2/OpenID Connect, JWT-based sessions, and scoped RBAC so systems like the booking system, showcase portal, CMS, and labs only request what they need.
- Ship within 48 hours by splitting work into clear chunks and assigning each team member a primary responsibility plus a pairing partner.

## 2. Architecture Overview

### Core Components
1. **Identity Provider (IdP) - Keycloak (Self-Hosted)** – provides OAuth2/OIDC flows, JWT issuance, token refresh, and user authentication. **Note:** Self-hosted Keycloak on CSIS infrastructure = fully internal and controlled, not external. Keycloak is the framework; your IAM is the configuration, custom APIs, and integration layer built on top.
2. **Custom IAM API Service (Node.js/NestJS)** – wraps Keycloak with CSIS-specific logic: registration workflows, password reset, user lifecycle management, custom metadata, and department-specific policies.
3. **RBAC Store** – PostgreSQL tables for `roles`, `permissions`, `role_permissions`, `user_roles`. Roles: `admin`, `staff`, `student`, `developer`, `lab-manager`, `class-rep`. Keycloak roles synced with PostgreSQL for custom permission checks.
4. **Lifecycle & Audit Service** – handles onboarding, role updates, deactivation, and immutable audit logging (login, password changes, role edits, token issuance).
5. **Integration Gateway** – OAuth2/OIDC endpoints exposed via Keycloak, plus custom middleware for JWT validation, token introspection, and client credential management for CSIS systems.
6. **Admin Console (React + Tailwind)** – minimal UI for managing users, roles, viewing audit logs, and configuring client applications.

### Technology Stack by Component

| Component | Technologies |
|-----------|-------------|
| **Identity Provider** | Keycloak 24.0+ (self-hosted), Java/WildFly (bundled), PostgreSQL (Keycloak DB) |
| **Custom IAM API** | Node.js + TypeScript + NestJS/Express, TypeORM/Prisma (ORM), openid-client library |
| **User Management** | PostgreSQL (users table), Argon2/Bcrypt (password hashing), SMTP (email verification/reset) |
| **RBAC Engine** | PostgreSQL (roles/permissions tables), JWT custom claims (`csis_roles`), Keycloak Role Mapper |
| **Token & Session** | JWT (RS256), Redis (token blacklist, rate limiting, session cache) |
| **Admin UI** | React + Vite, TailwindCSS, Axios/Fetch, Keycloak Admin REST API |
| **Audit & Logging** | PostgreSQL (audit_logs table), Winston (structured JSON logs) |
| **Integration SDK** | Node.js middleware (`verifyJWT`, `requireRole`), Python SDK (optional), JWKs endpoint |
| **DevOps** | Docker Compose, GitHub Actions (CI), Nginx (reverse proxy/TLS termination) |
| **Security** | RSA 2048/4096 keypair (JWT signing), TLS/HTTPS, Helmet.js, CORS policies |

### Data & Secrets
- Store users, roles, permissions, and audit logs in PostgreSQL.
- Keycloak uses its own PostgreSQL database for identity data; custom IAM API uses separate schema for CSIS-specific metadata.
- Secrets (JWT signing keys, OAuth client secrets) read from environment variables.
- Encrypt refresh tokens or store hashed value to avoid leaking tokens.

### Scale & Performance
- Target ~20k university users: use connection pooling (PgBouncer or ORM pools) and leverage read replicas if load increases.
- Cache claims/role lookups in Redis or in-process cache with short TTL to reduce DB hits from every token validation.
- Keep JWT payloads small, issue short-lived access tokens (~15m) plus refresh tokens with revocation lists to keep token churn manageable.
- Plan to containerize (Docker) so you can scale the API horizontally behind a simple load balancer or reverse proxy if needed.

## 3. API Surface

### Public (for all systems)
| Endpoint | Purpose | Auth |
|---|---|---|
| `POST /auth/register` | Student/staff self-signup (with verification) | Public |
| `POST /auth/login` | Email + password → access + refresh tokens | Public |
| `POST /auth/refresh` | Renew tokens via refresh token | Requires refresh token |
| `POST /auth/logout` | Revoke active token(s) | Bearer |
| `GET /auth/userinfo` | Return claims/roles for current user | Bearer |

### Admin (CSIS staff)
| Endpoint | Purpose | Auth |
|---|---|---|
| `GET /admin/users` | List/filter users | CSIS admin role |
| `PATCH /admin/users/:id/roles` | Assign/remove roles | CSIS admin |
| `POST /admin/roles` | Create/update custom roles/permissions | CSIS admin |
| `POST /admin/audit` | Export logs or filter | CSIS admin |

### Integration (OAuth/OIDC)
- `POST /oauth/token` – issue tokens for CSIS apps (client credentials, authorization code if we support UI logins).
- `GET /oauth/userinfo` – standard OIDC info.
- `POST /oauth/introspect` – let services validate access tokens.

## 4. Security & Policies
- Argon2id for password hashing + minimum 10-byte salts.
- JWT signed with RS256 (private key) or HS256 with strong secret; expose public key via `/.well-known/jwks.json` so CSIS apps can verify.
- Rate limit login/registration endpoints via middleware.
- MFA placeholder (SMS/email) can be simulated by a `mfa-code` challenge field for future work.
- Periodic token sweeps to deactivate tokens for deactivated users.

## 5. Quick Start: Step 1 - Foundation Setup

### Docker Compose Configuration

Create `docker-compose.yml` in your project root:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15
    container_name: iam-postgres
    environment:
      POSTGRES_USER: keycloak
      POSTGRES_PASSWORD: keycloak
      POSTGRES_DB: keycloak
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  keycloak:
    image: quay.io/keycloak/keycloak:24.0.0
    container_name: csis-keycloak
    command:
      - start-dev
    environment:
      KC_DB: postgres
      KC_DB_URL: jdbc:postgresql://postgres:5432/keycloak
      KC_DB_USERNAME: keycloak
      KC_DB_PASSWORD: keycloak
      KEYCLOAK_ADMIN: admin
      KEYCLOAK_ADMIN_PASSWORD: admin
    ports:
      - "8080:8080"
    depends_on:
      - postgres

volumes:
  postgres_data:
```

### Setup Steps (1-1.5 hours)

1. **Start Services**
   ```bash
   docker compose up -d
   ```

2. **Access Keycloak Admin Console**
   - URL: http://localhost:8080/admin
   - Username: `admin`
   - Password: `admin`

3. **Create CSIS Realm**
   - Left menu → Master dropdown → Create Realm
   - Name: `CSIS`
   - Save

4. **Create Base Roles**
   - Inside CSIS realm: Roles → Add Role
   - Create: `student`, `staff`, `admin`, `developer`
   - (Optional: `classrep`, `lab_manager`, `equipment_manager`)

5. **Create Test OAuth Client**
   - Clients → Create
   - Client ID: `csis-test-client`
   - Client Type: OpenID Connect
   - Client Authentication: On
   - Root URL: `http://localhost:3000`
   - Save → Go to Credentials tab → Note Client Secret

6. **Create Test User**
   - Users → Add User
   - Username: `testuser`
   - Set password (disable "temporary")
   - Assign role: `student`

7. **Verify OIDC Token Endpoint**
   ```bash
   curl -X POST http://localhost:8080/realms/CSIS/protocol/openid-connect/token \
     -d "grant_type=client_credentials" \
     -d "client_id=csis-test-client" \
     -d "client_secret=YOUR_SECRET_HERE"
   ```
   Expected response: `{"access_token": "...", "expires_in": 300, "token_type": "Bearer"}`

### Next Step: Custom IAM API Service
Once Keycloak is running, proceed to Step 2: Build the Node.js/NestJS API service that wraps Keycloak with CSIS-specific logic.

## 6. Implementation Timeline (48h)

### Sprint Breakdown
1. **Hours 0–2 (Foundation Setup)** – Docker Compose with Keycloak + PostgreSQL, create CSIS realm, configure base roles (`admin`, `staff`, `student`, `developer`), create test OAuth client, verify token endpoint works.
2. **Hours 2–10 (Custom IAM API + User Management)** – initialize Node.js/NestJS project, set up PostgreSQL schema for custom metadata, implement `/api/v1/users` (registration, password reset), integrate with Keycloak Admin API for user creation.
3. **Hours 10–18 (RBAC & Token Integration)** – implement role assignment endpoints, permissions table, JWT custom claims (`csis_roles`), middleware for role checks, admin endpoints (list users, change roles), token introspection endpoint.
4. **Hours 18–32 (Integration + Lifecycle)** – OAuth2/OIDC client registration API, user lifecycle hooks (activate/deactivate, role changes), audit logging service, password reset flow with email simulation, token revocation lists.
5. **Hours 32–40 (Admin UI + Docs)** – React admin UI (user management, role assignment, audit viewer), README, OpenAPI/Swagger documentation, Postman collection, integration guide for downstream systems.
6. **Hours 40–48 (QA & Handoff)** – integration tests, end-to-end smoke tests with sample client app, security checklist validation, final documentation, demo preparation.

### Tooling
- Use OpenAPI (Swagger UI) to document endpoints while developing.
- Postman or `httpie` for manual integration.
- Docker for database + app if time allows; otherwise use local dev server with env files.

## 7. Data Models

### PostgreSQL Tables (Custom IAM API)

**users**
```sql
id UUID PRIMARY KEY
email TEXT UNIQUE
password_hash TEXT
display_name TEXT
status ENUM (pending, active, suspended, deactivated)
department TEXT
metadata JSONB
created_at TIMESTAMP
updated_at TIMESTAMP
```

**roles**
```sql
id UUID PRIMARY KEY
name TEXT (e.g., admin, staff, student, class_rep, developer)
department_scope TEXT or NULL
permissions JSONB
```

**user_roles**
```sql
user_id UUID REFERENCES users(id)
role_id UUID REFERENCES roles(id)
granted_by UUID
granted_at TIMESTAMP
expires_at TIMESTAMP (optional)
```

**audit_logs**
```sql
id UUID PRIMARY KEY
timestamp TIMESTAMP
actor_id UUID
action TEXT
resource_type TEXT
resource_id UUID
details JSONB
ip_address TEXT
```

### JWT Claims Example
```json
{
  "iss": "https://iam.csis.local",
  "sub": "user-uuid",
  "aud": "equipment-booking",
  "exp": 1700000000,
  "iat": 1699996400,
  "email": "alice@csis.edu",
  "csis_roles": ["student", "lab_user"],
  "department": "Computer Science"
}
```

## 8. Team Assignments (6-members)

| Member | Role | Primary Tasks | Deliverables |
|--------|------|---------------|--------------|
| **M1 (Lead)** | Coordinator/Integrator | Repo scaffold, Docker Compose, branch management, merge PRs, end-to-end integration | Working docker-compose.yml, repo structure, integration tests |
| **M2** | Backend Auth/IdP | Keycloak install/config, OIDC discovery, client registration, JWT token issuance | Configured Keycloak realm, OAuth clients, token endpoints working |
| **M3** | Backend Users/RBAC | Implement user endpoints, DB migrations, role assignment API, audit hooks | REST endpoints (`/api/v1/users`, `/api/v1/roles`), Postman collection |
| **M4** | Frontend Admin | React admin UI: user list/detail, role management, audit viewer | Deployed admin UI (local), basic UX flows |
| **M5** | DevOps/QA | Compose files, start scripts, smoke tests, security checklist (TLS, rate-limit) | Test report, CI workflow stub, security validation |
| **M6** | Integration/Docs | Middleware SDK, sample client login flow, OpenAPI doc, integration guide | Node.js middleware, example client app, API.md, INTEGRATION.md |

**Pairing Strategy:** Lead + QA, Lifecycle + Backend, Frontend + Integration for cross-checks.

## 9. Example API Endpoints

### 1. User Registration
```http
POST /api/v1/users
Content-Type: application/json

{
  "email": "alice@csis.edu",
  "password": "P@ssw0rd!",
  "display_name": "Alice",
  "department": "CS"
}

Response: 201 Created
{
  "id": "user-uuid",
  "status": "pending"
}
```

### 2. Password Reset
```http
POST /api/v1/users/password-reset
Content-Type: application/json

{
  "email": "alice@csis.edu"
}

Response: 200 OK
{
  "message": "Reset token sent to email"
}

POST /api/v1/users/password-reset/confirm
{
  "token": "...",
  "new_password": "..."
}
```

### 3. RBAC Management
```http
GET /api/v1/roles

POST /api/v1/roles
{
  "name": "lab_user",
  "permissions": ["book_equipment"]
}

POST /api/v1/users/{id}/roles
{
  "role_id": "role-uuid",
  "granted_by": "admin-uuid"
}
```

### 4. Token Introspection
```http
POST /oauth/introspect
Content-Type: application/x-www-form-urlencoded

token=<access_token>

Response: 200 OK
{
  "active": true,
  "sub": "user-uuid",
  "csis_roles": ["student"],
  "email": "alice@csis.edu"
}
```

### 5. Audit Query (Admin)
```http
GET /api/v1/audit?user_id=xxx&action=role_change&from=2024-01-01&to=2024-01-31
Authorization: Bearer <admin_token>
```

## 10. Success Criteria
- All CSIS systems can authenticate via the IAM service (simulate by calling `/auth/login` and `/oauth/introspect`).
- RBAC enforced via middleware and admin role editor.
- Clear docs, Postman collection, and demo script for future integration.
- Audit log entries recorded for critical actions (login, role change, deactivate).

## 11. Next Steps for Today
1. Finalize technology stack and assign repo/branch names.
2. Kick off the database schema and register seed data for roles.
3. Begin wiring `/auth/register`, `/auth/login`, and JWT issuance.

