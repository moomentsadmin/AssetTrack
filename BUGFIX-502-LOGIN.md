# Bug Fix: 502 Bad Gateway Error on User Login

## Problem Description
New users were experiencing a **502 Bad Gateway** error when attempting to login to the AssetTrack application.

## Root Causes Identified

### 1. Missing Environment Variable Loading
The application was not loading environment variables from the `.env` file, causing the following issues:
- `DATABASE_URL` was undefined, preventing database connections
- `SESSION_SECRET` was undefined, breaking session management
- Server would crash when attempting database operations during login

### 2. PostgreSQL Database Not Running
The PostgreSQL database container was not started, causing connection failures when the application attempted to authenticate users.

### 3. Windows Compatibility Issue
The `reusePort` option in the server's listen configuration is not supported on Windows, causing the server to fail to start with error: `ENOTSUP: operation not supported on socket`

## Solutions Implemented

### Fix 1: Added dotenv Package
**File Modified:** `package.json`
```json
"dependencies": {
  "dotenv": "^16.x.x",
  ...
}
```

**File Modified:** `server/index.ts`
```typescript
import "dotenv/config";  // Added at the top of the file
```

This ensures environment variables from `.env` are loaded before any other modules that depend on them (like `db.ts` which checks for `DATABASE_URL`).

### Fix 2: Cross-Platform Environment Variables
**File Modified:** `package.json`
```json
"scripts": {
  "dev": "cross-env NODE_ENV=development tsx server/index.ts",
  "start": "cross-env NODE_ENV=production node dist/index.js",
  ...
}
```

Added `cross-env` package to ensure `NODE_ENV` works correctly on both Windows and Unix-based systems.

### Fix 3: Windows Socket Compatibility
**File Modified:** `server/index.ts`
```typescript
// Before:
server.listen({
  port,
  host: "0.0.0.0",
  reusePort: true,  // Not supported on Windows
}, () => {
  log(`serving on port ${port}`);
});

// After:
const listenOptions: any = {
  port,
  host: "0.0.0.0",
};

if (process.platform !== 'win32') {
  listenOptions.reusePort = true;
}

server.listen(listenOptions, () => {
  log(`serving on port ${port}`);
});
```

## How to Start the Application Correctly

### Prerequisites
1. **Docker Desktop** must be installed and running
2. **Node.js** (v18 or higher) must be installed
3. **npm** dependencies must be installed

### Step-by-Step Startup Process

#### 1. Install Dependencies (First Time Setup)
```powershell
npm install
```

#### 2. Start PostgreSQL Database
```powershell
docker compose up -d db
```

Wait for the database to be healthy (about 5-10 seconds):
```powershell
docker ps --filter "name=asset-db"
```

You should see `STATUS` showing `Up X seconds (healthy)`.

#### 3. Run Database Migrations (First Time Setup)
```powershell
npm run db:push
```

#### 4. Start the Development Server
```powershell
npm run dev
```

The application will be available at: `http://localhost:5000`

### Alternative: Start Everything with Docker Compose
To start both the database and application together:
```powershell
docker compose up -d
```

This will:
1. Start the PostgreSQL database
2. Wait for it to be healthy
3. Build and start the application container
4. Automatically run migrations

## Verification Steps

### 1. Check Database is Running
```powershell
Test-NetConnection localhost -Port 5432
```
Should return `TcpTestSucceeded: True`

### 2. Check Application is Running
```powershell
Test-NetConnection localhost -Port 5000
```
Should return `TcpTestSucceeded: True`

### 3. Test API Endpoint
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/setup/status" -Method GET
```
Should return JSON with `setupCompleted: true` or `false`

### 4. Check Server Logs
Look for successful startup message:
```
[express] serving on port 5000
```

## Common Issues and Solutions

### Issue: "DATABASE_URL must be set" Error
**Solution:** Ensure `.env` file exists and contains:
```
DATABASE_URL=postgresql://asset_user:your_secure_password@localhost:5432/asset_management
```

### Issue: Database Connection Refused
**Solution:** Start the PostgreSQL container:
```powershell
docker compose up -d db
```

### Issue: 502 Bad Gateway on Login
**Causes:**
1. Database is not running → Start with `docker compose up -d db`
2. Environment variables not loaded → Ensure `dotenv` is installed
3. Session secret missing → Check `.env` has `SESSION_SECRET`

**Check logs for specific error:**
```powershell
docker compose logs app
# or if running locally:
# Check terminal where npm run dev is running
```

### Issue: Port Already in Use
**Solution:** Stop any existing processes:
```powershell
# Find process using port 5000
Get-NetTCPConnection -LocalPort 5000 | Select-Object OwningProcess
# Stop the process (replace PID with actual process ID)
Stop-Process -Id PID -Force
```

## Files Modified
1. `server/index.ts` - Added dotenv import and Windows compatibility for socket listening
2. `package.json` - Added dotenv and cross-env dependencies, updated scripts
3. `.env` - Ensure this file exists with proper configuration (not tracked in git)

## Testing the Fix
1. Ensure database is running
2. Start the development server with `npm run dev`
3. Navigate to `http://localhost:5000`
4. Attempt to login with existing credentials
5. Should NOT receive 502 error
6. Should receive proper authentication response (401 for invalid credentials, 200 for valid)

## Production Deployment Notes
When deploying to production:
1. Ensure `.env` file is properly configured on the server
2. Use `docker compose up -d` to start all services
3. Environment variables should be set in the deployment environment (not just .env file)
4. The `dotenv` package will still work but environment variables should be set at the system level for security

## Summary
The 502 Bad Gateway error was caused by a combination of:
- Missing environment variable loading mechanism
- Database not running
- Windows incompatibility with socket options

All issues have been resolved by:
- Adding `dotenv` package and loading it at application startup
- Documenting proper startup procedure (database must be running first)
- Making socket listener configuration platform-aware
