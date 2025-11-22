#!/bin/bash
# Quick API test script - one-line commands

BASE_URL="http://localhost:3000/api/v1"

echo "=== CSIS IAM API Tests ==="
echo ""

# Test 1: Register user
echo "1. Registering user..."
REGISTER_RESPONSE=$(curl -s -X POST $BASE_URL/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@csis.edu","password":"Test123!","displayName":"Test User","department":"CS"}')
echo "$REGISTER_RESPONSE" | jq .
USER_ID=$(echo "$REGISTER_RESPONSE" | jq -r '.id')
echo ""

# Test 2: Login (will fail if user not activated)
echo "2. Attempting login (should fail if user not active)..."
LOGIN_RESPONSE=$(curl -s -X POST $BASE_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@csis.edu","password":"Test123!"}')
echo "$LOGIN_RESPONSE" | jq .
echo ""

# Test 3: Get roles
echo "3. Getting roles..."
curl -s -X GET $BASE_URL/roles | jq .
echo ""

echo "=== Tests Complete ==="
echo "Note: Activate user in database to test login"

