# Quick API test script for PowerShell - one-line commands

$BASE_URL = "http://localhost:3000/api/v1"

Write-Host "=== CSIS IAM API Tests ===" -ForegroundColor Green
Write-Host ""

# Test 1: Register user
Write-Host "1. Registering user..." -ForegroundColor Yellow
$registerBody = @{
    email = "test@csis.edu"
    password = "Test123!"
    displayName = "Test User"
    department = "CS"
} | ConvertTo-Json

$registerResponse = Invoke-RestMethod -Uri "$BASE_URL/auth/register" -Method Post -Body $registerBody -ContentType "application/json"
$registerResponse | ConvertTo-Json -Depth 5
$userId = $registerResponse.id
Write-Host ""

# Test 2: Login (will fail if user not activated)
Write-Host "2. Attempting login (should fail if user not active)..." -ForegroundColor Yellow
$loginBody = @{
    email = "test@csis.edu"
    password = "Test123!"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$BASE_URL/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    $loginResponse | ConvertTo-Json -Depth 5
} catch {
    Write-Host "Login failed (expected if user not activated): $_" -ForegroundColor Red
}
Write-Host ""

# Test 3: Get roles
Write-Host "3. Getting roles..." -ForegroundColor Yellow
try {
    $rolesResponse = Invoke-RestMethod -Uri "$BASE_URL/roles" -Method Get
    $rolesResponse | ConvertTo-Json -Depth 5
} catch {
    Write-Host "Failed to get roles: $_" -ForegroundColor Red
}
Write-Host ""

Write-Host "=== Tests Complete ===" -ForegroundColor Green
Write-Host "Note: Activate user in database to test login" -ForegroundColor Cyan

