# Asset Management System - Deployment Guide

## 🎉 Application Status: VERIFIED WORKING

**✅ Fully tested in Replit on October 18, 2025**

All core functionality verified:
- Setup flow ✅
- Authentication ✅  
- User management ✅
- Asset management ✅
- Database operations ✅

---

## 📚 Documentation Index

### Essential Documents (Read These)

| Document | Purpose | When to Use |
|----------|---------|-------------|
| **[VERIFICATION_SUMMARY.md](./VERIFICATION_SUMMARY.md)** | Test results and deployment options | **START HERE** - Overview of everything |
| **[UBUNTU_DEPLOYMENT_GUIDE.md](./UBUNTU_DEPLOYMENT_GUIDE.md)** | Complete Ubuntu deployment | Step-by-step Ubuntu server setup |
| **[replit.md](./replit.md)** | Application architecture | Understanding the codebase |

### Helper Scripts

| Script | Purpose | Usage |
|--------|---------|-------|
| `create-admin-correct.sh` | Create admin user with correct password hashing | `./create-admin-correct.sh` |
| `quick-fix-504.sh` | Diagnose and fix 504 Gateway Timeout errors | `./quick-fix-504.sh` |
| `check-pm2-status.sh` | Check PM2 application health | `./check-pm2-status.sh` |

### Troubleshooting Guides

| Guide | When to Use |
|-------|-------------|
| **[FIX_502_LOGIN_ERROR.md](./FIX_502_LOGIN_ERROR.md)** | Getting 502 Bad Gateway on login |
| **[URGENT_FIX_504.md](./URGENT_FIX_504.md)** | Getting 504 Gateway Timeout |

---

## 🚀 Quick Start

### Option 1: Deploy on Replit (Easiest - 5 minutes)

1. This Replit is already configured and working
2. Click the "Deploy" button
3. Choose your deployment type
4. Your app goes live!

**Recommended for**: Fastest deployment, zero configuration

---

### Option 2: Deploy on Ubuntu Server (Manual - 1-2 hours)

1. **Read**: [VERIFICATION_SUMMARY.md](./VERIFICATION_SUMMARY.md)
2. **Follow**: [UBUNTU_DEPLOYMENT_GUIDE.md](./UBUNTU_DEPLOYMENT_GUIDE.md)
3. **Create admin**: Run `./create-admin-correct.sh`
4. **Verify**: Visit your domain and login

**Recommended for**: Full control, custom server

---

## ⚠️ Important Notes

### Password Hashing
The application uses **scrypt** password hashing (not bcrypt). Always use the provided `create-admin-correct.sh` script to create admin users - it uses the correct hashing method.

### Common Issues

**502 Bad Gateway** → PM2 app crashed
- Fix: `pm2 restart asset-management`

**504 Gateway Timeout** → App frozen or slow
- Fix: Run `./quick-fix-504.sh`

**Can't login** → Wrong password hash format
- Fix: Run `./create-admin-correct.sh` to recreate admin

---

## 📁 Project Structure

```
AssetTrack/
├── client/              # React frontend
├── server/              # Express backend
├── shared/              # Shared types and schemas
├── ecosystem.config.cjs # PM2 configuration
├── .env                 # Environment variables (create this)
├── UBUNTU_DEPLOYMENT_GUIDE.md
├── VERIFICATION_SUMMARY.md
└── README_DEPLOYMENT.md # This file
```

---

## 🔒 Security Checklist for Ubuntu Deployment

- [ ] Changed default database password
- [ ] Generated random SESSION_SECRET
- [ ] Enabled UFW firewall
- [ ] Installed SSL certificate (Let's Encrypt)
- [ ] Regular database backups scheduled
- [ ] PM2 logs monitored
- [ ] Server updated regularly

---

## 🆘 Need Help?

1. **Check logs**: `pm2 logs asset-management --lines 100`
2. **Check health**: `curl http://localhost:5000/health`
3. **Read troubleshooting**: See UBUNTU_DEPLOYMENT_GUIDE.md troubleshooting section
4. **Run diagnostic**: `./check-pm2-status.sh`

---

## 📖 Full Documentation

All documentation is in this repository:

- **Getting Started**: Read VERIFICATION_SUMMARY.md
- **Ubuntu Deployment**: Read UBUNTU_DEPLOYMENT_GUIDE.md  
- **Architecture**: Read replit.md
- **Troubleshooting**: See the Troubleshooting Guides section above

---

**🎯 Next Step**: Read [VERIFICATION_SUMMARY.md](./VERIFICATION_SUMMARY.md) to understand your deployment options!
