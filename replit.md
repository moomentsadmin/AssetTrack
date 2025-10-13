# Asset Management System

A comprehensive IT asset management system for tracking hardware, software, licenses, and equipment assigned to employees and contractors.

## Overview

This full-stack application provides complete asset lifecycle management with role-based access control, depreciation tracking, audit trails, and email notifications.

## Features Implemented

### Core Functionality
- **Authentication**: Username/password authentication with role-based access (Admin, Manager, Employee)
- **Asset Management**: Full CRUD for multiple asset types with status tracking
- **Employee Management**: Track team members and contractors
- **Department Organization**: Organize assets and employees by department
- **Assignment Workflow**: Check-in/check-out assets with assignment history
- **Asset Notes**: Maintenance logs and observations
- **Audit Trail**: Complete history of all asset-related activities

### Advanced Features
- **Depreciation Calculator**: Automatic asset value tracking using straight-line and declining balance methods
- **Custom Fields**: Dynamic field definitions for different asset types
- **CSV Import**: Bulk asset import functionality
- **Email Notifications**: Configurable notifications via SendGrid, Gmail (SMTP), or Office 365
- **Search & Filters**: Asset search and filtering by status, type, and department
- **Dark Mode**: Full dark mode support with modern, clean UI

## Tech Stack

### Frontend
- React with TypeScript
- TanStack Query for data fetching
- Wouter for routing
- shadcn/ui components with Tailwind CSS
- React Hook Form with Zod validation

### Backend
- Express.js with TypeScript
- PostgreSQL with Drizzle ORM
- Passport.js for authentication
- Nodemailer for email notifications
- Session-based auth with connect-pg-simple

## Database Schema

### Main Tables
- **users**: User accounts with roles (admin, manager, employee)
- **assets**: Hardware, software, licenses, accessories, office equipment, vehicles
- **departments**: Organizational units
- **asset_assignments**: Assignment tracking with dates
- **asset_notes**: Maintenance logs and notes
- **audit_trail**: Complete activity history
- **custom_field_definitions**: Dynamic custom fields per asset type
- **email_settings**: SMTP/SendGrid configuration

## Default Credentials

**Admin Account:**
- Username: `admin`
- Password: `admin123`
- Email: admin@company.com

**Test Employees:**
- Username: `john.doe` / Password: `admin123` (Employee role)
- Username: `jane.smith` / Password: `admin123` (Manager role)

## API Endpoints

### Authentication
- POST `/api/register` - Register new user
- POST `/api/login` - Login
- POST `/api/logout` - Logout
- GET `/api/user` - Get current user

### Assets
- GET `/api/assets` - List all assets
- POST `/api/assets` - Create asset
- PATCH `/api/assets/:id` - Update asset
- DELETE `/api/assets/:id` - Delete asset
- PATCH `/api/assets/:id/depreciation` - Update depreciation
- POST `/api/assets/:id/calculate-depreciation` - Auto-calculate depreciation

### Assignments
- GET `/api/assignments` - List assignments
- POST `/api/assignments` - Create assignment
- PATCH `/api/assignments/:id/return` - Return asset

### Other Endpoints
- Departments: GET/POST/PATCH/DELETE `/api/departments`
- Users: GET `/api/users`
- Audit: GET `/api/audit`
- Custom Fields: GET/POST/DELETE `/api/custom-fields`
- Import: POST `/api/import/csv`
- Settings: GET/POST `/api/settings/email`

## Email Notifications

The system supports email notifications for:
- Asset assignments
- Warranty expiry alerts
- Return reminders

### Supported Providers
1. **SendGrid**: Configure API key in Settings
2. **SMTP** (Gmail, Office 365, etc.): Configure SMTP host, port, credentials

### Configuration
Navigate to Settings page to configure:
- Email provider (SendGrid or SMTP)
- SMTP host and port
- Authentication credentials
- From name and email
- Enable/disable notification types

## Recent Development

### Latest Updates (October 2025)
- Fixed custom field form initialization and filtering
- Added email notification integration with nodemailer
- Implemented depreciation auto-calculation based on purchase date
- Added comprehensive audit logging for all asset actions including depreciation
- Seeded default admin user and test data
- Completed end-to-end testing with successful validation

### Architecture Decisions
- Modern SaaS dashboard design with professional blue accent (hsl(217 91% 60%))
- Dark mode as primary theme with light mode support
- PostgreSQL for reliable data persistence
- Session-based authentication for security
- Custom fields stored as JSONB for flexibility
- Comprehensive audit trail for compliance

## Running the Application

The workflow "Start application" runs `npm run dev` which:
1. Starts Express server on port 5000
2. Serves Vite frontend
3. Connects to PostgreSQL database

Database migrations are handled via:
```bash
npm run db:push
```

## Next Steps for Production

1. **Email Configuration**: Set up SendGrid API key or SMTP credentials in Settings
2. **User Management**: Register additional users as needed
3. **Department Setup**: Create your organization's departments
4. **Custom Fields**: Define custom fields for your specific asset types
5. **Import Data**: Use CSV import for bulk asset upload
6. **Backup Strategy**: Configure PostgreSQL backups
7. **Environment Variables**: Ensure SESSION_SECRET is secure in production

## Notes

- All sensitive operations require authentication
- Admin users have full access to all features
- Managers can view and manage assets but not system settings
- Employees can view assets assigned to them
- All asset modifications are logged in audit trail
- Depreciation calculations persist to database
- Email notifications fire asynchronously to avoid blocking
