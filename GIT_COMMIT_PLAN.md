# Git Commit Plan - 6 Modules for 6 Team Members

## Overview
Split the codebase into 6 logical modules, each assigned to one team member. Each person will make 5-6 incremental commits for their module.

---

## Module 1: Core Authentication System - darren
**Assigned to:** Person 1  
**Files:** `backend/src/auth/` (excluding password reset initially)

### Commit Breakdown (5-6 commits):

1. **Commit 1:** Setup authentication module structure
   - Create `auth.module.ts`, `auth.service.ts`, `auth.controller.ts`
   - Add basic imports and dependencies
   - Files: `auth.module.ts`, `auth.service.ts` (skeleton)

2. **Commit 2:** User registration endpoint
   - Implement `register()` method
   - Password hashing with bcrypt
   - Create `CreateUserDto`
   - Files: `auth.service.ts`, `auth.controller.ts`, `dto/create-user.dto.ts`

3. **Commit 3:** Login endpoint with JWT
   - Implement `login()` method
   - JWT token generation (access + refresh)
   - Create `LoginDto`
   - Files: `auth.service.ts`, `auth.controller.ts`, `dto/login.dto.ts`, `strategies/jwt.strategy.ts`

4. **Commit 4:** JWT authentication guard
   - Create `JwtAuthGuard`
   - Token validation
   - User extraction from token
   - Files: `guards/jwt-auth.guard.ts`, `strategies/jwt.strategy.ts`

5. **Commit 5:** Token refresh endpoint
   - Implement `refreshToken()` method
   - Token rotation
   - Create `RefreshTokenDto`
   - Files: `auth.service.ts`, `auth.controller.ts`, `dto/refresh-token.dto.ts`

6. **Commit 6:** Logout endpoint with token blacklist
   - Implement `logout()` method
   - Create `TokenBlacklist` entity
   - Token invalidation
   - Files: `auth.service.ts`, `auth.controller.ts`, `entities/token-blacklist.entity.ts`

**Additional Files (if time permits or 7th commit):**
- `entities/failed-login-attempt.entity.ts` - Account lockout tracking
- Account lockout logic in `login()` method

**Total Files:** ~15-16 files

---

## Module 2: User Lifecycle Management - luke
**Assigned to:** Person 2  
**Files:** `backend/src/users/`, `backend/src/auth/entities/email-verification-token.entity.ts`, `backend/src/auth/entities/password-reset-token.entity.ts`

### Commit Breakdown (5-6 commits):

1. **Commit 1:** User entity and repository setup
   - Create `User` entity with all fields
   - Create `users.module.ts`, `users.service.ts`, `users.controller.ts`
   - Files: `users/entities/user.entity.ts`, `users.module.ts`

2. **Commit 2:** User CRUD operations
   - Implement `create()`, `findAll()`, `findOne()`, `update()`, `remove()`
   - Create `CreateUserDto`, `UpdateUserDto`
   - Files: `users.service.ts`, `users.controller.ts`, `dto/*.dto.ts`

3. **Commit 3:** Email verification system
   - Create `EmailVerificationToken` entity
   - Implement email verification flow
   - Update user status on verification
   - Files: `auth/entities/email-verification-token.entity.ts`, `auth/service.ts` (verifyEmail method)

4. **Commit 4:** Password reset flow
   - Create `PasswordResetToken` entity
   - Implement password reset request
   - Implement password reset confirmation
   - Files: `auth/entities/password-reset-token.entity.ts`, `auth/service.ts`, `auth/controller.ts`, `dto/password-reset.dto.ts`

5. **Commit 5:** User status management
   - Add status field to User entity
   - Implement status transitions (pending → active → suspended → deactivated)
   - Update `update()` method to handle status
   - Files: `users/entities/user.entity.ts`, `users/service.ts`

6. **Commit 6:** User deletion with cascade cleanup
   - Implement cascade delete for related records
   - Clean up user_roles, tokens, etc.
   - Files: `users/service.ts` (remove method)

