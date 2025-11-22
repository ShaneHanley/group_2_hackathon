/**
 * Simple OAuth Endpoints Test Script
 * 
 * Usage: node test-oauth.js
 * 
 * Prerequisites:
 * - Backend running on http://localhost:3000
 * - A test user created (email: test@csis.edu, password: Test123!)
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000/api/v1';
const TEST_USER = {
  email: 'test@csis.edu',
  password: 'Test123!'
};

function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });
    
    req.on('error', reject);
    if (data) {
      req.write(data);
    }
    req.end();
  });
}

async function testOAuthEndpoints() {
  console.log('🧪 Testing OAuth Endpoints...\n');

  try {
    // Test 1: Password Grant
    console.log('Test 1: OAuth2 Password Grant');
    const tokenOptions = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/v1/oauth/token',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    };
    
    const tokenParams = new URLSearchParams({
      grant_type: 'password',
      username: TEST_USER.email,
      password: TEST_USER.password,
      scope: 'openid profile email'
    });
    
    const tokenResponse = await makeRequest(tokenOptions, tokenParams.toString());
    
    if (tokenResponse.status === 200 && tokenResponse.data.access_token) {
      console.log('✅ Token issued successfully');
      console.log(`   Access Token: ${tokenResponse.data.access_token.substring(0, 30)}...`);
      console.log(`   Token Type: ${tokenResponse.data.token_type}`);
      console.log(`   Expires In: ${tokenResponse.data.expires_in}s\n`);
      
      const accessToken = tokenResponse.data.access_token;
      
      // Test 2: UserInfo
      console.log('Test 2: UserInfo Endpoint');
      const userInfoOptions = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/v1/oauth/userinfo',
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      };
      
      const userInfoResponse = await makeRequest(userInfoOptions);
      
      if (userInfoResponse.status === 200) {
        console.log('✅ UserInfo retrieved successfully');
        console.log(`   Email: ${userInfoResponse.data.email}`);
        console.log(`   Roles: ${userInfoResponse.data.csis_roles?.join(', ') || 'none'}\n`);
      } else {
        console.log(`❌ UserInfo failed: ${userInfoResponse.status}`);
        console.log(`   Response: ${JSON.stringify(userInfoResponse.data)}\n`);
      }
      
      // Test 3: Token Introspection
      console.log('Test 3: Token Introspection');
      const introspectOptions = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/v1/oauth/introspect',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      };
      
      const introspectData = JSON.stringify({ token: accessToken });
      const introspectResponse = await makeRequest(introspectOptions, introspectData);
      
      if (introspectResponse.status === 200 && introspectResponse.data.active) {
        console.log('✅ Token introspection successful');
        console.log(`   Active: ${introspectResponse.data.active}`);
        console.log(`   Email: ${introspectResponse.data.email}\n`);
      } else {
        console.log(`❌ Introspection failed: ${introspectResponse.status}\n`);
      }
      
    } else {
      console.log(`❌ Token issuance failed: ${tokenResponse.status}`);
      console.log(`   Response: ${JSON.stringify(tokenResponse.data)}\n`);
      console.log('💡 Make sure:');
      console.log('   1. Backend is running on http://localhost:3000');
      console.log(`   2. User ${TEST_USER.email} exists and is active`);
      console.log(`   3. Password is correct: ${TEST_USER.password}`);
      return;
    }
    
    // Test 4: OIDC Discovery
    console.log('Test 4: OpenID Connect Discovery');
    const discoveryOptions = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/v1/.well-known/openid-configuration',
      method: 'GET',
    };
    
    const discoveryResponse = await makeRequest(discoveryOptions);
    
    if (discoveryResponse.status === 200 && discoveryResponse.data.issuer) {
      console.log('✅ OIDC Discovery successful');
      console.log(`   Issuer: ${discoveryResponse.data.issuer}`);
      console.log(`   Token Endpoint: ${discoveryResponse.data.token_endpoint}\n`);
    } else {
      console.log(`❌ Discovery failed: ${discoveryResponse.status}\n`);
    }
    
    // Test 5: JWKS
    console.log('Test 5: JWKS (JSON Web Key Set)');
    const jwksOptions = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/v1/.well-known/jwks.json',
      method: 'GET',
    };
    
    const jwksResponse = await makeRequest(jwksOptions);
    
    if (jwksResponse.status === 200 && jwksResponse.data.keys) {
      console.log('✅ JWKS retrieved successfully');
      console.log(`   Keys: ${jwksResponse.data.keys.length}`);
      if (jwksResponse.data.keys.length > 0) {
        console.log(`   Algorithm: ${jwksResponse.data.keys[0].alg}`);
        console.log(`   Key ID: ${jwksResponse.data.keys[0].kid}\n`);
      }
    } else {
      console.log(`❌ JWKS failed: ${jwksResponse.status}`);
      console.log(`   Response: ${JSON.stringify(jwksResponse.data)}\n`);
      console.log('💡 Note: JWKS may be empty if RSA keys haven\'t been generated yet.');
      console.log('   The keys will be generated automatically on first backend startup.\n');
    }
    
    console.log('✅ All OAuth endpoint tests completed!');
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
    console.error('\n💡 Make sure the backend is running:');
    console.error('   cd backend && npm run start:dev');
  }
}

// Run tests
testOAuthEndpoints();

