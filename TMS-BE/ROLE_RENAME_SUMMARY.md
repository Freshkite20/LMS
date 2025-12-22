# Role Rename: Instructor → Teacher

**Date:** 2025-12-06  
**Change Type:** Refactoring - Role Terminology Update

---

## 📝 Summary

Successfully renamed all occurrences of "instructor" to "teacher" throughout the TMS Backend codebase to better reflect the actual user role.

---

## ✅ Files Modified

### **Core Application Files** (6 files)

1. **`src/constants/index.ts`**
   - Changed `INSTRUCTOR: 'instructor'` → `TEACHER: 'teacher'`
   - Updated USER_ROLES constant

2. **`src/types/index.ts`**
   - Changed role type: `'admin' | 'instructor' | 'student'` → `'admin' | 'teacher' | 'student'`

3. **`src/validators/userValidator.ts`**
   - Updated validation: `.isIn(['admin', 'instructor', 'student'])` → `.isIn(['admin', 'teacher', 'student'])`
   - Updated error message: `'Role must be admin, instructor, or student'` → `'Role must be admin, teacher, or student'`

4. **`src/middlewares/auth.ts`**
   - Renamed: `requireInstructor` → `requireTeacher`
   - Updated: `authorize(['instructor', 'admin'])` → `authorize(['teacher', 'admin'])`
   - Updated: `authorize(['student', 'instructor', 'admin'])` → `authorize(['student', 'teacher', 'admin'])`

5. **`src/config/keycloak.ts`**
   - Updated comments: `// Instructor-accessible endpoints` → `// Teacher-accessible endpoints`
   - Renamed variable: `instructorAllowed` → `teacherAllowed`
   - Updated role arrays to use 'teacher' instead of 'instructor'

### **Documentation Files** (6 files)

6. **`KEYCLOAK_INTEGRATION.md`**
   - Updated all references from instructor to teacher
   - Updated code examples
   - Updated role hierarchy tables

7. **`KEYCLOAK_QUICKSTART.md`**
   - Updated all references from instructor to teacher
   - Updated middleware examples
   - Updated role descriptions

8. **`KEYCLOAK_SETUP_STATUS.md`**
   - Updated all references from instructor to teacher
   - Updated role hierarchy table
   - Updated setup instructions

9. **`README.md`**
   - Updated user role descriptions
   - Changed from "admin, instructor, student" to "admin, teacher, student"

10. **`IMPROVEMENTS_SUMMARY.md`**
    - Updated role references

11. **`scripts/README.md`**
    - Updated sample user creation documentation

---

## 🔄 Changes by Category

### **Constants & Types**
- ✅ `USER_ROLES.INSTRUCTOR` → `USER_ROLES.TEACHER`
- ✅ Role type: `'instructor'` → `'teacher'`

### **Middleware & Authorization**
- ✅ `requireInstructor` → `requireTeacher`
- ✅ All role arrays updated: `['instructor', ...]` → `['teacher', ...]`

### **Validation**
- ✅ Validator accepts 'teacher' instead of 'instructor'
- ✅ Error messages updated

### **Documentation**
- ✅ All markdown files updated
- ✅ Code examples updated
- ✅ Role hierarchy tables updated
- ✅ Setup instructions updated

---

## 🎯 Role Hierarchy (Updated)

| Role | Access Level | Description |
|------|--------------|-------------|
| **admin** | Full | System administrator with complete access |
| **teacher** | Elevated | Educator/Trainer with course viewing and student progress access |
| **student** | Basic | Learner with access to own profile and assigned courses |

---

## 🔍 Impact Analysis

### **Breaking Changes**
⚠️ **Yes - This is a breaking change for:**

1. **Keycloak Configuration**
   - Realm roles must be updated from 'instructor' to 'teacher'
   - User role assignments need to be updated

2. **Database**
   - Existing user records with role='instructor' need migration
   - Update query: `db.users.updateMany({role: 'instructor'}, {$set: {role: 'teacher'}})`

