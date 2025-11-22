# PowerShell Script to Create Team Member
# Usage: .\create-team-member.ps1 -Email "john@csis.edu" -DisplayName "John Doe" -Password "SecurePass123!"

param(
    [Parameter(Mandatory=$true)]
    [string]$Email,
    
    [Parameter(Mandatory=$true)]
    [string]$DisplayName,
    
    [Parameter(Mandatory=$true)]
    [string]$Password,
    
    [string]$Department = "CS",
    [string]$Role = "admin"
)

Write-Host "=== Creating Team Member ===" -ForegroundColor Cyan
Write-Host "Email: $Email" -ForegroundColor Yellow
Write-Host "Display Name: $DisplayName" -ForegroundColor Yellow
Write-Host ""

# Step 1: Create user in IAM database via API
Write-Host "1. Creating user in IAM database..." -ForegroundColor Green

# First, get admin token (you'll need to login first)
Write-Host "   Note: You need to login as admin first to get a token" -ForegroundColor Yellow
Write-Host "   Run: curl -X POST http://localhost:3000/api/v1/auth/login -H 'Content-Type: application/json' -d '{\"email\":\"admin@csis.edu\",\"password\":\"YOUR_PASSWORD\"}'" -ForegroundColor Gray
Write-Host "   Then update this script with the token" -ForegroundColor Yellow
Write-Host ""

# For now, create via SQL
Write-Host "   Creating via SQL..." -ForegroundColor Yellow

# Hash password (you'll need to generate this separately)
Write-Host "   Generating password hash..." -ForegroundColor Yellow
$passwordHash = docker exec iam-postgres-api psql -U iam -d iam -t -c "SELECT crypt('$Password', gen_salt('bf'));" | Out-String | ForEach-Object { $_.Trim() }

# Create user
$userId = docker exec iam-postgres-api psql -U iam -d iam -t -c "INSERT INTO users (id, email, password_hash, display_name, department, status, created_at, updated_at) VALUES (gen_random_uuid(), '$Email', '$passwordHash', '$DisplayName', '$Department', 'active', NOW(), NOW()) RETURNING id;" | Out-String | ForEach-Object { $_.Trim() }

Write-Host "   User created with ID: $userId" -ForegroundColor Green

# Step 2: Assign admin role
Write-Host "2. Assigning $Role role..." -ForegroundColor Green

$roleId = docker exec iam-postgres-api psql -U iam -d iam -t -c "SELECT id FROM roles WHERE name = '$Role';" | Out-String | ForEach-Object { $_.Trim() }
$adminId = docker exec iam-postgres-api psql -U iam -d iam -t -c "SELECT id FROM users WHERE email = 'admin@csis.edu';" | Out-String | ForEach-Object { $_.Trim() }

docker exec iam-postgres-api psql -U iam -d iam -c "INSERT INTO user_roles (id, user_id, role_id, granted_by, granted_at) VALUES (gen_random_uuid(), '$userId', '$roleId', '$adminId', NOW()) ON CONFLICT DO NOTHING;"

Write-Host "   Role assigned successfully" -ForegroundColor Green

Write-Host ""
Write-Host "=== Team Member Created ===" -ForegroundColor Cyan
Write-Host "Email: $Email" -ForegroundColor White
Write-Host "Password: $Password" -ForegroundColor White
Write-Host "Role: $Role" -ForegroundColor White
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Create user in Keycloak Admin Console (http://localhost:8080/admin)" -ForegroundColor Gray
Write-Host "2. Assign admin role in Keycloak" -ForegroundColor Gray
Write-Host "3. Share credentials securely with team member" -ForegroundColor Gray
Write-Host ""