**Additional Files:**
- `users/dto/create-user.dto.ts` - Should reference password strength decorator
- Integration with `common/decorators/password-strength.decorator.ts` (if created separately)

**Total Files:** ~12-13 files

---

## Module 3: Role-Based Access Control (RBAC) - nik
**Assigned to:** Person 3  
**Files:** `backend/src/roles/`, `backend/src/admin/` (role assignment parts)

### Commit Breakdown (5-6 commits):

1. **Commit 1:** Role entity and basic structure
   - Create `Role` entity
   - Create `UserRole` junction entity
   - Create `roles.module.ts`, `roles.service.ts`, `roles.controller.ts`
   - Files: `roles/entities/role.entity.ts`, `roles/entities/user-role.entity.ts`, `roles.module.ts`

2. **Commit 2:** Role CRUD operations
   - Implement `create()`, `findAll()`, `findOne()`, `update()`, `remove()`
   - Create `CreateRoleDto`, `UpdateRoleDto`
   - Files: `roles/service.ts`, `roles/controller.ts`, `dto/*.dto.ts`

3. **Commit 3:** Role assignment system
   - Implement `assignRole()` method
   - Create `AssignRoleDto`
   - User-role relationship management
   - Files: `roles/service.ts`, `roles/controller.ts`, `dto/assign-role.dto.ts`

4. **Commit 4:** Roles guard and decorator
   - Create `RolesGuard` for endpoint protection
   - Create `@Roles()` decorator
   - Implement role checking logic
   - Files: `roles/guards/roles.guard.ts`, `roles/decorators/roles.decorator.ts`

5. **Commit 5:** Permission system
   - Add permissions array to Role entity
   - Permission-based access control
   - Update role DTOs to include permissions
   - Files: `roles/entities/role.entity.ts`, `roles/service.ts`, `dto/*.dto.ts`

6. **Commit 6:** Admin role management endpoints
   - Create admin endpoints for role assignment
   - Bulk role operations
   - Files: `admin/admin.service.ts`, `admin/admin.controller.ts`

**Total Files:** ~15 files

---

## Module 4: OAuth2/OIDC Provider - shane
**Assigned to:** Person 4  
**Files:** `backend/src/oauth/`, `backend/src/jwt/`

### Commit Breakdown (5-6 commits):

1. **Commit 1:** OAuth module structure and JWT key service
   - Create `oauth.module.ts`, `oauth.service.ts`, `oauth.controller.ts`
   - Create `jwt-key.service.ts` for RSA keypair generation
   - Files: `oauth/module.ts`, `jwt/jwt-key.service.ts`, `jwt/jwt.module.ts`

2. **Commit 2:** OAuth2 token endpoint (password grant)
   - Implement `POST /oauth/token` endpoint
   - Handle password grant type
   - Generate access and refresh tokens
   - Files: `oauth/service.ts`, `oauth/controller.ts`

3. **Commit 3:** OAuth2 token endpoint (refresh grant)
   - Implement refresh_token grant type
   - Token rotation
   - Files: `oauth/service.ts` (extend getToken method)

4. **Commit 4:** OpenID Connect userinfo endpoint
   - Implement `GET /oauth/userinfo`
   - Return OIDC-compliant claims
   - Include roles in claims
   - Files: `oauth/service.ts`, `oauth/controller.ts`

5. **Commit 5:** JWKS endpoint and discovery document
   - Implement `GET /.well-known/jwks.json`
   - Implement `GET /.well-known/openid-configuration`
   - Expose public keys for token verification
   - Files: `oauth/service.ts`, `oauth/controller.ts` (WellKnownController)

6. **Commit 6:** Token introspection endpoint
   - Implement `POST /oauth/introspect` (RFC 7662)
   - Token validation and metadata
   - Files: `oauth/service.ts`, `oauth/controller.ts`

**Total Files:** ~8 files

---