3. **Frontend/API Clients**
   - Any hardcoded 'instructor' role checks must be updated
   - Token payloads will now contain 'teacher' instead of 'instructor'

### **Non-Breaking Changes**
✅ **No impact on:**
- API endpoints (no URL changes)
- Database schema structure
- Authentication flow
- Authorization logic (only role name changed)

---

## 📋 Migration Checklist

If you have existing data or Keycloak configuration, complete these steps:

- [ ] **Update Keycloak Realm Roles**
  - [ ] Create new 'teacher' role in Keycloak
  - [ ] Assign 'teacher' role to users who had 'instructor'
  - [ ] Remove old 'instructor' role (optional, after migration)

- [ ] **Update Database**
  - [ ] Run migration script to update user roles
  - [ ] Verify all users with 'instructor' role are updated to 'teacher'

- [ ] **Update Frontend/Clients**
  - [ ] Search for hardcoded 'instructor' strings
  - [ ] Update role checks to use 'teacher'
  - [ ] Update UI labels if needed

- [ ] **Test Authentication**
  - [ ] Get new token with 'teacher' role
  - [ ] Test teacher-accessible endpoints
  - [ ] Verify role-based access control works

---

## 🧪 Testing Recommendations

### 1. **Unit Tests**
```typescript
// Update any tests that check for 'instructor' role
expect(user.role).toBe('teacher'); // was 'instructor'
```

### 2. **Integration Tests**
- Test authentication with teacher role
- Test authorization for teacher-accessible endpoints
- Verify student endpoints still allow teacher access

### 3. **Manual Testing**
- Create test user with 'teacher' role in Keycloak
- Get access token
- Test endpoints that require teacher role
- Verify proper access control

---

## 📦 Database Migration Script

If you have existing data, run this MongoDB migration:

```javascript
// MongoDB migration script
use tms;

// Update all users with instructor role to teacher role
db.users.updateMany(
  { role: 'instructor' },
  { $set: { role: 'teacher' } }
);

// Verify the update
db.users.countDocuments({ role: 'teacher' });
db.users.countDocuments({ role: 'instructor' }); // Should be 0
```

---

## 🔐 Keycloak Update Steps

1. **Login to Keycloak Admin Console**
   - URL: http://localhost:8080
   - Navigate to your realm (e.g., 'tms')

2. **Create 'teacher' Role**
   - Go to: Realm Settings → Roles
   - Click "Create Role"
   - Role Name: `teacher`
   - Save

3. **Update User Role Assignments**
   - Go to: Users
   - For each user with 'instructor' role:
     - Click on user
     - Go to "Role Mappings" tab
     - Remove 'instructor' role
     - Add 'teacher' role

4. **Optional: Delete 'instructor' Role**
   - After all users are migrated
   - Go to: Realm Settings → Roles
   - Delete 'instructor' role

---

## ✨ Benefits of This Change

1. **Clearer Terminology**
   - "Teacher" is more universally understood than "Instructor"
   - Better aligns with educational context

2. **Improved User Experience**
   - More intuitive for end users
   - Clearer role descriptions

3. **Consistency**
   - All documentation now uses consistent terminology
   - Easier to understand for new developers

---

## 🚀 Next Steps

1. **Restart Development Server**
   - The server should automatically reload with tsx watch
   - Verify no TypeScript errors

2. **Update Keycloak**
   - Follow the Keycloak update steps above
   - Create 'teacher' role
   - Assign to appropriate users

3. **Migrate Database**
   - Run the MongoDB migration script
   - Verify all instructor roles are updated

4. **Test Thoroughly**
   - Test authentication with teacher role
   - Verify all endpoints work correctly
   - Check authorization logic

5. **Update Frontend**
   - Update any frontend code that references 'instructor'
   - Update UI labels and role displays

---

## 📞 Support

If you encounter any issues after this change:

1. Check TypeScript compilation errors
2. Verify Keycloak role configuration
3. Check database migration completed successfully
4. Review application logs for authentication errors

---

**Status:** ✅ Backend code successfully updated. Database and Keycloak configuration updates pending.
