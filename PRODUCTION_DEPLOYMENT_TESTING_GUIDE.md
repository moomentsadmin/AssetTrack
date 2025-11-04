# Production Deployment Testing Guide

This comprehensive guide covers testing the AssetTrack application across different deployment scenarios including Docker, Ubuntu servers, and cloud providers with various database configurations.

## 🚀 Deployment Scenarios Overview

### 1. Docker Deployments
- **Internal PostgreSQL**: Docker Compose with local PostgreSQL container
- **External Managed Databases**: Docker with RDS, Azure DB, DigitalOcean Managed DB
- **SSL/TLS Enabled**: Production-ready with Traefik reverse proxy and Let's Encrypt

### 2. Ubuntu Server Deployments
- **Local PostgreSQL**: Direct installation with local database
- **External Database**: Ubuntu server with managed database

### 3. Cloud Provider Deployments
- **AWS RDS**: Amazon's managed PostgreSQL service
- **Azure Database**: Microsoft's managed PostgreSQL
- **DigitalOcean Managed DB**: DigitalOcean's database service

## 📋 Testing Checklist

### Pre-Deployment Tests
- [ ] Environment variables configured correctly
- [ ] Database connection strings validated
- [ ] SSL certificates configured (if required)
- [ ] Security headers enabled
- [ ] Health check endpoints working

### Deployment Tests
- [ ] Container builds successfully
- [ ] Database migrations complete
- [ ] Application starts without errors
- [ ] Static assets served correctly
- [ ] API endpoints responding
- [ ] Authentication working
- [ ] Database operations functional

### Post-Deployment Tests
- [ ] SSL/TLS certificates valid
- [ ] Reverse proxy configuration correct
- [ ] Load balancing working
- [ ] Monitoring and logging active
- [ ] Backup procedures tested

## 🔧 Docker Deployment Tests

### Test 1: Internal PostgreSQL Database

**Configuration File**: `docker-compose.yml`

```bash
# Create environment file
cp .env.example .env

# Edit .env with your values
nano .env

# Build and start services
docker compose up -d --build

# Check service status
docker compose ps

# View logs
docker compose logs -f app

# Test application
curl http://localhost:5000/health
```

**Expected Results**:
- ✅ PostgreSQL container starts successfully
- ✅ Application container builds without errors
- ✅ Database migrations complete
- ✅ Health check returns 200 OK
- ✅ Application accessible on port 5000

### Test 2: External Managed Database (RDS, Azure, DigitalOcean)

**Configuration File**: `docker-compose.ssl-external-db.yml`

```bash
# Create external database environment file
cp .env.external-db.example .env

# Configure your managed database details
nano .env

# Set up external database (example for DigitalOcean)
# 1. Create managed database cluster
# 2. Add your server IP to trusted sources
# 3. Get connection details

# Test database connection
psql $DATABASE_URL

# Deploy with external database
docker compose -f docker-compose.ssl-external-db.yml up -d --build

# Verify SSL connection
docker compose -f docker-compose.ssl-external-db.yml logs app | grep -i ssl
```

**Provider-Specific Configurations**:

#### DigitalOcean Managed Database
```env
DATABASE_URL=postgresql://doadmin:your_password@db-postgresql-nyc1-12345.ondigitalocean.com:25060/defaultdb?sslmode=require
NODE_TLS_REJECT_UNAUTHORIZED=1
```

#### AWS RDS PostgreSQL
```env
DATABASE_URL=postgresql://postgres:your_password@mydb.abc123.us-east-1.rds.amazonaws.com:5432/asset_management?sslmode=require
NODE_TLS_REJECT_UNAUTHORIZED=1
```

#### Azure Database for PostgreSQL
```env
DATABASE_URL=postgresql://user@server:password@server.postgres.database.azure.com:5432/asset_management?sslmode=require
NODE_TLS_REJECT_UNAUTHORIZED=1
```

**Expected Results**:
- ✅ External database connection established
- ✅ SSL/TLS encryption active
- ✅ Database migrations run successfully
- ✅ Application serves content over HTTPS
- ✅ Traefik reverse proxy configured correctly

### Test 3: SSL/TLS with Traefik Reverse Proxy

**Configuration File**: `docker-compose.production.yml`

```bash
# Configure domain and SSL
echo "DOMAIN=yourdomain.com" >> .env
echo "LETSENCRYPT_EMAIL=admin@yourdomain.com" >> .env

# Generate Traefik dashboard password
htpasswd -nB admin

# Add to .env
echo "TRAEFIK_DASHBOARD_AUTH=admin:your_hashed_password" >> .env

# Deploy production setup
docker compose -f docker-compose.production.yml up -d --build

# Verify SSL certificate
openssl s_client -connect yourdomain.com:443 -servername yourdomain.com

# Test HTTPS redirect
curl -I http://yourdomain.com
```

