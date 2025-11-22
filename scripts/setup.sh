#!/bin/bash

echo "🚀 Setting up CSIS IAM Service..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Start Keycloak and PostgreSQL
echo "📦 Starting Docker containers..."
docker compose up -d

echo "⏳ Waiting for services to be ready..."
sleep 10

# Install backend dependencies
echo "📥 Installing backend dependencies..."
cd backend
if [ ! -d "node_modules" ]; then
    npm install
fi

# Install frontend dependencies
echo "📥 Installing frontend dependencies..."
cd ../frontend
if [ ! -d "node_modules" ]; then
    npm install
fi

cd ..

echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Configure Keycloak:"
echo "   - Visit http://localhost:8080/admin"
echo "   - Login: admin / admin"
echo "   - Create realm: CSIS"
echo "   - Create roles: admin, staff, student, developer"
echo "   - Create OAuth client: csis-iam-api"
echo ""
echo "2. Configure backend:"
echo "   - Copy backend/.env.example to backend/.env"
echo "   - Update KEYCLOAK_CLIENT_SECRET with your client secret"
echo ""
echo "3. Start services:"
echo "   - Backend: cd backend && npm run start:dev"
echo "   - Frontend: cd frontend && npm run dev"
echo ""
echo "4. Access:"
echo "   - API: http://localhost:3000"
echo "   - Swagger: http://localhost:3000/api"
echo "   - Admin UI: http://localhost:5173"

