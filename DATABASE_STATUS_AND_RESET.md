# 🔐 Database Status & Reset Guide

## Current Database Status

Your database at **test.digile.com** has:

✅ **Setup Completed:** Yes  
✅ **Admin Users:** 2 accounts  
✅ **Total Users:** 5 accounts  
✅ **System Configured:** Yes  

**This is why you see the LOGIN page instead of the SETUP page.**

---

## 👥 Existing Admin Accounts

You have these admin accounts available for login:

### Account 1: admin
- **Username:** `admin`
- **Email:** admin@company.com
- **Role:** System Administrator
- **Login URL:** http://test.digile.com:5000/auth

### Account 2: test_admin
- **Username:** `test_admin`
- **Email:** admin@test.com
- **Role:** Test Admin
- **Login URL:** http://test.digile.com:5000/auth

---

## ✅ Solutions

### Option 1: Login with Existing Admin (Recommended)

**If you know the password:**
1. Go to: http://test.digile.com:5000/auth
2. Enter username: `admin` (or `test_admin`)
3. Enter your password
4. Click Login

---

### Option 2: Reset Admin Password

**If you forgot the password, reset it:**

```bash
# Reset password for 'admin' user
node reset-admin-password.js "YourNewPassword123!" admin

# Or reset password for 'test_admin' user
node reset-admin-password.js "YourNewPassword123!" test_admin
```

**Example:**
```bash
node reset-admin-password.js "SecurePass2024!" admin
```

**Output:**
```
✅ Password reset successfully for: admin

You can now login at: http://test.digile.com:5000/auth
Username: admin
Password: SecurePass2024!
```

---

### Option 3: Show Setup Page Again (Keep All Data)

**If you want to see the first-time setup page without deleting data:**

```bash
# Reset setup status flag only
psql $DATABASE_URL -c "UPDATE system_settings SET setup_completed = false;"
```

Then visit: http://test.digile.com:5000

**This will:**
- ✅ Show the first-time setup page
- ✅ Keep ALL existing data (users, assets, etc.)
- ✅ Allow you to create another admin account
- ⚠️  Result: You'll have multiple admin accounts

**After creating new admin:**
- The new admin account will be added to existing users
- All existing accounts still work
- Existing data remains intact

---

### Option 4: Complete Database Reset (Delete Everything) ⚠️

**WARNING: This DELETES ALL DATA!**

**If you want a completely fresh start:**

```bash
# Method 1: Reset via SQL (Development Database)
psql $DATABASE_URL << 'EOF'
TRUNCATE TABLE audit_logs CASCADE;
TRUNCATE TABLE assignments CASCADE;
TRUNCATE TABLE assets CASCADE;
TRUNCATE TABLE custom_fields CASCADE;
TRUNCATE TABLE departments CASCADE;
TRUNCATE TABLE employees CASCADE;
TRUNCATE TABLE locations CASCADE;
TRUNCATE TABLE users CASCADE;
UPDATE system_settings SET setup_completed = false;
EOF
```

**Or use the reset script:**
```bash
./reset-database.sh
```

**This will:**
- ❌ Delete ALL users
- ❌ Delete ALL assets
- ❌ Delete ALL assignments
- ❌ Delete ALL audit logs
- ❌ Delete ALL departments, employees, locations
- ✅ Show first-time setup page

---

## 🔍 Check Current Database Status

**Check setup status:**
```bash
psql $DATABASE_URL -c "SELECT setup_completed FROM system_settings;"
```

**List all admin users:**
```bash
psql $DATABASE_URL -c "SELECT username, email, role FROM users WHERE role = 'admin';"
```

**List all users:**
```bash
psql $DATABASE_URL -c "SELECT username, email, role FROM users ORDER BY role, username;"
```

**Count records:**
```bash
psql $DATABASE_URL << 'EOF'
SELECT 
  (SELECT COUNT(*) FROM users) as users,
  (SELECT COUNT(*) FROM assets) as assets,
  (SELECT COUNT(*) FROM employees) as employees,
  (SELECT COUNT(*) FROM departments) as departments,
  (SELECT COUNT(*) FROM assignments) as assignments;
EOF
```

---

## 📊 Your Current Data

Based on your database:

**Users (5 total):**
1. **admin** - System Administrator ✅
2. **test_admin** - Test Admin ✅
3. john.doe - Employee
4. jane.smith - Manager
5. test_manager - Test Manager

**System Settings:**
- Setup completed: ✅ Yes
- Company configured: ✅ Yes
- Currency: USD

---

## 🚀 Quick Actions

### Just Want to Login?
```bash
# Use existing admin account
# URL: http://test.digile.com:5000/auth
# Username: admin
# If you forgot password, use Option 2 above
```

### Want Setup Page Without Data Loss?
```bash
psql $DATABASE_URL -c "UPDATE system_settings SET setup_completed = false;"
# Then visit: http://test.digile.com:5000
```

### Reset Specific Admin Password?
```bash
node reset-admin-password.js "NewPassword123!" admin
```

### Complete Fresh Start? (⚠️ Deletes Everything)
```bash
./reset-database.sh
# Then visit: http://test.digile.com:5000
```

---

## 🔐 Why You See Login Instead of Setup

The application checks `/api/setup/status`:

**Current Response:**
```json
{"setupCompleted": true}
```

**What This Means:**
- Setup has been completed before
- Admin user(s) exist in database
- System is configured and ready

**To See Setup Page Again:**
- Change `setupCompleted` to `false` (Option 3)
- OR delete all users (Option 4)

---

## 📝 Recommended Approach

**If this is your production system with real data:**
1. ✅ Use Option 1 (Login with existing admin)
2. ✅ Use Option 2 (Reset password if forgotten)

**If this is a test/development system:**
1. ✅ Use Option 3 (Show setup page, keep data)
2. ✅ Use Option 4 (Complete reset if needed)

---

## 🛠️ Troubleshooting

### "I can't remember any admin password"
**Solution:** Use Option 2 to reset the password
```bash
node reset-admin-password.js "MyNewSecurePassword!" admin
```

### "I want to see the setup page"
**Solution:** Use Option 3 to reset setup flag
```bash
psql $DATABASE_URL -c "UPDATE system_settings SET setup_completed = false;"
```

### "I want to start completely fresh"
**Solution:** Use Option 4 for complete reset
```bash
./reset-database.sh
```

### "Setup page shows 'Setup already completed' error"
**This means:**
- Another user completed setup while you had the page open
- Refresh the page to see the login form
- OR reset setup flag if you want to redo setup

---

## 📖 Related Documentation

- **[FIRST_TIME_SETUP.md](FIRST_TIME_SETUP.md)** - First-time setup guide
- **[PRODUCTION_DEPLOYMENT.md](PRODUCTION_DEPLOYMENT.md)** - Production deployment
- **[README.md](README.md)** - Main documentation

---

## Summary

**Your database is already set up and working!**

✅ **To login:** Use `admin` or `test_admin` at http://test.digile.com:5000/auth  
✅ **Forgot password:** Run `node reset-admin-password.js "NewPass!" admin`  
✅ **Want setup page:** Run `psql $DATABASE_URL -c "UPDATE system_settings SET setup_completed = false;"`  
✅ **Fresh start:** Run `./reset-database.sh` (⚠️ deletes all data)  

**The system is working correctly - it shows login because setup is already complete!**
