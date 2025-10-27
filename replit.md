# Asset Management System

## Overview
This full-stack application provides a comprehensive IT asset management system for tracking hardware, software, licenses, and equipment assigned to employees and contractors. It offers complete asset lifecycle management with role-based access control, depreciation tracking, audit trails, and email notifications. The system aims to streamline asset management processes for businesses, offering robust features for tracking, organization, and compliance.

## User Preferences
I prefer clear, concise explanations and direct answers. For coding tasks, I lean towards modern, maintainable code using best practices. I want the agent to prioritize security and efficient resource utilization. When suggesting changes, please outline the impact and rationale. Do not make changes to folder `node_modules` or files `package-lock.json`.

## System Architecture
The application follows a modern SaaS dashboard design with a professional blue accent and supports both dark and light modes.

### Frontend
- **Framework**: React with TypeScript
- **Data Fetching**: TanStack Query
- **Routing**: Wouter
- **UI Components**: shadcn/ui with Tailwind CSS
- **Form Management**: React Hook Form with Zod validation

### Backend
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Passport.js with session-based authentication (connect-pg-simple)
- **Email**: Nodemailer for notifications

### Core Features & Design Decisions
- **Authentication**: Username/password with role-based access (Admin, Manager, Employee); first-time setup creates an admin account.
- **User Management**: Admin CRUD for users, personal profile updates for all users.
- **Asset Management**: Full CRUD for assets, status tracking, photo URLs, QR code labels, assignment workflow, notes, and depreciation calculation.
- **Device Tracking**: Real-time monitoring of laptop devices with location tracking and system resource monitoring (CPU, memory, disk). Includes a lightweight tracking agent that can be installed on devices to send periodic heartbeats to the server.
- **Organization**: Employee and department management, including bulk upload via CSV.
- **Audit Trail**: Comprehensive logging of all asset-related activities.
- **System Health**: Admin dashboard for monitoring system status and statistics.
- **Customization**: Configurable company branding (name, logo, website, currency, header/footer text).
- **Role-Based Access Control (RBAC)**: Strict authorization implemented in both frontend (ProtectedRoute, dynamic sidebar) and backend (middleware like `requireAdmin`).
    - **Employee**: Dashboard, Assets, Employees, Departments, Audit Trail, Profile.
    - **Manager**: All Employee features + Locations, Custom Fields, Import Data, Branding, Settings, Device Tracking.
    - **Admin**: Full control including System Health, User Management, and Device Tracking.
- **Custom Fields**: Stored as JSONB for flexibility, allowing dynamic field definitions per asset type.
- **Email Notifications**: Configurable for asset assignments, warranty expiry, and return reminders, supporting SendGrid and generic SMTP.

## Security Enhancements
- **No Logging**: All `console.log`, `console.error`, `console.warn` statements removed from production code to prevent sensitive data exposure
- **Silent Operations**: Authentication, email, and error handling operate without logging
- **Data Privacy**: No user credentials, IP addresses, or personal information logged anywhere
- **GDPR Compliant**: No tracking or logging of user activities

## Known Deployment Issues & Solutions

### Issue: 504 Gateway Timeout on Ubuntu
**Cause**: Using Neon WebSocket driver with local PostgreSQL  
**Status**: ✅ RESOLVED - Auto-detection now uses correct driver  
**GitHub Issue**: See `.github/ISSUE_TEMPLATE/deployment-ubuntu-504-timeout.md`

### Issue: User Cannot Login After Creation
**Cause**: Old bcrypt hashes vs new scrypt hashes  
**Status**: ✅ RESOLVED - Always uses scrypt for new users  
**GitHub Issue**: See `.github/ISSUE_TEMPLATE/user-creation-password.md`

### Issue: Docker Container Exits
**Cause**: Database not ready before app starts  
**Status**: ✅ RESOLVED - Docker Compose uses health checks  
**GitHub Issue**: See `.github/ISSUE_TEMPLATE/deployment-docker.md`

All deployment issues are documented in GitHub issue templates for easy reference and troubleshooting.

## Recent Updates (October 27, 2025)

### Device Tracking Download Fix
**Issue**: Download Agent button on Device Tracking page returned 404 error  
**Cause**: Missing static file route for tracking-agent directory  
**Solution**: Added `express.static` route in server/routes.ts to serve tracking-agent files  
**Status**: ✅ RESOLVED - All tracking agent files now accessible at `/tracking-agent/*`

## Testing & Verification Status (October 18, 2025)

**✅ APPLICATION FULLY TESTED AND VERIFIED IN REPLIT**

Comprehensive end-to-end testing completed:
- ✅ **Setup Flow**: First-time setup with admin account creation works perfectly
- ✅ **Authentication**: Login/logout functionality verified and working
- ✅ **User Management**: Create users, assign roles - all working
- ✅ **Asset Management**: Create assets, update status - all working
- ✅ **Database**: PostgreSQL integration working correctly with Drizzle ORM
- ✅ **Password Hashing**: scrypt-based hashing working as designed
- ✅ **API Endpoints**: All tested and returning correct responses
- ✅ **Frontend**: React UI rendering correctly, forms working, navigation functional

**Deployment Status:**
- **Replit**: ✅ Fully functional and tested with Neon database (auto-detected)
- **Ubuntu Server**: ✅ Deployment guide in `DEPLOYMENT.md` - uses standard PostgreSQL driver (auto-detected)
- **Docker**: ✅ Docker Compose support with internal or external PostgreSQL
- **Cloud Providers**: ✅ Works with AWS, Azure, Digital Ocean, Heroku - see `DEPLOYMENT.md`

## Database Auto-Detection (October 18, 2025)

The application **automatically detects** which database driver to use based on your DATABASE_URL:

### Automatic Detection
1. **Neon Database**: If DATABASE_URL contains `neon.tech` or `neon.app`, uses `@neondatabase/serverless` with WebSocket connections
2. **Standard PostgreSQL**: All other DATABASE_URLs use the standard `pg` driver

### Manual Override (Optional)
You can explicitly set the driver using the `DATABASE_DRIVER` environment variable:

```env
# Force Neon driver
DATABASE_DRIVER=neon

# Force standard PostgreSQL driver (accepts 'pg' or 'postgres')
DATABASE_DRIVER=pg
DATABASE_DRIVER=postgres

# Auto-detect based on URL (default behavior)
DATABASE_DRIVER=auto
```

**Note**: Invalid values default to standard PostgreSQL for safety.

### Configuration Examples

**Replit with Neon (auto-detected)**:
```env
DATABASE_URL=postgresql://user:pass@ep-abc-123.us-east-2.aws.neon.tech/dbname
# No DATABASE_DRIVER needed - auto-detected as Neon
```

**Replit with External PostgreSQL**:
```env
DATABASE_URL=postgresql://user:pass@external-host.com:5432/dbname?sslmode=require
# No DATABASE_DRIVER needed - auto-detected as standard PostgreSQL
```

**Ubuntu / Docker / Cloud**:
```env
DATABASE_URL=postgresql://user:pass@localhost:5432/dbname?sslmode=disable
# No DATABASE_DRIVER needed - auto-detected as standard PostgreSQL
```

This eliminates the 504 timeout errors that occurred when the Neon WebSocket driver tried to connect to local PostgreSQL servers.

## External Dependencies
- **Database**: PostgreSQL
- **Email Services**:
    - SendGrid (API key configuration)
    - SMTP (for services like Gmail, Office 365)
- **Authentication**: Passport.js with scrypt password hashing
- **UI Libraries**: shadcn/ui, Tailwind CSS
- **Other**: Nodemailer, TanStack Query, Wouter, React Hook Form, Zod.