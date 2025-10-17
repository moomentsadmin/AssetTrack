# ☁️ Cloud Deployment Guide - All Major Providers

Complete deployment instructions for AWS, Azure, Google Cloud, DigitalOcean, and Ubuntu servers with various database configurations.

---

## 📋 Table of Contents

1. [AWS Deployment](#aws-deployment)
   - EC2 + RDS PostgreSQL
   - Elastic Beanstalk
   - ECS with Fargate
2. [Azure Deployment](#azure-deployment)
   - App Service + Azure Database
   - Container Instances
   - Azure Kubernetes Service (AKS)
3. [Google Cloud Deployment](#google-cloud-deployment)
   - Cloud Run + Cloud SQL
   - Compute Engine + Cloud SQL
   - Google Kubernetes Engine (GKE)
4. [DigitalOcean Deployment](#digitalocean-deployment)
   - Droplet + Managed Database
   - App Platform
   - Kubernetes (DOKS)
5. [Ubuntu Server Deployment](#ubuntu-server-deployment)
   - Docker + Local PostgreSQL
   - Docker + External Database
   - Traditional (PM2 + Nginx)

---

## 🔐 Database Configuration Options

All deployments support three database modes:

### Option 1: Local PostgreSQL (Containerized)
```env
USE_EXTERNAL_DB=false
PGUSER=asset_user
PGPASSWORD=secure_password
PGDATABASE=asset_management
```

### Option 2: External Managed Database
```env
USE_EXTERNAL_DB=true
DATABASE_URL=postgresql://user:pass@host:port/database?sslmode=require
NODE_TLS_REJECT_UNAUTHORIZED=0
```

### Option 3: Self-Hosted PostgreSQL
```env
USE_EXTERNAL_DB=true
DATABASE_URL=postgresql://user:pass@your-server:5432/assetdb?sslmode=disable
```

---

# AWS Deployment

## Option 1: EC2 + RDS PostgreSQL (Recommended)

### Step 1: Create RDS PostgreSQL Database

1. **Go to RDS Console:** https://console.aws.amazon.com/rds
2. **Create Database:**
   - Engine: PostgreSQL 15
   - Template: Production (or Dev/Test for lower cost)
   - DB Instance: db.t3.micro (free tier) or db.t3.small
   - Storage: 20GB SSD
   - **Important:** Enable "Public access" temporarily for setup
   - **Create database**

3. **Configure Security Group:**
   - Edit inbound rules
   - Add PostgreSQL (port 5432)
   - Source: Your EC2 security group ID

4. **Get Connection Details:**
   ```
   Endpoint: mydb.abc123.us-east-1.rds.amazonaws.com
   Port: 5432
   Username: postgres
   Password: [your password]
   Database: assetdb
   ```

### Step 2: Launch EC2 Instance

1. **Go to EC2 Console:** https://console.aws.amazon.com/ec2
2. **Launch Instance:**
   - AMI: Ubuntu Server 22.04 LTS
   - Instance Type: t2.small or t3.small
   - Key Pair: Create or select existing
   - Security Group:
     - SSH (22) - Your IP
     - HTTP (80) - Anywhere
     - HTTPS (443) - Anywhere

3. **Allocate Elastic IP:**
   - Go to Elastic IPs
   - Allocate new address
   - Associate with your EC2 instance

### Step 3: Configure Domain DNS

Point your domain to the Elastic IP:
```
Type    Name       Value
A       @          [Elastic IP]
A       www        [Elastic IP]
A       traefik    [Elastic IP]
```

### Step 4: Deploy Application

```bash
# SSH to EC2
ssh -i your-key.pem ubuntu@your-elastic-ip

# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker ubuntu

# Logout and login again for docker permissions
exit
ssh -i your-key.pem ubuntu@your-elastic-ip

# Clone repository
git clone https://github.com/yourusername/AssetTrackr.git
cd AssetTrackr

# Create .env
cp .env.production.example .env
nano .env
```

**Configure .env:**
```env
# Domain
DOMAIN=yourdomain.com
LETSENCRYPT_EMAIL=admin@yourdomain.com

# AWS RDS Database
USE_EXTERNAL_DB=true
DATABASE_URL=postgresql://postgres:yourpassword@mydb.abc123.us-east-1.rds.amazonaws.com:5432/assetdb?sslmode=require
NODE_TLS_REJECT_UNAUTHORIZED=0

# Security
SESSION_SECRET=$(openssl rand -base64 32)
```

**Deploy:**
```bash
# Deploy with external database
docker compose -f docker-compose.production.yml up -d --build

# Check logs
docker compose -f docker-compose.production.yml logs -f app

# Access: https://yourdomain.com
```

### Step 5: Secure RDS

After deployment works:
1. Disable public access on RDS
2. Update security group to only allow EC2 security group

---

## Option 2: AWS Elastic Beanstalk

### Step 1: Create RDS Database
(Same as Option 1)

### Step 2: Prepare Application

```bash
# Create Dockerrun.aws.json
cat > Dockerrun.aws.json << 'EOF'
{
  "AWSEBDockerrunVersion": "1",
  "Image": {
    "Name": "yourusername/assettrackr:latest",
    "Update": "true"
  },
  "Ports": [
    {
      "ContainerPort": 5000,
      "HostPort": 80
    }
  ],
  "Environment": [
    {
      "Name": "NODE_ENV",
      "Value": "production"
    }
  ]
}
EOF
```

### Step 3: Deploy to Elastic Beanstalk

```bash
# Install EB CLI
pip install awsebcli

# Initialize EB
eb init -p docker asset-management

# Create environment with RDS
eb create production-env \
  --database.engine postgres \
  --database.instance db.t3.micro \
  --envvars DATABASE_URL=postgresql://user:pass@host:5432/db,NODE_TLS_REJECT_UNAUTHORIZED=0,SESSION_SECRET=your_secret

# Deploy
eb deploy

# Open application
eb open
```

---

## Option 3: AWS ECS with Fargate

### Step 1: Build and Push Docker Image

```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin [account-id].dkr.ecr.us-east-1.amazonaws.com

# Create repository
aws ecr create-repository --repository-name assettrackr

# Build and push
docker build -t assettrackr .
docker tag assettrackr:latest [account-id].dkr.ecr.us-east-1.amazonaws.com/assettrackr:latest
docker push [account-id].dkr.ecr.us-east-1.amazonaws.com/assettrackr:latest
```

### Step 2: Create ECS Task Definition

Create `task-definition.json`:
```json
{
  "family": "assettrackr",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "containerDefinitions": [
    {
      "name": "app",
      "image": "[account-id].dkr.ecr.us-east-1.amazonaws.com/assettrackr:latest",
      "portMappings": [
        {
          "containerPort": 5000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        },
        {
          "name": "DATABASE_URL",
          "value": "postgresql://user:pass@rds-endpoint:5432/db?sslmode=require"
        },
        {
          "name": "NODE_TLS_REJECT_UNAUTHORIZED",
          "value": "0"
        },
        {
          "name": "SESSION_SECRET",
          "value": "your-secret-here"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/assettrackr",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

### Step 3: Create ECS Service

```bash
# Register task definition
aws ecs register-task-definition --cli-input-json file://task-definition.json

# Create cluster
aws ecs create-cluster --cluster-name assettrackr-cluster

# Create service with ALB
aws ecs create-service \
  --cluster assettrackr-cluster \
  --service-name assettrackr-service \
  --task-definition assettrackr \
  --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx],securityGroups=[sg-xxx],assignPublicIp=ENABLED}" \
  --load-balancers "targetGroupArn=arn:aws:elasticloadbalancing:...,containerName=app,containerPort=5000"
```

### Step 4: Configure ALB for HTTPS

1. Request SSL certificate in ACM
2. Add HTTPS listener (443) to ALB
3. Configure target group health checks to `/api/user`

---

# Azure Deployment

## Option 1: Azure App Service + Azure Database for PostgreSQL

### Step 1: Create PostgreSQL Database

```bash
# Login to Azure
az login

# Create resource group
az group create --name AssetManagement --location eastus

# Create PostgreSQL server
az postgres flexible-server create \
  --resource-group AssetManagement \
  --name assettrackr-db \
  --location eastus \
  --admin-user assetadmin \
  --admin-password 'SecurePassword123!' \
  --sku-name Standard_B1ms \
  --tier Burstable \
  --version 15 \
  --storage-size 32 \
  --public-access 0.0.0.0

# Create database
az postgres flexible-server db create \
  --resource-group AssetManagement \
  --server-name assettrackr-db \
  --database-name assetdb

# Get connection string
az postgres flexible-server show-connection-string \
  --server-name assettrackr-db \
  --database-name assetdb \
  --admin-user assetadmin \
  --admin-password 'SecurePassword123!'
```

### Step 2: Deploy to App Service

```bash
# Create App Service Plan
az appservice plan create \
  --name AssetTrackrPlan \
  --resource-group AssetManagement \
  --is-linux \
  --sku B1

# Create Web App
az webapp create \
  --resource-group AssetManagement \
  --plan AssetTrackrPlan \
  --name assettrackr-app \
  --deployment-container-image-name yourusername/assettrackr:latest

# Configure environment variables
az webapp config appsettings set \
  --resource-group AssetManagement \
  --name assettrackr-app \
  --settings \
    NODE_ENV=production \
    DATABASE_URL='postgresql://assetadmin:SecurePassword123!@assettrackr-db.postgres.database.azure.com:5432/assetdb?sslmode=require' \
    NODE_TLS_REJECT_UNAUTHORIZED=0 \
    SESSION_SECRET='your-generated-secret' \
    PORT=5000

# Configure custom domain and SSL
az webapp config hostname add \
  --resource-group AssetManagement \
  --webapp-name assettrackr-app \
  --hostname yourdomain.com

az webapp config ssl bind \
  --resource-group AssetManagement \
  --name assettrackr-app \
  --certificate-thumbprint [thumbprint] \
  --ssl-type SNI
```

---

## Option 2: Azure Container Instances

```bash
# Create container instance with PostgreSQL
az container create \
  --resource-group AssetManagement \
  --name assettrackr \
  --image yourusername/assettrackr:latest \
  --dns-name-label assettrackr \
  --ports 5000 \
  --environment-variables \
    NODE_ENV=production \
    DATABASE_URL='postgresql://user:pass@host:5432/db?sslmode=require' \
    NODE_TLS_REJECT_UNAUTHORIZED=0 \
    SESSION_SECRET='your-secret' \
  --cpu 1 \
  --memory 1.5

# Get FQDN
az container show \
  --resource-group AssetManagement \
  --name assettrackr \
  --query ipAddress.fqdn
```

---

## Option 3: Azure Kubernetes Service (AKS)

### Step 1: Create AKS Cluster

```bash
# Create AKS cluster
az aks create \
  --resource-group AssetManagement \
  --name assettrackr-aks \
  --node-count 2 \
  --node-vm-size Standard_B2s \
  --enable-managed-identity \
  --generate-ssh-keys

# Get credentials
az aks get-credentials \
  --resource-group AssetManagement \
  --name assettrackr-aks
```

### Step 2: Create Kubernetes Manifests

**deployment.yaml:**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: assettrackr
spec:
  replicas: 2
  selector:
    matchLabels:
      app: assettrackr
  template:
    metadata:
      labels:
        app: assettrackr
    spec:
      containers:
      - name: app
        image: yourusername/assettrackr:latest
        ports:
        - containerPort: 5000
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: url
        - name: NODE_TLS_REJECT_UNAUTHORIZED
          value: "0"
        - name: SESSION_SECRET
          valueFrom:
            secretKeyRef:
              name: app-secret
              key: session
---
apiVersion: v1
kind: Service
metadata:
  name: assettrackr-service
spec:
  type: LoadBalancer
  ports:
  - port: 80
    targetPort: 5000
  selector:
    app: assettrackr
```

### Step 3: Deploy

```bash
# Create secrets
kubectl create secret generic db-secret \
  --from-literal=url='postgresql://user:pass@host:5432/db?sslmode=require'

kubectl create secret generic app-secret \
  --from-literal=session='your-session-secret'

# Deploy
kubectl apply -f deployment.yaml

# Get external IP
kubectl get service assettrackr-service
```

---

# Google Cloud Deployment

## Option 1: Cloud Run + Cloud SQL (Recommended)

### Step 1: Create Cloud SQL Instance

```bash
# Set project
gcloud config set project YOUR_PROJECT_ID

# Create Cloud SQL instance
gcloud sql instances create assettrackr-db \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=us-central1 \
  --root-password='SecurePassword123!'

# Create database
gcloud sql databases create assetdb \
  --instance=assettrackr-db

# Get connection name
gcloud sql instances describe assettrackr-db \
  --format='value(connectionName)'
```

### Step 2: Build and Deploy to Cloud Run

```bash
# Build with Cloud Build
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/assettrackr

# Deploy to Cloud Run with Cloud SQL
gcloud run deploy assettrackr \
  --image gcr.io/YOUR_PROJECT_ID/assettrackr \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --add-cloudsql-instances YOUR_PROJECT_ID:us-central1:assettrackr-db \
  --set-env-vars NODE_ENV=production,NODE_TLS_REJECT_UNAUTHORIZED=0 \
  --set-secrets DATABASE_URL=assettrackr-db-url:latest,SESSION_SECRET=session-secret:latest

# Map custom domain
gcloud run domain-mappings create \
  --service assettrackr \
  --domain yourdomain.com \
  --region us-central1
```

### Step 3: Create Secrets

```bash
# Create DATABASE_URL secret
echo -n 'postgresql://postgres:SecurePassword123!@/assetdb?host=/cloudsql/YOUR_PROJECT_ID:us-central1:assettrackr-db' | \
  gcloud secrets create assettrackr-db-url --data-file=-

# Create SESSION_SECRET
openssl rand -base64 32 | \
  gcloud secrets create session-secret --data-file=-
```

---

## Option 2: Compute Engine + Cloud SQL

### Step 1: Create VM Instance

```bash
# Create VM
gcloud compute instances create assettrackr-vm \
  --machine-type=e2-small \
  --image-family=ubuntu-2204-lts \
  --image-project=ubuntu-os-cloud \
  --boot-disk-size=20GB \
  --tags=http-server,https-server \
  --scopes=https://www.googleapis.com/auth/cloud-platform

# Reserve static IP
gcloud compute addresses create assettrackr-ip --region=us-central1

# Assign static IP to VM
gcloud compute instances delete-access-config assettrackr-vm \
  --access-config-name="external-nat"

gcloud compute instances add-access-config assettrackr-vm \
  --access-config-name="external-nat" \
  --address=$(gcloud compute addresses describe assettrackr-ip --region=us-central1 --format='value(address)')
```

### Step 2: Deploy Application

```bash
# SSH to VM
gcloud compute ssh assettrackr-vm

# Install Docker (same as AWS EC2 steps)
# Then deploy using docker-compose.production.yml
```

---

## Option 3: Google Kubernetes Engine (GKE)

```bash
# Create GKE cluster
gcloud container clusters create assettrackr-cluster \
  --num-nodes=2 \
  --machine-type=e2-small \
  --region=us-central1

# Get credentials
gcloud container clusters get-credentials assettrackr-cluster \
  --region=us-central1

# Deploy (same Kubernetes manifests as AKS)
kubectl apply -f deployment.yaml
```

---

# DigitalOcean Deployment

## Option 1: Droplet + Managed Database (Recommended)

### Step 1: Create Managed PostgreSQL Database

1. **Go to:** https://cloud.digitalocean.com/databases
2. **Create Database Cluster:**
   - PostgreSQL 15
   - Plan: Basic ($15/month) or Development ($12/month)
   - Region: Same as your droplet
   - Create

3. **Configure:**
   - Settings → Trusted Sources → Add your droplet IP
   - Overview → Connection Details → Copy connection string

### Step 2: Create Droplet

1. **Create Droplet:**
   - Ubuntu 22.04 LTS
   - Basic plan: $12/month (2GB RAM)
   - Choose region (same as database)
   - SSH key authentication
   - Create

2. **Get Droplet IP and configure DNS:**
   ```
   A    @        [Droplet IP]
   A    www      [Droplet IP]
   A    traefik  [Droplet IP]
   ```

### Step 3: Deploy Application

```bash
# SSH to droplet
ssh root@your-droplet-ip

# Install Docker
curl -fsSL https://get.docker.com | sh

# Clone repository
git clone https://github.com/yourusername/AssetTrackr.git
cd AssetTrackr

# Create .env
cp .env.production.example .env
nano .env
```

**Configure .env:**
```env
DOMAIN=yourdomain.com
LETSENCRYPT_EMAIL=admin@yourdomain.com

# DigitalOcean Managed Database
USE_EXTERNAL_DB=true
DATABASE_URL=postgresql://doadmin:password@db-postgresql-sgp1-12345.ondigitalocean.com:25060/defaultdb?sslmode=require
NODE_TLS_REJECT_UNAUTHORIZED=0

SESSION_SECRET=$(openssl rand -base64 32)
```

**Deploy:**
```bash
./deploy.sh
```

---

## Option 2: DigitalOcean App Platform

### Step 1: Prepare Repository

Ensure your repository has `Dockerfile` in root.

### Step 2: Deploy via App Platform

1. **Go to:** https://cloud.digitalocean.com/apps
2. **Create App:**
   - Source: GitHub repository
   - Select: AssetTrackr repository
   - Branch: main
   - Autodeploy: Yes

3. **Configure:**
   - Dockerfile path: `/Dockerfile`
   - HTTP Port: 5000
   - Instance Size: Basic ($12/month)

4. **Environment Variables:**
   ```
   NODE_ENV=production
   DATABASE_URL=postgresql://...
   NODE_TLS_REJECT_UNAUTHORIZED=0
   SESSION_SECRET=your-secret
   ```

5. **Deploy** - App Platform builds and deploys automatically

---

## Option 3: DigitalOcean Kubernetes (DOKS)

```bash
# Install doctl
snap install doctl

# Authenticate
doctl auth init

# Create cluster
doctl kubernetes cluster create assettrackr-cluster \
  --region sgp1 \
  --node-pool "name=worker-pool;size=s-2vcpu-2gb;count=2"

# Get kubeconfig
doctl kubernetes cluster kubeconfig save assettrackr-cluster

# Deploy (same Kubernetes manifests)
kubectl apply -f deployment.yaml
```

---

# Ubuntu Server Deployment

## Option 1: Docker + Local PostgreSQL

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER

# Logout and login again
exit

# Clone repository
git clone https://github.com/yourusername/AssetTrackr.git
cd AssetTrackr

# Create .env
cp .env.production.example .env
nano .env
```

**Configure for local database:**
```env
DOMAIN=yourdomain.com
LETSENCRYPT_EMAIL=admin@yourdomain.com

# Local PostgreSQL
USE_EXTERNAL_DB=false
PGUSER=asset_user
PGPASSWORD=$(openssl rand -base64 24)
PGDATABASE=asset_management

SESSION_SECRET=$(openssl rand -base64 32)
```

**Deploy:**
```bash
docker compose -f docker-compose.production.yml --profile local-db up -d --build
```

---

## Option 2: Docker + External PostgreSQL

Same as Option 1, but configure .env with external database:
```env
USE_EXTERNAL_DB=true
DATABASE_URL=postgresql://user:pass@your-db-server:5432/assetdb
```

---

## Option 3: Traditional (PM2 + Nginx + PostgreSQL)

### Step 1: Install PostgreSQL

```bash
# Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Create database and user
sudo -u postgres psql << EOF
CREATE DATABASE asset_management;
CREATE USER asset_user WITH ENCRYPTED PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE asset_management TO asset_user;
\q
EOF
```

### Step 2: Install Node.js and PM2

```bash
# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install nodejs -y

# Install PM2
sudo npm install -g pm2
```

### Step 3: Deploy Application

```bash
# Clone repository
git clone https://github.com/yourusername/AssetTrackr.git
cd AssetTrackr

# Install dependencies
npm install

# Create .env
cat > .env << EOF
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://asset_user:secure_password@localhost:5432/asset_management
SESSION_SECRET=$(openssl rand -base64 32)
EOF

# Build application
npm run build

# Run migrations
npm run db:push

# Start with PM2
pm2 start npm --name "assettrackr" -- start
pm2 save
pm2 startup
```

### Step 4: Install and Configure Nginx

```bash
# Install Nginx
sudo apt install nginx -y

# Install Certbot for SSL
sudo apt install certbot python3-certbot-nginx -y

# Create Nginx config
sudo nano /etc/nginx/sites-available/assettrackr
```

**Nginx configuration:**
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**Enable and configure SSL:**
```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/assettrackr /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Test auto-renewal
sudo certbot renew --dry-run
```

---

## 📊 Cost Comparison

| Provider | Setup | Database | Total/Month | Free Tier |
|----------|-------|----------|-------------|-----------|
| **AWS** | EC2 t2.micro + RDS t3.micro | $15-25 | $15-40 | ✅ 12 months |
| **Azure** | App Service B1 + PostgreSQL | $13-30 | $26-43 | ❌ |
| **Google Cloud** | Cloud Run + Cloud SQL | $10-20 | $17-37 | ✅ $300 credit |
| **DigitalOcean** | Droplet $12 + DB $15 | $15 | $27 | ❌ |
| **Ubuntu VPS** | VPS $5-10 + Self-hosted DB | $0 | $5-10 | Varies |

---

## 🔒 Security Best Practices

### For All Deployments:
1. ✅ Use strong passwords (min 16 chars, random)
2. ✅ Enable SSL/TLS (Let's Encrypt or cloud provider)
3. ✅ Configure firewall (only ports 80, 443, 22)
4. ✅ Regular backups (daily database backups)
5. ✅ Keep software updated
6. ✅ Use environment variables (never hardcode secrets)
7. ✅ Enable database SSL when possible
8. ✅ Restrict database access to application only
9. ✅ Use managed databases when possible
10. ✅ Monitor logs and set up alerts

---

## 🆘 Troubleshooting

### Database Connection Issues
```bash
# Test database connectivity
telnet db-host 5432

# Check DNS resolution
nslookup db-host

# Verify credentials
psql "postgresql://user:pass@host:5432/db"
```

### SSL Certificate Issues
```bash
# For managed databases, use:
NODE_TLS_REJECT_UNAUTHORIZED=0

# Check certificate
openssl s_client -connect db-host:5432 -starttls postgres
```

### Container Issues
```bash
# Check logs
docker logs container-name

# Check environment
docker exec container-name printenv

# Restart container
docker restart container-name
```

---

## 📚 Additional Resources

- **AWS:** https://docs.aws.amazon.com/
- **Azure:** https://docs.microsoft.com/azure/
- **Google Cloud:** https://cloud.google.com/docs
- **DigitalOcean:** https://docs.digitalocean.com/
- **Docker:** https://docs.docker.com/
- **PostgreSQL:** https://www.postgresql.org/docs/

---

**✅ Choose the deployment option that best fits your needs and budget!**
