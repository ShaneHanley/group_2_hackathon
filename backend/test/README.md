# Testing Guide

## Test Commands

### Run all tests
```bash
npm run test:all
```

### Run unit tests only
```bash
npm run test:unit
```

### Run E2E tests only
```bash
npm run test:e2e
```

### Run tests in watch mode
```bash
npm run test:watch
```

### Run tests with coverage
```bash
npm run test:cov
```

## Test Structure

### Unit Tests (`*.spec.ts`)
- Located in `src/` directories alongside source files
- Test individual services, controllers, and utilities
- Use mocks for dependencies
- Example: `src/auth/auth.service.spec.ts`

### E2E Tests (`*.e2e-spec.ts`)
- Located in `test/` directory
- Test complete API endpoints
- Use real database (test database)
- Example: `test/auth.e2e-spec.ts`

## Running Tests

### Prerequisites
1. Make sure PostgreSQL is running (or use test database)
2. Set up test environment variables in `.env.test`

### Quick Test Commands (One Line)

**Unit tests:**
```bash
npm run test:unit
```

**E2E tests:**
```bash
npm run test:e2e
```

**All tests:**
```bash
npm run test:all
```

**With coverage:**
```bash
npm run test:cov
```

## Test Coverage Goals

- Unit tests: 80%+ coverage
- E2E tests: Cover all critical user flows
- Integration tests: Test API endpoints

## Writing New Tests

### Unit Test Example
```typescript
describe('MyService', () => {
  it('should do something', () => {
    // Test implementation
  });
});
```

### E2E Test Example
```typescript
describe('POST /api/v1/endpoint', () => {
  it('should return 200', () => {
    return request(app.getHttpServer())
      .post('/api/v1/endpoint')
      .send({ data: 'test' })
      .expect(200);
  });
});
```