**Expected Results**:
- ✅ SSL certificate issued by Let's Encrypt
- ✅ HTTPS redirect working (HTTP → HTTPS)
- ✅ Traefik dashboard accessible
- ✅ Application served over HTTPS
- ✅ Security headers present

## 🖥️ Ubuntu Server Deployment Tests

### Test 4: Local PostgreSQL Installation

**Prerequisites**:
```bash
# System update
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Install PM2
sudo npm install -g pm2
```

**Database Setup**:
```bash
# Create database and user
sudo -u postgres psql
CREATE DATABASE asset_management_prod;
CREATE USER asset_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE asset_management_prod TO asset_user;
\q
```

**Application Deployment**:
```bash
# Clone repository
git clone https://github.com/yourusername/AssetTrack.git
cd AssetTrack

# Install dependencies
npm ci

# Configure environment
cp .env.example .env.production
nano .env.production

# Build application
npm run build

# Run migrations
npm run db:push

# Start with PM2
pm2 start ecosystem.config.cjs --env production
pm2 save
pm2 startup systemd
```

**Expected Results**:
- ✅ PostgreSQL service running
- ✅ Application builds successfully
- ✅ Database migrations complete
- ✅ PM2 process management active
- ✅ Application accessible on configured port

### Test 5: Ubuntu with External Database

**Additional Configuration**:
```bash
# Configure firewall for external database
sudo ufw allow from your-db-ip to any port 5432

# Test external database connection
psql $DATABASE_URL

# Update environment file for external DB
nano .env.production
```

## ☁️ Cloud Provider Specific Tests

### Test 6: AWS RDS Integration

**RDS Configuration**:
```bash
# Create RDS parameter group
aws rds create-db-parameter-group \
  --db-parameter-group-name asset-management-pg \
  --db-parameter-group-family postgres15 \
  --description "Asset Management PostgreSQL Parameters"

# Modify parameters for better performance
aws rds modify-db-parameter-group \
  --db-parameter-group-name asset-management-pg \
  --parameters \
    "ParameterName=max_connections,ParameterValue=200,ApplyMethod=immediate" \
    "ParameterName=shared_buffers,ParameterValue=256MB,ApplyMethod=pending-reboot"

# Create RDS instance
aws rds create-db-instance \
  --db-instance-identifier asset-management-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 15.4 \
  --master-username postgres \
  --master-user-password your_secure_password \
  --allocated-storage 20 \
  --db-parameter-group-name asset-management-pg \
  --vpc-security-group-ids sg-xxxxxxxx \
  --db-subnet-group-name your-db-subnet-group
```

**Connection Testing**:
```bash
# Get RDS endpoint
aws rds describe-db-instances \
  --db-instance-identifier asset-management-db \
  --query 'DBInstances[0].Endpoint.Address'

# Test connection
psql "postgresql://postgres:password@asset-management-db.abc123.us-east-1.rds.amazonaws.com:5432/postgres?sslmode=require"
```

### Test 7: Azure Database for PostgreSQL

**Azure CLI Configuration**:
```bash
# Create resource group
az group create --name asset-management-rg --location eastus

# Create PostgreSQL server
az postgres server create \
  --resource-group asset-management-rg \
  --name asset-management-db \
  --location eastus \
  --admin-user myadmin \
  --admin-password SecurePassword123! \
  --sku-name GP_Gen5_2 \
  --version 15

# Configure firewall rules
az postgres server firewall-rule create \
  --resource-group asset-management-rg \
  --server-name asset-management-db \\  --name AllowYourIP \
  --start-ip-address YOUR_IP \
  --end-ip-address YOUR_IP
```

### Test 8: DigitalOcean Managed Database

**DigitalOcean Configuration**:
```bash
# Create managed database cluster
doctl databases create asset-management-db \
  --engine pg \
  --version 15 \
  --region nyc1 \
  --size db-s-dev-database-s-1vcpu-1gb \
  --num-nodes 1

# Get connection details
DATABASE_URL=$(doctl databases get asset-management-db --format Connection.Postgres)

# Add trusted source
doctl databases firewalls append asset-management-db \
  --rule type:ip_addr,value:YOUR_IP
```

## 🔍 Database Migration Testing

### Migration Validation Tests

```bash
# Test migration scripts
npm run db:push

# Verify schema
psql $DATABASE_URL -c "\dt"

# Check migration history
psql $DATABASE_URL -c "SELECT * FROM __drizzle_migrations__"

# Test data integrity
npm run test:db-integrity
```