## Module 5: Admin Dashboard Backend & Frontend - sohaila
**Assigned to:** Person 5  
**Files:** `backend/src/admin/`, `frontend/src/pages/Users.tsx`, `frontend/src/pages/Roles.tsx`, `frontend/src/pages/Dashboard.tsx`, `frontend/src/pages/AuditLogs.tsx`

### Commit Breakdown (5-6 commits):

1. **Commit 1:** Admin module backend structure
   - Create `admin.module.ts`, `admin.service.ts`, `admin.controller.ts`
   - Admin endpoints for user management
   - Files: `admin/*.ts`

2. **Commit 2:** Admin dashboard frontend layout
   - Create `Layout.tsx` component
   - Navigation sidebar
   - Routing setup
   - Files: `frontend/src/components/Layout.tsx`, `frontend/src/App.tsx`

3. **Commit 3:** Users management page
   - Create `Users.tsx` page
   - User list, create, edit, delete
   - Status management UI
   - Files: `frontend/src/pages/Users.tsx`

4. **Commit 4:** Roles management page
   - Create `Roles.tsx` page
   - Role list, create, edit, delete
   - Permission management UI
   - Files: `frontend/src/pages/Roles.tsx`

5. **Commit 5:** Dashboard and audit logs
   - Create `Dashboard.tsx` with statistics
   - Create `AuditLogs.tsx` for viewing audit history
   - Files: `frontend/src/pages/Dashboard.tsx`, `frontend/src/pages/AuditLogs.tsx`

6. **Commit 6:** Admin API integration and error handling
   - Connect frontend to backend APIs
   - Add error handling and notifications
   - Loading states
   - Files: `frontend/src/services/api.ts`, `frontend/src/components/Notification.tsx`, `frontend/src/hooks/useNotification.ts`, updates to all pages

**Total Files:** ~11 files

---

## Module 6: Public Frontend & Email Service - muadh
**Assigned to:** Person 6  
**Files:** `frontend/src/pages/Login.tsx`, `frontend/src/pages/Register.tsx`, `frontend/src/pages/ForgotPassword.tsx`, `frontend/src/pages/ResetPassword.tsx`, `frontend/src/pages/VerifyEmail.tsx`, `backend/src/email/`, `frontend/src/hooks/useAuth.ts`

### Commit Breakdown (5-6 commits):

1. **Commit 1:** Email service backend
   - Create `email.module.ts`, `email.service.ts`
   - SMTP configuration
   - Basic email sending
   - Files: `backend/src/email/*.ts`

2. **Commit 2:** Email templates
   - Create email templates (verification, password reset, welcome)
   - HTML email formatting
   - Template variables
   - Files: `backend/src/email/email.service.ts` (template methods)

3. **Commit 3:** Login page frontend
   - Create `Login.tsx` page
   - Form validation
   - API integration
   - Files: `frontend/src/pages/Login.tsx`, `frontend/src/hooks/useAuth.ts`

4. **Commit 4:** Registration page frontend
   - Create `Register.tsx` page
   - Password strength validation
   - Form handling
   - Files: `frontend/src/pages/Register.tsx`

5. **Commit 5:** Password reset flow frontend
   - Create `ForgotPassword.tsx` page
   - Create `ResetPassword.tsx` page
   - Token handling
   - Files: `frontend/src/pages/ForgotPassword.tsx`, `frontend/src/pages/ResetPassword.tsx`

6. **Commit 6:** Email verification page
   - Create `VerifyEmail.tsx` page
   - Token verification
   - Success/error handling
   - Files: `frontend/src/pages/VerifyEmail.tsx`, update `App.tsx` routes

**Total Files:** ~10 files

---

## Additional Shared Files (Commit by Team Lead or Rotate)

These files need to be committed but can be done by whoever sets up the project:

1. **Project Setup:**
   - `package.json` files
   - `tsconfig.json` files
   - `docker-compose.yml`
   - `.env.example`
   - `README.md`

