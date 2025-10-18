# Asset Management System

A comprehensive IT asset management system for tracking hardware, software, licenses, and equipment assigned to employees and contractors. Built with modern web technologies and designed for enterprise use.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-20.x-green.svg)
![PostgreSQL](https://img.shields.io/badge/postgresql-15%2B-blue.svg)

## 🚀 Features

### Core Asset Management
- **Multi-Type Asset Tracking**: Hardware, software licenses, accessories, office equipment, and vehicles
- **Asset Lifecycle Management**: Track assets from procurement to disposal
- **Status Tracking**: Available, assigned, in maintenance, retired, and lost status monitoring
- **Asset Photos**: Store photo URLs for visual asset documentation
- **QR Code Labels**: Print professional asset labels with QR codes for physical tracking
- **Depreciation Calculator**: Automatic asset value tracking using straight-line and declining balance methods
- **Custom Fields**: Dynamic field definitions for different asset types
- **Location Management**: Physical location tracking with dropdown selection
- **CSV Import/Export**: Bulk asset import and export functionality

### Employee & User Management
- **Employee Directory**: Comprehensive employee and contractor management
- **Bulk Employee Upload**: CSV import for adding multiple employees at once
- **Role-Based Access Control**: Admin, Manager, and Employee roles with granular permissions

### Assignment & Workflow
- **Check-In/Check-Out System**: Streamlined asset assignment workflow
- **Assignment History**: Complete audit trail of asset assignments
- **Asset Notes**: Maintenance logs and observations
- **Return Tracking**: Monitor asset returns and condition

### Authentication & Security
- **First-Time Setup**: Automated admin account creation on first deployment
- **Secure Authentication**: Username/password with scrypt password hashing
- **Session Management**: Secure session-based authentication with PostgreSQL storage
- **Role-Based Access Control**: Granular permissions for different user types

### System Administration
- **System Health Dashboard**: Real-time monitoring of database and server status
- **Asset Distribution Analytics**: Visual charts showing assets by status
- **Audit Trail**: Complete history of all asset-related activities
- **Recent Activity Feed**: Monitor latest system actions

### Branding & Customization
- **Company Branding**: Configure company name, logo URL, and website
- **Logo Display**: Company logo on login and dashboard pages
- **Header/Footer Text**: Custom text shown throughout application
- **Currency Selection**: Support for USD, EUR, GBP, JPY, CAD, AUD, INR
- **Dark Mode**: Full dark mode support with modern, clean UI

### Email Notifications
- **Multiple Providers**: SendGrid, Gmail (SMTP), Office 365 support
- **Configurable Alerts**: Asset assignments, warranty expiry, return reminders
- **Email Settings Management**: Easy configuration through admin interface

## 🏗️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **TanStack Query** for data fetching and caching
- **Wouter** for client-side routing
- **shadcn/ui** components with Tailwind CSS
- **React Hook Form** with Zod validation
- **Lucide React** icons

### Backend
- **Express.js** with TypeScript
- **PostgreSQL** with Drizzle ORM
- **Passport.js** for authentication
- **Nodemailer** for email notifications
- **Session-based auth** with connect-pg-simple
- **scrypt** for password hashing

### DevOps & Deployment
- **Docker** support with multi-stage builds
- **PM2** for process management
- **Nginx** reverse proxy configuration
- Compatible with **AWS**, **Digital Ocean**, **Azure**, **Heroku**, **Replit**

## 📋 Prerequisites

- **Node.js** 20.x or higher
- **PostgreSQL** 15 or higher
- **npm** package manager
- **Domain Name** (optional, for SSL/HTTPS deployment)

## 🚀 Quick Start

### Development (Replit or Local)

```bash
# Clone repository
git clone https://github.com/moomentsadmin/AssetTrack.git
cd AssetTrack

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database credentials

# Run database migrations
npm run db:push

# Start development server
npm run dev

# Access application at http://localhost:5000
```

### Production Deployment

See **[DEPLOYMENT.md](DEPLOYMENT.md)** for comprehensive deployment guides including:
- Ubuntu Server (PM2 + Nginx)
- Docker / Docker Compose
- AWS (EC2, RDS, Elastic Beanstalk)
- Digital Ocean (Droplets, App Platform, Managed Database)
- Azure (App Service, Azure Database for PostgreSQL)

## 🗄️ Database Support

### Replit / Neon Database (Auto-Detected)
The application automatically detects Neon database connections and uses the appropriate WebSocket driver.

### Self-Hosted PostgreSQL (Auto-Detected)
For Ubuntu, Docker, or cloud deployments with standard PostgreSQL, the application automatically uses the standard `pg` driver.

**No configuration needed** - the app auto-detects which driver to use based on your DATABASE_URL!

### Environment Variables

```env
NODE_ENV=production
PORT=5000

# Database (choose one format)
DATABASE_URL=postgresql://user:password@host:5432/database

# OR use separate variables
PGHOST=localhost
PGPORT=5432
PGDATABASE=asset_management
PGUSER=your_user
PGPASSWORD=your_password

# Security
SESSION_SECRET=your_secure_session_secret_min_32_chars
```

## 🎯 First-Time Setup

On first deployment or when the database is empty:

1. Navigate to the application URL
2. The setup page will automatically appear
3. Fill in the admin account details:
   - **Full Name**: Your full name
   - **Email**: Your email address
   - **Username**: Choose a username (min. 3 characters)
   - **Password**: Choose a secure password (min. 8 characters)
4. Click "Create Admin Account"
5. You'll be automatically logged in as the admin

**Security Notes**: 
- Setup requires custom credentials - no hard-coded defaults
- Setup can only be run once per deployment
- Public registration is disabled - only admins can create new accounts

## 📱 User Roles & Permissions

### Employee (Most Restrictive)
- View dashboard and assets
- View employees and departments
- View audit trail
- Manage personal profile

### Manager
- All Employee features
- Create and manage employees
- Manage locations and custom fields
- Import data
- Configure company branding

### Admin (Full Control)
- All Manager features
- System health monitoring
- User management (create, edit, delete users)
- Full system configuration

## 🔧 Common Deployment Issues

### 504 Gateway Timeout on Ubuntu
**Cause**: Database connection issues  
**Solution**: Ensure `?sslmode=disable` is in DATABASE_URL for localhost  
**Details**: See `.github/ISSUE_TEMPLATE/deployment-ubuntu-504-timeout.md`

### User Cannot Login After Creation
**Cause**: Password hash incompatibility  
**Solution**: Delete user and recreate through first-time setup  
**Details**: See `.github/ISSUE_TEMPLATE/user-creation-password.md`

### Docker Container Exits Immediately
**Cause**: Database not ready  
**Solution**: Use Docker Compose with health checks  
**Details**: See `.github/ISSUE_TEMPLATE/deployment-docker.md`

## 📊 API Endpoints

### Authentication & Setup
- `GET /api/setup/status` - Check if first-time setup is required
- `POST /api/setup` - Create admin account (first-time only)
- `POST /api/login` - User login
- `POST /api/logout` - User logout
- `GET /api/user` - Get current user

### User Management
- `GET /api/users` - List all users (admin only)
- `POST /api/users` - Create user (admin/manager)
- `PATCH /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user (admin only)

### Assets
- `GET /api/assets` - List all assets
- `POST /api/assets` - Create asset
- `PATCH /api/assets/:id` - Update asset
- `DELETE /api/assets/:id` - Delete asset

### Other Endpoints
- Departments: `GET/POST/PATCH/DELETE /api/departments`
- Locations: `GET/POST/PATCH/DELETE /api/locations`
- Audit Trail: `GET /api/audit`
- Custom Fields: `GET/POST/DELETE /api/custom-fields`
- Import: `POST /api/import/csv`, `POST /api/import/users`
- Settings: `GET/POST /api/settings/email`, `GET/POST /api/settings/system`

## 🔐 Security Features

- **scrypt Password Hashing**: All passwords encrypted with modern cryptographic hashing
- **Session-Based Authentication**: Secure session management with PostgreSQL storage
- **Role-Based Access Control**: Granular permissions for different user types
- **Environment Variables**: Sensitive data stored securely
- **SQL Injection Protection**: Parameterized queries via Drizzle ORM
- **Input Validation**: Zod schema validation on all inputs
- **Audit Trail**: Complete logging of all asset activities
- **GDPR Compliant**: No unnecessary logging of user activities

## 🛠️ Development

### Build Production Version

```bash
npm run build
npm start
```

### Database Commands

```bash
# Push schema changes
npm run db:push

# Generate TypeScript types
npm run check
```

### Project Structure

```
asset-management/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── lib/           # Utilities and helpers
│   │   └── pages/         # Page components
├── server/                # Backend Express application
│   ├── index.ts          # Server entry point
│   ├── routes.ts         # API routes
│   ├── auth.ts           # Authentication logic
│   └── db.ts             # Database connection
├── shared/               # Shared types and schemas
│   └── schema.ts         # Drizzle schema definitions
├── .github/              # GitHub issue templates
│   └── ISSUE_TEMPLATE/   # Deployment troubleshooting guides
├── DEPLOYMENT.md         # Comprehensive deployment guide
├── design_guidelines.md  # Frontend design guidelines
├── replit.md            # Technical architecture docs
└── package.json         # Dependencies and scripts
```

## 📚 Documentation

- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Complete deployment guide for all platforms
- **[replit.md](replit.md)** - Technical architecture and feature documentation
- **[design_guidelines.md](design_guidelines.md)** - Frontend design system
- **[.github/ISSUE_TEMPLATE/](.github/ISSUE_TEMPLATE/)** - Common deployment issue solutions

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Built with [shadcn/ui](https://ui.shadcn.com/) components
- Icons by [Lucide](https://lucide.dev/)
- Powered by [Drizzle ORM](https://orm.drizzle.team/)
- Hosted on [Replit](https://replit.com/)

## 📞 Support

For issues, questions, or contributions:
- Open an issue on GitHub
- Check [DEPLOYMENT.md](DEPLOYMENT.md) for deployment help
- Review [.github/ISSUE_TEMPLATE/](.github/ISSUE_TEMPLATE/) for common issues
- See [replit.md](replit.md) for technical architecture details

## 🗺️ Roadmap

- [x] Asset QR code label generation
- [x] Database auto-detection (Neon vs PostgreSQL)
- [x] Docker deployment support
- [x] Comprehensive deployment documentation
- [ ] Mobile responsive enhancements
- [ ] Advanced reporting and analytics
- [ ] Multi-language support
- [ ] API documentation with Swagger
- [ ] Maintenance scheduling
- [ ] Asset reservation system
- [ ] Barcode scanner integration
- [ ] Mobile app for asset scanning

---

**Built with ❤️ for efficient asset management**
