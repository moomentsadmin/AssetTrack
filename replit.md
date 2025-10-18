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
- **Organization**: Employee and department management, including bulk upload via CSV.
- **Audit Trail**: Comprehensive logging of all asset-related activities.
- **System Health**: Admin dashboard for monitoring system status and statistics.
- **Customization**: Configurable company branding (name, logo, website, currency, header/footer text).
- **Role-Based Access Control (RBAC)**: Strict authorization implemented in both frontend (ProtectedRoute, dynamic sidebar) and backend (middleware like `requireAdmin`).
    - **Employee**: Dashboard, Assets, Employees, Departments, Audit Trail, Profile.
    - **Manager**: All Employee features + Locations, Custom Fields, Import Data, Branding, Settings.
    - **Admin**: Full control including System Health and User Management.
- **Custom Fields**: Stored as JSONB for flexibility, allowing dynamic field definitions per asset type.
- **Email Notifications**: Configurable for asset assignments, warranty expiry, and return reminders, supporting SendGrid and generic SMTP.

## Security Enhancements
- **No Logging**: All `console.log`, `console.error`, `console.warn` statements removed from production code to prevent sensitive data exposure
- **Silent Operations**: Authentication, email, and error handling operate without logging
- **Data Privacy**: No user credentials, IP addresses, or personal information logged anywhere
- **GDPR Compliant**: No tracking or logging of user activities

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
- **Replit**: ✅ Fully functional and tested
- **Ubuntu (PM2 + Nginx)**: Deployment guide provided in `UBUNTU_DEPLOYMENT_GUIDE.md`
- **Docker**: Not officially supported (use PM2 deployment instead)

## External Dependencies
- **Database**: PostgreSQL
- **Email Services**:
    - SendGrid (API key configuration)
    - SMTP (for services like Gmail, Office 365)
- **Authentication**: Passport.js with scrypt password hashing
- **UI Libraries**: shadcn/ui, Tailwind CSS
- **Other**: Nodemailer, TanStack Query, Wouter, React Hook Form, Zod.