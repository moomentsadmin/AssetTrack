# 🚨 URGENT SECURITY ACTIONS - Do This NOW

## Critical Issue
**Database passwords, secret keys, and credentials are exposed in your GitHub repository!**

Files like `attached_assets/Pasted--root-assettest-AssetTrackr-Test-API-docker-compose-f-docker-compose-ssl-external-db-yml-exe-1760598285875_1760598285875.txt` contain your actual production credentials.

---

## ⚡ STEP 1: Remove from GitHub History (5 minutes)

### Quick Method - Use Git Filter-Branch

```bash
# Run these commands NOW:
cd ~/AssetTrack

# Remove attached_assets from all Git history
git filter-branch --force --index-filter \
  'git rm -rf --cached --ignore-unmatch attached_assets' \
  --prune-empty --tag-name-filter cat -- --all

# Clean up
rm -rf .git/refs/original/
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Force push to GitHub (this overwrites history)
git push origin --force --all
git push origin --force --tags
```

**✅ This removes the files from entire Git history**

---

## ⚡ STEP 2: Rotate Database Password (5 minutes)

### DigitalOcean Managed Database

```bash
# 1. Go to your DigitalOcean dashboard
#    https://cloud.digitalocean.com/databases

# 2. Select your PostgreSQL database

# 3. Click "Settings" → "Reset Password"

# 4. Copy the new password

# 5. Update on your production server:
ssh root@test.digile.com
cd ~/AssetTrack
nano .env

# 6. Update this line with NEW password:
DATABASE_URL=postgresql://user:NEW_PASSWORD_HERE@host:port/database?sslmode=require

# 7. Restart application:
docker compose -f docker-compose.production.yml down
docker compose -f docker-compose.production.yml up -d
```

---

## ⚡ STEP 3: Rotate Session Secret (2 minutes)

```bash
# Generate new secret
openssl rand -base64 32

# Update on production server
ssh root@test.digile.com
cd ~/AssetTrack
nano .env

# Update SESSION_SECRET with the new value

# Restart
docker compose -f docker-compose.production.yml restart
```

---

## ⚡ STEP 4: Verify Removal (2 minutes)

```bash
# Check GitHub repository
# Go to: https://github.com/moomentsadmin/AssetTrack

# Search for: attached_assets
# Should return: No results

# If still visible, wait 1 hour for GitHub cache to clear
```

---

## ⚡ STEP 5: Delete Local Files (1 minute)

```bash
# Remove attached_assets folder completely
rm -rf attached_assets/

# Verify .gitignore includes it
cat .gitignore | grep attached_assets
# Should show: attached_assets/

# Commit the .gitignore update
git add .gitignore
git commit -m "Security: Add attached_assets to gitignore"
git push origin main
```

---

## 🔍 What Credentials Were Exposed?

Based on the files found:
- ✅ **Database Connection String** (includes password)
- ✅ **Database Host/Port/Username**
- ✅ **Session Secrets**
- ✅ **Server Configuration Details**
- ✅ **Deployment Scripts with Credentials**

---

## ⏱️ Total Time: ~15 minutes

1. Remove from Git history (5 min) ← **START HERE**
2. Rotate database password (5 min)
3. Rotate session secret (2 min)
4. Verify removal (2 min)
5. Delete local files (1 min)

---

## 🚀 Already Done For You

✅ Added `attached_assets/` to `.gitignore`
✅ Created removal script: `REMOVE_SENSITIVE_FILES.sh`
✅ Created full security guide: `SECURITY_BREACH_RESPONSE.md`

---

## 📞 Need Help?

If you encounter issues:

1. **Git filter-branch fails?**
   ```bash
   # Use BFG instead (faster)
   brew install bfg  # macOS
   # or download from: https://rtyley.github.io/bfg-repo-cleaner/
   
   bfg --delete-folders attached_assets
   ```

2. **Can't access DigitalOcean?**
   - Contact support: https://cloud.digitalocean.com/support
   - They can rotate database password for you

3. **Force push rejected?**
   ```bash
   # Ensure you have permission
   git push origin --force --all --no-verify
   ```

---

## ⚠️ Important Notes

- **Force push will rewrite history** - This is necessary to remove credentials
- **All collaborators must re-clone** - After force push, others need fresh clone
- **Monitor database access** - Check for unusual activity in next 24-48 hours
- **Credentials are compromised** - Assume someone may have seen them

---

## 🎯 Success Criteria

You're safe when:
- [ ] Git history cleaned (force pushed)
- [ ] Database password rotated
- [ ] Session secret rotated
- [ ] Production server updated with new credentials
- [ ] Application restarted and working
- [ ] GitHub search shows no `attached_assets` files
- [ ] Local `attached_assets/` deleted
- [ ] `.gitignore` includes `attached_assets/`

---

**⏰ Time Sensitive: Do STEP 1 and STEP 2 RIGHT NOW!**

Every minute these credentials remain accessible increases risk of unauthorized access to your database.
