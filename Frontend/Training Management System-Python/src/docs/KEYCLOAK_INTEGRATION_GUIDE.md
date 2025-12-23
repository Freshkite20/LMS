# Keycloak Integration Guide

## Table of Contents
1. [Setup Overview](#setup-overview)
2. [Keycloak Configuration](#keycloak-configuration)
3. [Frontend Integration](#frontend-integration)
4. [Backend Integration](#backend-integration)
5. [User Management](#user-management)

---

## Setup Overview

### Architecture
```
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│   Frontend   │────────▶│   Keycloak   │◀────────│   Backend    │
│   (React)    │         │    Server    │         │   API        │
└──────────────┘         └──────────────┘         └──────────────┘
      │                                                    │
      │                                                    │
      └────────────────────────────────────────────────────┘
                    Direct API calls with JWT
```

---

## Keycloak Configuration

### 1. Create Realm

```bash
# Realm Name: tms (Training Management System)
# Display Name: Training Management System
```

**Realm Settings:**
```json
{
  "realm": "tms",
  "enabled": true,
  "sslRequired": "external",
  "registrationAllowed": false,
  "loginWithEmailAllowed": true,
  "duplicateEmailsAllowed": false,
  "resetPasswordAllowed": true,
  "editUsernameAllowed": false,
  "bruteForceProtected": true,
  "permanentLockout": false,
  "maxFailureWaitSeconds": 900,
  "minimumQuickLoginWaitSeconds": 60,
  "waitIncrementSeconds": 60,
  "quickLoginCheckMilliSeconds": 1000,
  "maxDeltaTimeSeconds": 43200,
  "failureFactor": 5
}
```

### 2. Create Client

**Client ID:** `tms-frontend`

```json
{
  "clientId": "tms-frontend",
  "enabled": true,
  "protocol": "openid-connect",
  "publicClient": true,
  "redirectUris": [
    "http://localhost:3000/*",
    "https://tms.example.com/*"
  ],
  "webOrigins": [
    "http://localhost:3000",
    "https://tms.example.com"
  ],
  "directAccessGrantsEnabled": true,
  "standardFlowEnabled": true,
  "implicitFlowEnabled": false,
  "attributes": {
    "pkce.code.challenge.method": "S256"
  }
}
```

**Client ID:** `tms-backend` (for admin operations)

```json
{
  "clientId": "tms-backend",
  "enabled": true,
  "protocol": "openid-connect",
  "publicClient": false,
  "serviceAccountsEnabled": true,
  "authorizationServicesEnabled": false,
  "clientAuthenticatorType": "client-secret",
  "secret": "YOUR_CLIENT_SECRET_HERE"
}
```

### 3. Create Roles

**Realm Roles:**
```json
[
  {
    "name": "admin",
    "description": "Administrator role with full system access"
  },
  {
    "name": "student",
    "description": "Student role with limited access"
  }
]
```

### 4. Create User Attributes

Add custom attributes for users:
- `studentId` (optional for students)
- `batchId` (optional for batch assignment)
- `employeeId` (optional for admins)

### 5. Password Policy

```
# Password Policy Configuration
Minimum Length: 8
Require Uppercase: 1
Require Lowercase: 1
Require Digit: 1
Require Special Character: 1
Not Username
Not Email
Expire Password: 90 days
```

---

## Frontend Integration

### Install Keycloak JS Adapter

```bash
npm install keycloak-js
```

### Create Keycloak Service

**File: `/services/keycloak.ts`**

```typescript
import Keycloak from 'keycloak-js';

// Keycloak configuration
const keycloakConfig = {
  url: 'https://keycloak.example.com/auth',
  realm: 'tms',
  clientId: 'tms-frontend'
};

// Initialize Keycloak instance
const keycloak = new Keycloak(keycloakConfig);

// Initialize Keycloak
export const initKeycloak = async (): Promise<boolean> => {
  try {
    const authenticated = await keycloak.init({
      onLoad: 'check-sso',
      silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html',
      pkceMethod: 'S256',
      checkLoginIframe: false
    });

    if (authenticated) {
      console.log('User is authenticated');
      
      // Setup token refresh
      setupTokenRefresh();
    }

    return authenticated;
  } catch (error) {
    console.error('Failed to initialize Keycloak:', error);
    return false;
  }
};

// Setup automatic token refresh
const setupTokenRefresh = () => {
  // Refresh token every 5 minutes
  setInterval(() => {
    keycloak.updateToken(70).then((refreshed) => {
      if (refreshed) {
        console.log('Token refreshed');
      }
    }).catch(() => {
      console.error('Failed to refresh token');
      keycloak.login();
    });
  }, 300000); // 5 minutes
};

// Login
export const login = () => {
  keycloak.login({
    redirectUri: window.location.origin + '/dashboard'
  });
};

// Logout
export const logout = () => {
  keycloak.logout({
    redirectUri: window.location.origin
  });
};

// Get token
export const getToken = (): string | undefined => {
  return keycloak.token;
};

// Get user info
export const getUserInfo = () => {
  return keycloak.tokenParsed;
};

// Check if user has role
export const hasRole = (role: string): boolean => {
  return keycloak.hasRealmRole(role);
};

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  return keycloak.authenticated || false;
};

export default keycloak;
```

### Update App.tsx to Use Keycloak

```typescript
import { useState, useEffect } from 'react';
import { initKeycloak, login, logout, getToken, getUserInfo, hasRole } from './services/keycloak';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    initKeycloak().then((authenticated) => {
      setIsAuthenticated(authenticated);
      
      if (authenticated) {
        const userInfo = getUserInfo();
        setUser({
          id: userInfo?.sub,
          name: userInfo?.name,
          email: userInfo?.email,
          role: hasRole('admin') ? 'admin' : 'student'
        });
      }
      
      setIsLoading(false);
    });
  }, []);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <LoginPage onLogin={login} />;
  }

  // Rest of your app...
}
```

### Create API Client with Token Injection

**File: `/services/api.ts`**

```typescript
import { getToken } from './keycloak';

const API_BASE_URL = 'https://api.tms.example.com/v1';

export class ApiClient {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = getToken();
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'API request failed');
    }

    return response.json();
  }

  // Student endpoints
  async getStudentCourses(studentId: string) {
    return this.request(`/students/${studentId}/courses`);
  }

  async updateSectionProgress(sectionId: string, data: any) {
    return this.request(`/progress/sections/${sectionId}/complete`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // Course endpoints
  async getCourse(courseId: string) {
    return this.request(`/courses/${courseId}?includeSections=true`);
  }

  // Test endpoints
  async getTest(testId: string) {
    return this.request(`/tests/${testId}?includeQuestions=true`);
  }

  async submitTest(testId: string, data: any) {
    return this.request(`/tests/${testId}/submit`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
}

export const apiClient = new ApiClient();
```

---

## Backend Integration

### Node.js/Express Example

#### Install Dependencies

```bash
npm install keycloak-connect express-session
```

#### Setup Keycloak Middleware

**File: `middleware/keycloak.js`**

```javascript
const session = require('express-session');
const Keycloak = require('keycloak-connect');

// Session store (use Redis in production)
const memoryStore = new session.MemoryStore();

// Keycloak configuration
const keycloakConfig = {
  realm: 'tms',
  'auth-server-url': 'https://keycloak.example.com/auth',
  'ssl-required': 'external',
  resource: 'tms-backend',
  credentials: {
    secret: process.env.KEYCLOAK_CLIENT_SECRET
  },
  'confidential-port': 0
};

// Initialize Keycloak
const keycloak = new Keycloak({ store: memoryStore }, keycloakConfig);

module.exports = {
  keycloak,
  memoryStore,
  
  // Protect route - requires authentication
  protect: keycloak.protect(),
  
  // Protect route - requires specific role
  protectWithRole: (role) => keycloak.protect(`realm:${role}`)
};
```

#### Setup Express App

**File: `server.js`**

```javascript
const express = require('express');
const session = require('express-session');
const { keycloak, memoryStore, protect, protectWithRole } = require('./middleware/keycloak');

const app = express();

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  store: memoryStore
}));

// Initialize Keycloak
app.use(keycloak.middleware());

// Public routes
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Protected routes - any authenticated user
app.get('/api/v1/profile', protect, (req, res) => {
  res.json({
    user: req.kauth.grant.access_token.content
  });
});

// Admin only routes
app.post('/api/v1/students/enroll', protectWithRole('admin'), async (req, res) => {
  // Enroll student logic
});

app.get('/api/v1/admin/dashboard', protectWithRole('admin'), async (req, res) => {
  // Admin dashboard logic
});

// Student routes
app.get('/api/v1/students/:id/courses', protect, async (req, res) => {
  // Verify student can only access their own data
  const userId = req.kauth.grant.access_token.content.sub;
  const requestedId = req.params.id;
  
  // Check if user is admin or accessing their own data
  const isAdmin = req.kauth.grant.access_token.content.realm_access.roles.includes('admin');
  
  if (!isAdmin && userId !== requestedId) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  
  // Get courses logic
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

#### Token Verification (Manual)

**File: `middleware/auth.js`**

```javascript
const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');

const client = jwksClient({
  jwksUri: 'https://keycloak.example.com/auth/realms/tms/protocol/openid-connect/certs'
});

function getKey(header, callback) {
  client.getSigningKey(header.kid, (err, key) => {
    if (err) {
      callback(err);
    } else {
      const signingKey = key.publicKey || key.rsaPublicKey;
      callback(null, signingKey);
    }
  });
}

const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  jwt.verify(token, getKey, {
    audience: 'tms-backend',
    issuer: 'https://keycloak.example.com/auth/realms/tms',
    algorithms: ['RS256']
  }, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    req.user = decoded;
    next();
  });
};

const requireRole = (role) => {
  return (req, res, next) => {
    if (!req.user.realm_access?.roles?.includes(role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};

module.exports = { verifyToken, requireRole };
```

---

## User Management

### Admin Operations via Keycloak Admin API

#### Get Admin Access Token

```javascript
const axios = require('axios');

async function getAdminToken() {
  const response = await axios.post(
    'https://keycloak.example.com/auth/realms/master/protocol/openid-connect/token',
    new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: 'tms-backend',
      client_secret: process.env.KEYCLOAK_CLIENT_SECRET
    }),
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    }
  );
  
  return response.data.access_token;
}
```

#### Create User

```javascript
const axios = require('axios');

async function createUser(userData) {
  const adminToken = await getAdminToken();
  
  const response = await axios.post(
    'https://keycloak.example.com/auth/admin/realms/tms/users',
    {
      username: userData.email,
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      enabled: true,
      emailVerified: false,
      credentials: [
        {
          type: 'password',
          value: userData.temporaryPassword,
          temporary: true
        }
      ],
      realmRoles: [userData.role],
      attributes: {
        studentId: userData.studentId ? [userData.studentId] : [],
        batchId: userData.batchId ? [userData.batchId] : []
      }
    },
    {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    }
  );
  
  // Extract user ID from Location header
  const userId = response.headers.location.split('/').pop();
  return userId;
}
```

#### Generate Temporary Password

```javascript
function generateTemporaryPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789@#$';
  let password = '';
  
  // Ensure at least one of each required character type
  password += chars.charAt(Math.floor(Math.random() * 26)); // Uppercase
  password += chars.charAt(26 + Math.floor(Math.random() * 26)); // Lowercase
  password += chars.charAt(52 + Math.floor(Math.random() * 10)); // Digit
  password += chars.charAt(62 + Math.floor(Math.random() * 3)); // Special
  
  // Fill remaining characters
  for (let i = 4; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  // Shuffle password
  return password.split('').sort(() => Math.random() - 0.5).join('');
}
```

#### Reset User Password

```javascript
async function resetUserPassword(keycloakUserId, newPassword) {
  const adminToken = await getAdminToken();
  
  await axios.put(
    `https://keycloak.example.com/auth/admin/realms/tms/users/${keycloakUserId}/reset-password`,
    {
      type: 'password',
      value: newPassword,
      temporary: true
    },
    {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    }
  );
}
```

#### Update User Attributes

```javascript
async function updateUserAttributes(keycloakUserId, attributes) {
  const adminToken = await getAdminToken();
  
  // First, get current user data
  const userResponse = await axios.get(
    `https://keycloak.example.com/auth/admin/realms/tms/users/${keycloakUserId}`,
    {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    }
  );
  
  const user = userResponse.data;
  
  // Update attributes
  await axios.put(
    `https://keycloak.example.com/auth/admin/realms/tms/users/${keycloakUserId}`,
    {
      ...user,
      attributes: {
        ...user.attributes,
        ...attributes
      }
    },
    {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    }
  );
}
```

#### Assign Role to User

```javascript
async function assignRoleToUser(keycloakUserId, roleName) {
  const adminToken = await getAdminToken();
  
  // Get role representation
  const rolesResponse = await axios.get(
    `https://keycloak.example.com/auth/admin/realms/tms/roles/${roleName}`,
    {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    }
  );
  
  const role = rolesResponse.data;
  
  // Assign role to user
  await axios.post(
    `https://keycloak.example.com/auth/admin/realms/tms/users/${keycloakUserId}/role-mappings/realm`,
    [role],
    {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    }
  );
}
```

---

## Complete Student Enrollment Flow

```javascript
const { createUser, generateTemporaryPassword, assignRoleToUser } = require('./keycloak-admin');
const { sendWelcomeEmail } = require('./email-service');
const db = require('./database');

async function enrollStudent(studentData) {
  try {
    // 1. Generate temporary password
    const temporaryPassword = generateTemporaryPassword();
    
    // 2. Create user in Keycloak
    const keycloakUserId = await createUser({
      email: studentData.email,
      firstName: studentData.firstName,
      lastName: studentData.lastName,
      temporaryPassword: temporaryPassword,
      role: 'student'
    });
    
    // 3. Store user in database
    const dbUser = await db.query(
      `INSERT INTO users (keycloak_id, email, first_name, last_name, role, phone)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [keycloakUserId, studentData.email, studentData.firstName, 
       studentData.lastName, 'student', studentData.phone]
    );
    
    const userId = dbUser.rows[0].id;
    
    // 4. Assign to batch if provided
    if (studentData.batchId) {
      await db.query(
        `INSERT INTO student_batches (student_id, batch_id)
         VALUES ($1, $2)`,
        [userId, studentData.batchId]
      );
      
      // Update Keycloak attributes
      await updateUserAttributes(keycloakUserId, {
        studentId: [userId],
        batchId: [studentData.batchId]
      });
    }
    
    // 5. Send welcome email
    await sendWelcomeEmail({
      to: studentData.email,
      firstName: studentData.firstName,
      temporaryPassword: temporaryPassword,
      loginUrl: process.env.APP_URL + '/login'
    });
    
    return {
      userId,
      keycloakId: keycloakUserId,
      temporaryPassword,
      email: studentData.email
    };
  } catch (error) {
    console.error('Error enrolling student:', error);
    throw error;
  }
}

module.exports = { enrollStudent };
```

---

## Environment Variables

```bash
# Keycloak Configuration
KEYCLOAK_URL=https://keycloak.example.com/auth
KEYCLOAK_REALM=tms
KEYCLOAK_CLIENT_ID=tms-backend
KEYCLOAK_CLIENT_SECRET=your-secret-here

# Application
APP_URL=https://tms.example.com
SESSION_SECRET=your-session-secret-here

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/tms

# Email
EMAIL_SERVICE=sendgrid
EMAIL_API_KEY=your-api-key-here
EMAIL_FROM=noreply@tms.example.com
```

---

## Testing Keycloak Integration

### Test Script

```javascript
const axios = require('axios');

async function testKeycloakIntegration() {
  try {
    // 1. Test login
    console.log('Testing login...');
    const loginResponse = await axios.post(
      'https://keycloak.example.com/auth/realms/tms/protocol/openid-connect/token',
      new URLSearchParams({
        username: 'admin@tms.com',
        password: 'admin123',
        grant_type: 'password',
        client_id: 'tms-frontend'
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    
    console.log('✓ Login successful');
    const accessToken = loginResponse.data.access_token;
    
    // 2. Test user info endpoint
    console.log('Testing user info...');
    const userInfoResponse = await axios.get(
      'https://keycloak.example.com/auth/realms/tms/protocol/openid-connect/userinfo',
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );
    
    console.log('✓ User info retrieved:', userInfoResponse.data.email);
    
    // 3. Test API endpoint with token
    console.log('Testing API endpoint...');
    const apiResponse = await axios.get(
      'https://api.tms.example.com/v1/profile',
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );
    
    console.log('✓ API endpoint accessible');
    
    console.log('All tests passed!');
  } catch (error) {
    console.error('Test failed:', error.response?.data || error.message);
  }
}

testKeycloakIntegration();
```

---

## Troubleshooting

### Common Issues

1. **CORS Errors**
   - Add your frontend URL to Keycloak client's Web Origins
   - Enable CORS on your backend

2. **Token Expiration**
   - Implement token refresh logic
   - Handle 401 responses by refreshing token

3. **Role Mapping Issues**
   - Verify role names match exactly
   - Check realm role mappings in Keycloak

4. **Admin API Access**
   - Ensure service account is enabled for backend client
   - Verify client has necessary permissions

5. **Redirect URI Mismatch**
   - Add all possible redirect URIs to client configuration
   - Include wildcards for development environments
