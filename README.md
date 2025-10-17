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
  - Printable 85mm x 54mm labels (standard ID card size)
  - QR code links to asset details page for quick scanning
  - Includes company logo, location, date, and asset information
  - Two labels per page for cutting and backup
- **Depreciation Calculator**: Automatic asset value tracking using straight-line and declining balance methods
- **Custom Fields**: Dynamic field definitions for different asset types
- **Location Management**: Physical location tracking with dropdown selection
- **CSV Import/Export**: Bulk asset import and export functionality

### Employee & User Management
- **Employee Directory**: Comprehensive employee and contractor management
- **Manual Employee Creation**: Add employees individually with role assignment
- **Bulk Employee Upload**: CSV import for adding multiple employees at once
- **CSV Template Download**: Pre-formatted template for bulk uploads
- **Role-Based Access Control**: Admin, Manager, and Employee roles with granular permissions

### Assignment & Workflow
- **Check-In/Check-Out System**: Streamlined asset assignment workflow
- **Assignment History**: Complete audit trail of asset assignments
- **Asset Notes**: Maintenance logs and observations
- **Return Tracking**: Monitor asset returns and condition

### Authentication & Security
- **First-Time Setup**: Automated admin account creation on first deployment
- **Username/Password Authentication**: Secure login with bcrypt password hashing
- **Session Management**: Secure session-based authentication with PostgreSQL storage
- **Personal Profile Management**: Users can update their own information and change passwords
- **User Management**: Admin CRUD interface for managing user accounts
- **Self-Deletion Protection**: Prevents accidental admin account deletion

### Organization & Departments
- **Department Management**: Organize assets and employees by department
- **Department Statistics**: Track asset distribution and value by department
- **Location Statistics**: Monitor asset count and total value per location

### System Administration
- **System Health Dashboard**: Real-time monitoring of database and server status
- **Asset Distribution Analytics**: Visual charts showing assets by status
- **Audit Trail**: Complete history of all asset-related activities
- **Recent Activity Feed**: Monitor latest system actions
- **Resource Overview**: Track departments, locations, and audit entries

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
- **bcrypt** for password hashing

### DevOps & Deployment
- **Docker** support with multi-stage builds
- **PM2** for process management
- **Nginx** reverse proxy configuration
- Compatible with **AWS**, **Digital Ocean**, **Azure**, **Heroku**

## 📋 Prerequisites

- **Node.js** 20.x or higher
- **PostgreSQL** 15 or higher
- **npm** or **yarn** package manager
- **Domain Name** (for SSL/HTTPS deployment)

## 🚀 Production Deployment

### Quick Production Deploy (5 minutes)

```bash
# Clone repository
git clone https://github.com/yourusername/AssetTrackr.git
cd AssetTrackr

# Configure environment
cp .env.production.example .env
nano .env  # Configure domain, database, secrets

# Deploy with automated script
./deploy.sh

# Access: https://yourdomain.com
```

**What you get:**
- ✅ Automatic HTTPS with Let's Encrypt
- ✅ Auto-renewal every 60 days
- ✅ Traefik reverse proxy
- ✅ Supports local or external databases
- ✅ Production-ready security

### 📚 Documentation

- **[FIRST_TIME_SETUP.md](FIRST_TIME_SETUP.md)** - First-time setup guide (port 5000) ⭐
- **[DATABASE_STATUS_AND_RESET.md](DATABASE_STATUS_AND_RESET.md)** - Database status check & reset options ⭐
- **[PRODUCTION_DEPLOYMENT.md](PRODUCTION_DEPLOYMENT.md)** - Complete deployment guide ⭐
- **[CLOUD_DEPLOYMENT_GUIDE.md](CLOUD_DEPLOYMENT_GUIDE.md)** - AWS, Azure, Google Cloud, DigitalOcean, Ubuntu ⭐
- **[DOCKER_INSTALLATION_GUIDE.md](DOCKER_INSTALLATION_GUIDE.md)** - Docker installation for all platforms
- **[DEPLOYMENT_QUICK_REFERENCE.md](DEPLOYMENT_QUICK_REFERENCE.md)** - Quick deployment reference
- **[DEPLOYMENT_SOLUTION.md](DEPLOYMENT_SOLUTION.md)** - Quick start & what's fixed
- **[DIGITALOCEAN_DATABASE_SETUP.md](DIGITALOCEAN_DATABASE_SETUP.md)** - DigitalOcean database setup
- **[EXTERNAL_DATABASE_SETUP.md](EXTERNAL_DATABASE_SETUP.md)** - Other external database providers

