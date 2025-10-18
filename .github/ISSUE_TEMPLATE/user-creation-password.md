---
name: User Creation / Password Issues
about: Cannot login or create admin user
title: '[Auth] Cannot Login After User Creation'
labels: authentication, bug
assignees: ''
---

## Problem Description
Cannot login with created user credentials.

## Symptoms
- [ ] Created admin user but cannot login
- [ ] "Invalid credentials" error
- [ ] "User not found" error
- [ ] Password reset not working

## Environment
- **Deployment**: Replit / Ubuntu / Docker / Cloud
- **First-time setup**: Yes / No
- **Existing users**: Yes / No

## Common Causes & Solutions

### Wrong Password Hashing Algorithm
**Symptom**: Cannot login even with correct password

**Cause**: Old users created with bcrypt instead of scrypt

**Solution**:
```sql
-- Delete old user and recreate through first-time setup
sudo -u postgres psql asset_management
DELETE FROM users WHERE username = 'your_username';
\q
```
Then visit the app and complete first-time setup again.

### Session Store Issues
**Check database permissions**:
```sql
GRANT ALL ON ALL TABLES IN SCHEMA public TO asset_user;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO asset_user;
```

### Password Requirements
Passwords must:
- Be at least 8 characters long
- Contain letters and numbers

## First-Time Setup Process
1. Visit your deployment URL
2. If no users exist, you'll see "First-Time Setup"
3. Create admin account with:
   - Username (no spaces)
   - Email
   - Password (min 8 characters)
4. Login with created credentials

## Debugging

**Check if users exist**:
```bash
psql -h localhost -U asset_user -d asset_management -c "SELECT username, email, role FROM users;"
```

**Check password hash format**:
```bash
psql -h localhost -U asset_user -d asset_management -c "SELECT username, LENGTH(password) as hash_length FROM users;"
```
- scrypt hashes are longer (contains hash.salt format)
- bcrypt hashes are 60 characters

## Additional Information
- Created user via: First-time setup / Manual SQL / Admin panel
- Can access other parts of the app: Yes / No
- Database type: PostgreSQL version ___

## Related Documentation
- [Authentication System](../../replit.md#authentication)