### Performance Tests

```bash
# Connection pool testing
npm run test:connection-pool

# Query performance
npm run test:query-performance

# Load testing
npm run test:load
```

## 🔒 Security Testing

### SSL/TLS Validation

```bash
# Certificate validation
openssl s_client -connect yourdomain.com:443 -servername yourdomain.com

# Security headers check
curl -I https://yourdomain.com | grep -E "(X-Frame-Options|X-Content-Type-Options|X-XSS-Protection)"

# Vulnerability scan
npm audit
```

### Database Security

```bash
# SSL connection test
psql $DATABASE_URL -c "SELECT version()" --set=sslmode=require

# User privileges check
psql $DATABASE_URL -c "\du"

# Database encryption status
psql $DATABASE_URL -c "SELECT name, setting FROM pg_settings WHERE name LIKE '%ssl%'"
```

## 📊 Monitoring and Logging

### Health Checks

```bash
# Application health
curl http://localhost:5000/health

# Database health
curl http://localhost:5000/health/db

# System health
curl http://localhost:5000/health/system
```

### Log Analysis

```bash
# Application logs
docker compose logs app --tail 100

# Database logs
docker compose logs db --tail 100

# System logs
journalctl -u pm2-asset-management -f
```

## 🚨 Troubleshooting Common Issues

### Database Connection Issues

1. **Connection Refused**
   ```bash
   # Check database status
   docker compose ps db
   
   # Verify connection string
   echo $DATABASE_URL
   
   # Test connection
   pg_isready -h $PGHOST -p $PGPORT -U $PGUSER
   ```

2. **SSL Certificate Issues**
   ```bash
   # Disable SSL verification (development only)
   NODE_TLS_REJECT_UNAUTHORIZED=0
   
   # Update SSL mode
   PGSSLMODE=require
   ```

3. **Authentication Failed**
   ```bash
   # Reset database password
   docker compose exec db psql -U postgres -c "ALTER USER $PGUSER WITH PASSWORD 'new_password';"
   ```

### Application Issues

1. **Build Failures**
   ```bash
   # Clear npm cache
   npm cache clean --force
   
   # Reinstall dependencies
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **Migration Failures**
   ```bash
   # Reset database
   npm run db:reset
   
   # Run migrations manually
   npx drizzle-kit push
   ```

3. **Port Conflicts**
   ```bash
   # Check port usage
   netstat -tulpn | grep :5000
   
   # Kill process using port
   sudo kill -9 $(sudo lsof -t -i:5000)
   ```

## ✅ Deployment Validation Checklist

### Before Going Live

- [ ] All environment variables configured
- [ ] Database connection tested and secured
- [ ] SSL certificates installed and valid
- [ ] Security headers configured
- [ ] Backup procedures tested
- [ ] Monitoring and alerting active
- [ ] Load testing completed
- [ ] Security audit passed
- [ ] Documentation updated
- [ ] Rollback plan prepared

### Post-Deployment Verification

- [ ] Application accessible via HTTPS
- [ ] Database operations working
- [ ] User authentication functional
- [ ] File uploads/downloads working
- [ ] Email notifications (if configured)
- [ ] Performance metrics acceptable
- [ ] Error rates within acceptable limits
- [ ] Security scans passing

## 📞 Support and Maintenance

### Regular Maintenance Tasks

1. **Weekly**
   - Check application logs for errors
   - Verify database backups
   - Monitor resource usage
   - Review security alerts

2. **Monthly**
   - Update dependencies
   - Review performance metrics
   - Test disaster recovery procedures
   - Security patch assessment

3. **Quarterly**
   - Full security audit
   - Performance optimization review
   - Capacity planning assessment
   - Documentation updates

### Emergency Procedures

1. **Application Down**
   - Check service status
   - Review recent logs
   - Restart services if needed
   - Contact support team

2. **Database Issues**
   - Verify connection
   - Check disk space
   - Review query performance
   - Restore from backup if necessary

3. **Security Incident**
   - Isolate affected systems
   - Review access logs
   - Change compromised credentials
   - Notify stakeholders

---

## 🎯 Next Steps

After completing these tests:

1. **Document Results**: Record all test outcomes
2. **Address Issues**: Fix any problems found
3. **Performance Tuning**: Optimize based on test results
4. **Security Hardening**: Implement additional security measures
5. **Monitoring Setup**: Configure comprehensive monitoring
6. **Backup Testing**: Verify backup and recovery procedures
7. **Documentation**: Update deployment documentation
8. **Team Training**: Train team on deployment procedures

This comprehensive testing guide ensures your AssetTrack application is ready for production deployment across all major cloud providers and deployment scenarios.