2. **Database Module:**
   - `backend/src/database/database.module.ts`
   - `backend/src/database/data-source.ts`
   - Database migrations

3. **Common Utilities:**
   - `backend/src/common/logger/` (LoggerModule, LoggerService)
   - `backend/src/common/decorators/password-strength.decorator.ts`
   - `backend/src/health/` (HealthModule, HealthController, HealthService)

4. **Security & Middleware:**
   - `backend/src/main.ts` (Helmet, CORS, validation, Swagger setup)
   - `backend/src/app.controller.ts` (Root endpoint)
   - `backend/src/app.module.ts` (Module imports and configuration)
   - Rate limiting configuration
   - Security headers

5. **Audit Module:**
   - `backend/src/audit/audit.module.ts`
   - `backend/src/audit/audit.service.ts`
   - `backend/src/audit/entities/audit-log.entity.ts`
   - Used by all modules for logging actions
   - **Note:** Can be assigned to Module 1 (Auth) person as it's foundational, or split across modules as they integrate it

6. **Redis Module (Optional):**
   - `backend/src/redis/redis.module.ts`
   - `backend/src/redis/redis.service.ts`
   - Optional enhancement for caching/rate limiting

---

## Commit Strategy Tips

### For Each Person:

1. **Start with skeleton/structure** (Commit 1)
   - Create files with basic structure
   - Add imports and dependencies
   - No functionality yet

2. **Add core functionality** (Commits 2-4)
   - Implement main features incrementally
   - One feature per commit
   - Test as you go

3. **Add enhancements** (Commits 5-6)
   - Error handling
   - Validation
   - Edge cases
   - Polish

### Commit Message Format:
```
feat(module-name): brief description

- Detail 1
- Detail 2
- Detail 3
```

**Example:**
```
feat(auth): implement user registration endpoint

- Add register() method to AuthService
- Create CreateUserDto with validation
- Hash passwords using bcrypt
- Return user object on success
```

---

## Module Dependencies

**Order of Development:**
1. **Module 1 (Auth)** - Foundation, needed by others
2. **Module 2 (Users)** - Depends on Module 1
3. **Module 3 (RBAC)** - Depends on Module 1 & 2
4. **Module 4 (OAuth)** - Depends on Module 1 & 3
5. **Module 5 (Admin)** - Depends on Modules 1, 2, 3
6. **Module 6 (Public Frontend)** - Depends on Module 1 & 2

**Note:** People can work in parallel, but should coordinate on shared interfaces (DTOs, entities).

---

## File Distribution Summary

| Module | Person | Backend Files | Frontend Files | Total |
|--------|--------|---------------|----------------|-------|
| 1. Auth | darren | ~12-16 | 0 | ~12-16 |
| 2. Users | luke | ~12-13 | 0 | ~12-13 |
| 3. RBAC | nik | ~12 | 0 | ~12 |
| 4. OAuth | shane | ~6 | 0 | ~6 |
| 5. Admin | sohaila | ~3 | ~8 | ~11 |
| 6. Public Frontend | muadh | ~2 | ~8 | ~10 |

**Total:** ~60-68 files across 6 modules

**Additional Shared Files (not counted above):**
- Audit Module: ~3 files (used by all modules)
- Health Module: ~3 files
- Logger Module: ~2 files
- Common Decorators: ~1 file
- Database Module: ~3 files
- App Module/Controller: ~2 files
- Redis Module: ~2 files (optional)

**Grand Total:** ~76-80 files in entire project

---

## Git Workflow Recommendation

1. **Create feature branches:**
   - `feature/person1-auth-module`
   - `feature/person2-users-module`
   - etc.

2. **Each person makes 5-6 commits on their branch**

3. **Review and merge:**
   - Code review each module
   - Merge to `develop` branch
   - Resolve conflicts

4. **Final integration:**
   - Merge `develop` to `main`
   - Test full system

---

*This plan ensures equal distribution of work and clear ownership of modules!*

