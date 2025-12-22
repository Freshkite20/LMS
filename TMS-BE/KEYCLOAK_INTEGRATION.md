# Keycloak Integration - Complete Guide

## 🎉 **What Was Updated**

Your TMS Backend now has **production-ready Keycloak authentication and authorization**!

---

## ✅ **Features Implemented**

### 1. **Enhanced Token Verification**
- ✅ Automatic JWKS public key fetching from Keycloak
- ✅ Public key caching (1-hour TTL) for performance
- ✅ Fallback to environment variable for public key
- ✅ Development mode support (token decoding without verification)
- ✅ Proper JWT verification with RS256 algorithm
- ✅ Issuer validation
- ✅ Comprehensive error handling (expired, invalid, not-yet-valid tokens)

### 2. **Role-Based Access Control (RBAC)**
- ✅ Automatic role extraction from `realm_access` and `resource_access`
- ✅ Support for both realm roles and client-specific roles
- ✅ Flexible role checking (`hasRole`, `hasAnyRole`)
- ✅ Path-based role requirements
- ✅ Three-tier access levels: Student, teacher, Admin

### 3. **Advanced Keycloak Operations**
- ✅ Token refresh functionality
- ✅ User info fetching from Keycloak
- ✅ Logout support
- ✅ Structured logging with Pino

### 4. **Middleware Enhancements**
- ✅ Async token verification
- ✅ Proper error handling and logging
- ✅ Optional authentication middleware
- ✅ Role-specific middleware helpers
- ✅ TypeScript type safety with `KeycloakTokenPayload`

---

## 📋 **Files Modified**

| File | Changes |
|------|---------|
| `src/config/keycloak.ts` | Complete rewrite with JWKS, role extraction, token operations |
| `src/middlewares/auth.ts` | Updated to use async verification, enhanced logging |
| `src/config/env.ts` | Added NODE_ENV and LOG_LEVEL exports |

---

## 🔧 **Configuration**

### Environment Variables Required

Add these to your `.env` file:

```env
# Keycloak Configuration
KEYCLOAK_BASE_URL=http://localhost:8080
KEYCLOAK_REALM=your-realm-name
KEYCLOAK_CLIENT_ID=tms-backend
KEYCLOAK_CLIENT_SECRET=your-client-secret

# Optional: Public key (if JWKS fetching fails)
KEYCLOAK_PUBLIC_KEY=-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...\n-----END PUBLIC KEY-----

# Application
NODE_ENV=development
LOG_LEVEL=debug
PORT=3000

# MongoDB
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=tms
```

---

## 🚀 **Usage Examples**

### 1. **Basic Authentication**

```typescript
import { authenticate, authorize } from './middlewares/auth.js';

// Protect route with authentication
router.get('/profile', authenticate, (req, res) => {
  res.json({ user: req.user });
});
```

### 2. **Role-Based Authorization**

```typescript
import { authenticate, authorize, requireAdmin } from './middlewares/auth.js';

// Admin only
router.post('/courses', authenticate, requireAdmin, coursesController.create);

// teacher or Admin
router.get('/batches/:id/progress', authenticate, authorize(['teacher', 'admin']), batchesController.getProgress);

// Student, teacher, or Admin
router.get('/courses/:id', authenticate, authorize(['student', 'teacher', 'admin']), coursesController.getById);
```

### 3. **Optional Authentication**

```typescript
import { optionalAuthenticate } from './middlewares/auth.js';

// Public endpoint that can use auth if provided
router.get('/public-courses', optionalAuthenticate, (req, res) => {
  if (req.user) {
    // User is authenticated, show personalized content
  } else {
    // Anonymous user, show public content
  }
});
```

### 4. **Using Middleware Helpers**

```typescript
import { requireAdmin, requireteacher, requireStudent } from './middlewares/auth.js';

router.post('/admin/settings', authenticate, requireAdmin, adminController.updateSettings);
router.get('/teacher/dashboard', authenticate, requireteacher, teacherController.getDashboard);
router.get('/student/courses', authenticate, requireStudent, studentController.getCourses);
```

---

## 🎯 **Role Hierarchy**

The system supports three role levels:

| Role | Access Level | Can Access |
|------|--------------|------------|
| **Student** | Basic | Own profile, assigned courses, tests, progress |
| **teacher** | Elevated | All student access + course viewing, batch progress |
| **Admin** | Full | Everything (create courses, manage batches, etc.) |

---

## 📊 **Access Control Matrix**

| Endpoint | Student | teacher | Admin |
|----------|---------|------------|-------|
| `GET /api/students/:id` | ✅ (own) | ✅ | ✅ |
| `GET /api/courses/:id` | ✅ | ✅ | ✅ |
| `POST /api/courses` | ❌ | ❌ | ✅ |
| `GET /api/batches/:id/progress` | ❌ | ✅ | ✅ |
| `POST /api/tests/:id/submit` | ✅ | ✅ | ✅ |
| `POST /api/batches` | ❌ | ❌ | ✅ |

---

## 🔐 **Token Structure**

### Keycloak Token Payload

