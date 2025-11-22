# PowerShell setup script for Windows

Write-Host "🚀 Setting up CSIS IAM Service..." -ForegroundColor Green

# Check if Docker is running
try {
    docker info | Out-Null
} catch {
    Write-Host "❌ Docker is not running. Please start Docker and try again." -ForegroundColor Red
    exit 1
}

# Start Keycloak and PostgreSQL
Write-Host "📦 Starting Docker containers..." -ForegroundColor Yellow
docker compose up -d

Write-Host "⏳ Waiting for services to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Install backend dependencies
Write-Host "📥 Installing backend dependencies..." -ForegroundColor Yellow
Set-Location backend
if (-not (Test-Path "node_modules")) {
    npm install
}

# Install frontend dependencies
Write-Host "📥 Installing frontend dependencies..." -ForegroundColor Yellow
Set-Location ../frontend
if (-not (Test-Path "node_modules")) {
    npm install
}

Set-Location ..

Write-Host "✅ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Configure Keycloak:"
Write-Host "   - Visit http://localhost:8080/admin"
Write-Host "   - Login: admin / admin"
Write-Host "   - Create realm: CSIS"
Write-Host "   - Create roles: admin, staff, student, developer"
Write-Host "   - Create OAuth client: csis-iam-api"
Write-Host ""
Write-Host "2. Configure backend:"
Write-Host "   - Copy backend/.env.example to backend/.env"
Write-Host "   - Update KEYCLOAK_CLIENT_SECRET with your client secret"
Write-Host ""
Write-Host "3. Start services:"
Write-Host "   - Backend: cd backend && npm run start:dev"
Write-Host "   - Frontend: cd frontend && npm run dev"
Write-Host ""
Write-Host "4. Access:"
Write-Host "   - API: http://localhost:3000"
Write-Host "   - Swagger: http://localhost:3000/api"
Write-Host "   - Admin UI: http://localhost:5173"

