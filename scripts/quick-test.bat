@echo off
REM Quick testing script - runs common tests
echo ========================================
echo CSIS IAM Quick Test Suite
echo ========================================
echo.

echo 1. Testing Health Endpoint...
curl -s http://localhost:3000/api/v1/health
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Backend is not running!
    echo Start it with: cd backend ^&^& npm run start:dev
    pause
    exit /b 1
)
echo.
echo.

echo 2. Testing OAuth Endpoints...
cd backend
if exist test-oauth.js (
    node test-oauth.js
) else (
    echo OAuth test script not found
)
echo.
echo.

echo 3. Database Status...
docker exec iam-postgres-api psql -U iam -d iam -c "SELECT COUNT(*) as user_count FROM users; SELECT COUNT(*) as role_count FROM roles;" 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo WARNING: Could not connect to database
)
echo.
echo.

echo ========================================
echo Quick Test Complete!
echo ========================================
echo.
echo For more comprehensive testing:
echo - Swagger UI: http://localhost:3000/api
echo - Admin UI: http://localhost:5173
echo - Run E2E tests: cd backend ^&^& npm run test:e2e
echo.
pause