### 🗄️ Database Options

#### Local PostgreSQL (Containerized)
```env
USE_EXTERNAL_DB=false
PGUSER=asset_user
PGPASSWORD=secure_password
PGDATABASE=asset_management
```

#### External Managed Database (Recommended)
Supports: DigitalOcean, AWS RDS, Azure, Google Cloud SQL, Neon, Supabase

```env
USE_EXTERNAL_DB=true
DATABASE_URL=postgresql://user:pass@host:port/db?sslmode=require
NODE_TLS_REJECT_UNAUTHORIZED=0  # For managed databases
```

### ☁️ Cloud Provider Deployments

**Complete guides for all major cloud platforms:**

| Platform | Deployment Options | Database Options | Guide |
|----------|-------------------|------------------|-------|
| **AWS** | EC2, Elastic Beanstalk, ECS/Fargate | RDS PostgreSQL | [View Guide](CLOUD_DEPLOYMENT_GUIDE.md#aws-deployment) |
| **Azure** | App Service, Container Instances, AKS | Azure Database for PostgreSQL | [View Guide](CLOUD_DEPLOYMENT_GUIDE.md#azure-deployment) |
| **Google Cloud** | Cloud Run, Compute Engine, GKE | Cloud SQL PostgreSQL | [View Guide](CLOUD_DEPLOYMENT_GUIDE.md#google-cloud-deployment) |
| **DigitalOcean** | Droplet, App Platform, DOKS | Managed Database | [View Guide](CLOUD_DEPLOYMENT_GUIDE.md#digitalocean-deployment) |
| **Ubuntu Server** | Docker, PM2 + Nginx | Local/External PostgreSQL | [View Guide](CLOUD_DEPLOYMENT_GUIDE.md#ubuntu-server-deployment) |

**Managed Database Support:**
- ✅ AWS RDS PostgreSQL
- ✅ Azure Database for PostgreSQL
- ✅ Google Cloud SQL
- ✅ DigitalOcean Managed Database
- ✅ Neon (Serverless PostgreSQL)
- ✅ Supabase
- ✅ Self-hosted PostgreSQL

**📖 [CLOUD_DEPLOYMENT_GUIDE.md](CLOUD_DEPLOYMENT_GUIDE.md)** - Complete step-by-step instructions for all platforms

---

## 🚀 Development Deployment (Port 5000)

### Option 1: Docker (Recommended - 5 Minutes)

```bash
# Clone repository
git clone https://github.com/moomentsadmin/AssetTrackr.git
cd AssetTrackr

# Create environment file
cp .env.example .env
nano .env  # Update PGPASSWORD and SESSION_SECRET

# Start with Docker Compose
docker compose up -d

# Access application
# http://localhost:5000
```

See [DOCKER_QUICKSTART.md](DOCKER_QUICKSTART.md) for detailed Docker deployment guide.

### Option 2: Manual Setup

### 1. Clone the Repository

```bash
git clone https://github.com/moomentsadmin/AssetTrackr.git
cd AssetTrackr
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Create a `.env` file:

```env
NODE_ENV=development
PORT=5000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/asset_management
PGHOST=localhost
PGPORT=5432
PGDATABASE=asset_management
PGUSER=your_user
PGPASSWORD=your_password

# Security
SESSION_SECRET=your_secure_session_secret_min_32_chars
```

### 4. Set Up Database

```bash
# Run database migrations
npm run db:push
```

### 5. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5000`

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
- Create and manage employees (manual and CSV)
- Manage locations
- Configure custom fields
- Import data
- Configure company branding
- Access settings

### Admin (Full Control)
- All Manager features
- System health monitoring
- User management (create, edit, delete users)
- Full system configuration

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
- `PATCH /api/assets/:id/depreciation` - Update depreciation
- `POST /api/assets/:id/calculate-depreciation` - Auto-calculate depreciation

### Assignments
- `GET /api/assignments` - List assignments
- `POST /api/assignments` - Create assignment
- `PATCH /api/assignments/:id/return` - Return asset

### Other Endpoints
- Departments: `GET/POST/PATCH/DELETE /api/departments`
- Locations: `GET/POST/PATCH/DELETE /api/locations`
- Audit Trail: `GET /api/audit`
- Custom Fields: `GET/POST/DELETE /api/custom-fields`
- Import: `POST /api/import/csv`, `POST /api/import/users`
- Settings: `GET/POST /api/settings/email`, `GET/POST /api/settings/system`

## 🛠️ Production Management

### Common Commands

```bash
# Start application
docker compose -f docker-compose.production.yml up -d

# Stop application
docker compose -f docker-compose.production.yml down

# View logs
docker compose -f docker-compose.production.yml logs -f app

# Restart application
docker compose -f docker-compose.production.yml restart app

# Rebuild after code changes
docker compose -f docker-compose.production.yml up -d --build

# Run database migrations
docker compose -f docker-compose.production.yml exec app npm run db:push
```

### Deployment Modes

**Local Database:**
```bash
docker compose -f docker-compose.production.yml --profile local-db up -d --build
```

**External Database:**
```bash
docker compose -f docker-compose.production.yml up -d --build
```

## 🔐 Security Features

- **Bcrypt Password Hashing**: All passwords encrypted with industry-standard hashing
- **Session-Based Authentication**: Secure session management with PostgreSQL storage
- **Role-Based Access Control**: Granular permissions for different user types
- **Environment Variables**: Sensitive data stored securely
- **SQL Injection Protection**: Parameterized queries via Drizzle ORM
- **CSRF Protection**: Built-in protection against cross-site attacks
- **Input Validation**: Zod schema validation on all inputs
- **Audit Trail**: Complete logging of all asset activities

## 📈 Usage Examples

### Creating Assets

1. Navigate to "Assets" page
2. Click "Add Asset"
3. Fill in asset details:
   - Name, type, serial number
   - Purchase date and cost
   - Status and location
   - Optional photo URL
4. Add custom fields as needed
5. Click "Add Asset"

### Bulk Employee Import

1. Navigate to "Employees" page
2. Click "Bulk Upload"
3. Download CSV template
4. Fill template with employee data
5. Upload completed CSV
6. Review and confirm import

### Assigning Assets

1. Go to asset details
2. Click "Assign"
3. Select employee
4. Add assignment notes
5. Confirm assignment

### Monitoring System Health

1. Navigate to "System Health" (Admin only)
2. View database and server status
3. Check asset distribution charts
4. Monitor recent activity
5. Review system resources

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
├── DEPLOYMENT.md         # Deployment documentation
└── package.json          # Dependencies and scripts
```

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [shadcn/ui](https://ui.shadcn.com/) components
- Icons by [Lucide](https://lucide.dev/)
- Powered by [Drizzle ORM](https://orm.drizzle.team/)
- Hosted on [Replit](https://replit.com/)

## 📞 Support

For issues, questions, or contributions:
- Open an issue on GitHub
- Check the [DEPLOYMENT.md](DEPLOYMENT.md) for deployment help
- Review the [replit.md](replit.md) for technical architecture details

## 🗺️ Roadmap

- [x] Asset QR code label generation
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