```typescript
{
  sub: "user-uuid",                    // User ID
  email: "user@example.com",
  preferred_username: "username",
  name: "John Doe",
  given_name: "John",
  family_name: "Doe",
  realm_access: {
    roles: ["student", "offline_access"]
  },
  resource_access: {
    "tms-backend": {
      roles: ["view-courses", "submit-tests"]
    }
  },
  exp: 1701234567,                     // Expiration timestamp
  iat: 1701230967,                     // Issued at timestamp
  iss: "http://localhost:8080/realms/tms",
  azp: "tms-backend"                   // Client ID
}
```

---

## 🛠️ **Advanced Features**

### 1. **Token Refresh**

```typescript
import { refreshToken } from './config/keycloak.js';

// Refresh an expired token
const newTokens = await refreshToken(oldRefreshToken);
// Returns: { access_token, refresh_token, expires_in, ... }
```

### 2. **Get User Info**

```typescript
import { getUserInfo } from './config/keycloak.js';

// Fetch additional user info from Keycloak
const userInfo = await getUserInfo(accessToken);
```

### 3. **Logout**

```typescript
import { logoutUser } from './config/keycloak.js';

// Logout user from Keycloak
await logoutUser(refreshToken);
```

### 4. **Custom Role Checking**

```typescript
import { hasRole, hasAnyRole, extractRoles } from './config/keycloak.js';

// Check if user has specific role
if (hasRole(req.user, 'admin')) {
  // Admin-specific logic
}

// Check if user has any of the roles
if (hasAnyRole(req.user, ['teacher', 'admin'])) {
  // teacher or admin logic
}

// Get all user roles
const roles = extractRoles(req.user);
console.log(roles); // ['student', 'offline_access', ...]
```

---

## 🔍 **Logging**

All authentication and authorization events are logged:

```typescript
// Successful authentication
logger.debug({ userId, email, roles }, 'User authenticated');

// Authorization success
logger.debug({ userId, roles }, 'User authorized');

// Authorization failure
logger.warn({ userId, userRoles, requiredRoles }, 'Authorization failed');

// Token verification failure
logger.error({ error }, 'Token verification failed');
```

---

## 🧪 **Testing**

### Get a Token from Keycloak

```bash
# Using password grant (for testing only)
curl -X POST "http://localhost:8080/realms/your-realm/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=tms-backend" \
  -d "client_secret=your-secret" \
  -d "grant_type=password" \
  -d "username=testuser" \
  -d "password=testpass"
```

### Use Token in API Request

```bash
curl -X GET "http://localhost:3000/api/courses/123" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## 🐛 **Troubleshooting**

### Issue: "Failed to fetch Keycloak public key"

**Solution:**
1. Check `KEYCLOAK_BASE_URL` and `KEYCLOAK_REALM` in `.env`
2. Verify Keycloak is running and accessible
3. Set `KEYCLOAK_PUBLIC_KEY` in `.env` as fallback
4. In development, set `NODE_ENV=development` to skip verification

### Issue: "Token expired"

**Solution:**
- Use the refresh token to get a new access token
- Implement automatic token refresh in your frontend

### Issue: "Forbidden: Insufficient permissions"

**Solution:**
- Check user roles in Keycloak admin console
- Verify role mapping in `getRequiredRolesForPath()`
- Check logs for `userRoles` vs `requiredRoles`

### Issue: "Invalid token format"

**Solution:**
- Ensure token is sent as `Bearer <token>`
- Check token hasn't been truncated
- Verify token is a valid JWT

---

## 📈 **Performance**

- **Public Key Caching**: Keys are cached for 1 hour, reducing Keycloak calls
- **Async Verification**: Non-blocking token verification
- **Minimal Overhead**: Only fetches JWKS when cache expires

---

## 🔒 **Security Best Practices**

✅ **Implemented:**
- RS256 algorithm for token signing
- Issuer validation
- Token expiration checking
- Secure token transmission (Bearer scheme)
- Role-based access control
- Comprehensive logging

⚠️ **Recommendations:**
- Use HTTPS in production
- Rotate client secrets regularly
- Set appropriate token expiration times in Keycloak
- Implement rate limiting (already configured)
- Monitor authentication logs

---

## 🎓 **Next Steps**

1. **Configure Keycloak**:
   - Create realm
   - Create client (tms-backend)
   - Define roles (admin, teacher, student)
   - Create test users

2. **Update Routes**:
   - Add `authenticate` middleware to protected routes
   - Add `authorize` middleware with appropriate roles
   - Test with different user roles

3. **Frontend Integration**:
   - Implement Keycloak login flow
   - Store tokens securely
   - Implement token refresh
   - Add logout functionality

4. **Testing**:
   - Test all endpoints with different roles
   - Test token expiration handling
   - Test invalid token scenarios

---

## 📚 **Additional Resources**

- [Keycloak Documentation](https://www.keycloak.org/documentation)
- [JWT.io](https://jwt.io/) - Decode and verify JWTs
- [Pino Logger](https://getpino.io/) - Logging documentation

---

## ✨ **Summary**

Your TMS Backend now has:
- ✅ Production-ready Keycloak integration
- ✅ Automatic JWKS public key fetching
- ✅ Comprehensive role-based access control
- ✅ Token refresh and user info endpoints
- ✅ Structured logging for all auth events
- ✅ TypeScript type safety
- ✅ Development mode support

**You're ready to integrate with Keycloak!** 🚀
