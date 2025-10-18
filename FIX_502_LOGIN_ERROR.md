# Fix 502 Bad Gateway Login Error

## 🔍 Root Cause
The application is **crashing on login** because of a **password hashing mismatch**:
- **App uses**: `scrypt` hashing (format: `hash.salt`)
- **Previous script used**: `bcrypt` hashing (format: `$2b$10$...`)

When you try to login, the app tries to split the bcrypt hash by `.` expecting scrypt format, which causes a crash → 502 error.

---

## ✅ Solution: Use Correct Password Hashing

I've created a new script that uses the **exact same scrypt hashing** as your application.

### Step 1: Delete Old Admin User (if exists)

On your server, run:
```bash
psql -h localhost -U asset_user -d asset_management -c "DELETE FROM users WHERE username = 'admin';"
```

### Step 2: Run the Correct Script

```bash
cd ~/AssetTrack
git pull origin main
chmod +x create-admin-correct.sh
./create-admin-correct.sh
```

The script will ask you for:
1. Admin username (e.g., `admin`)
2. Admin email (e.g., `admin@yourcompany.com`)
3. Admin full name (e.g., `System Administrator`)
4. Admin password (min 8 characters)

### Step 3: Restart PM2

```bash
pm2 restart asset-management
pm2 logs asset-management --lines 50
```

### Step 4: Test Login

1. Visit: **https://asset.digile.com**
2. Enter your new credentials
3. You should login successfully! ✅

---

## 🆘 If You Still Get 502 Error

Check PM2 logs for the actual error:
```bash
pm2 logs asset-management --err --lines 100
```

Common issues:
1. **Database connection**: Check `.env` file has correct DATABASE_URL
2. **Session store**: Check PostgreSQL sessions table exists
3. **Environment variables**: Verify SESSION_SECRET is set

---

## 🔧 Manual Verification

Check if admin user was created correctly:
```bash
psql -h localhost -U asset_user -d asset_management -c "SELECT username, email, role FROM users;"
```

Check password format (should have a `.` in it):
```bash
psql -h localhost -U asset_user -d asset_management -c "SELECT username, substring(password, 1, 50) as password_start FROM users WHERE username = 'admin';"
```

You should see something like:
```
 username |                  password_start                   
----------+---------------------------------------------------
 admin    | 5a3d2f1e9c8b7a6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b.
```

The `.` character indicates it's using the correct scrypt format!

---

## 📋 What the New Script Does

1. ✅ Validates your input (username, email, password)
2. ✅ Hashes password using **scrypt** (same as app)
3. ✅ Deletes any old admin user
4. ✅ Creates new admin with correct password format
5. ✅ Marks setup as completed
6. ✅ Verifies user was created

---

## 🎯 Next Steps

After successful login, you can:
- Create additional users via the web interface
- Import employees/assets via CSV
- Configure system settings
- Set up departments and locations

---

**Run the `create-admin-correct.sh` script now - this will fix the 502 login error!** 🚀
