# Quick Test Commands

## One-Line Commands

### Run All Tests
```bash
npm run test:all
```

### Run Unit Tests Only
```bash
npm run test:unit
```

### Run E2E Tests Only
```bash
npm run test:e2e
```

### Run Tests with Coverage
```bash
npm run test:cov
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

## Individual Test Files

### Run Specific Test File
```bash
npm test -- auth.service.spec.ts
```

### Run Tests Matching Pattern
```bash
npm test -- --testNamePattern="should login"
```

## E2E Test Setup

Before running E2E tests, ensure:
1. Database is running: `docker compose up -d postgres-iam`
2. Test database exists (or tests will create it)
3. Environment variables are set

## Quick Test Examples

**Test authentication flow:**
```bash
npm run test:e2e -- auth.e2e-spec.ts
```

**Test roles:**
```bash
npm run test:e2e -- roles.e2e-spec.ts
```

**Test auth service unit tests:**
```bash
npm test -- auth.service.spec.ts
```

