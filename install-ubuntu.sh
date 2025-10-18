#!/bin/bash
# Automated Ubuntu Installation Script
# For Asset Management System (PM2 + Nginx + PostgreSQL)

set -e

echo "========================================="
echo "Asset Management System - Ubuntu Setup"
echo "========================================="
echo ""
echo "This script will install:"
echo "  - Node.js 20 LTS"
echo "  - PostgreSQL"
echo "  - Nginx"
echo "  - PM2"
echo "  - Certbot (for SSL)"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Installation cancelled."
    exit 1
fi

echo ""
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

echo ""
echo "📦 Installing Node.js 20 LTS..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
else
    echo "✓ Node.js already installed"
fi
node --version
npm --version

echo ""
echo "📦 Installing PostgreSQL..."
if ! command -v psql &> /dev/null; then
    sudo apt install -y postgresql postgresql-contrib
    sudo systemctl enable postgresql
    sudo systemctl start postgresql
else
    echo "✓ PostgreSQL already installed"
fi
psql --version

echo ""
echo "📦 Installing Nginx..."
if ! command -v nginx &> /dev/null; then
    sudo apt install -y nginx
    sudo systemctl enable nginx
    sudo systemctl start nginx
else
    echo "✓ Nginx already installed"
fi
nginx -v

echo ""
echo "📦 Installing PM2..."
if ! command -v pm2 &> /dev/null; then
    sudo npm install -g pm2
else
    echo "✓ PM2 already installed"
fi
pm2 --version

echo ""
echo "📦 Installing Certbot (for SSL)..."
if ! command -v certbot &> /dev/null; then
    sudo apt install -y certbot python3-certbot-nginx
else
    echo "✓ Certbot already installed"
fi
certbot --version

echo ""
echo "✅ Installation complete!"
echo ""
echo "📋 Next steps:"
echo ""
echo "1. Configure PostgreSQL database:"
echo "   sudo -u postgres psql"
echo "   CREATE DATABASE asset_management;"
echo "   CREATE USER asset_user WITH ENCRYPTED PASSWORD 'YOUR_PASSWORD';"
echo "   GRANT ALL PRIVILEGES ON DATABASE asset_management TO asset_user;"
echo "   \\c asset_management"
echo "   GRANT ALL ON SCHEMA public TO asset_user;"
echo "   \\q"
echo ""
echo "2. Clone application:"
echo "   cd ~"
echo "   git clone https://github.com/moomentsadmin/AssetTrack.git"
echo "   cd AssetTrack"
echo ""
echo "3. Configure environment:"
echo "   cp .env.pm2.example .env"
echo "   nano .env  # Update DATABASE_URL and SESSION_SECRET"
echo ""
echo "4. Deploy:"
echo "   chmod +x deploy-pm2.sh"
echo "   ./deploy-pm2.sh"
echo ""
echo "5. Configure Nginx:"
echo "   sudo cp nginx-http.conf /etc/nginx/sites-available/asset-management"
echo "   sudo ln -s /etc/nginx/sites-available/asset-management /etc/nginx/sites-enabled/"
echo "   sudo nginx -t"
echo "   sudo systemctl reload nginx"
echo ""
echo "6. Setup SSL:"
echo "   sudo certbot --nginx -d asset.digile.com"
echo ""
echo "See UBUNTU_PM2_SETUP.md for detailed instructions."
echo ""
