#!/bin/bash

# ================================================================
# Asset Management System - SSL/TLS Setup with Let's Encrypt
# ================================================================
# This script sets up the application with automatic SSL certificates
# using Traefik and Let's Encrypt
# ================================================================

set -e  # Exit on error

echo "=========================================="
echo "Asset Management - SSL Setup"
echo "=========================================="
echo ""

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
   echo "⚠️  Warning: Running as root. Consider using a non-root user with docker permissions."
   echo ""
fi

# ===================================
# Step 1: Check Requirements
# ===================================
echo "Step 1: Checking requirements..."

# Check Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check Docker Compose (V2)
if ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose V2 is not installed. Please install Docker Compose V2."
    echo "   Install with: sudo apt install docker-compose-plugin"
    exit 1
fi

echo "✅ Docker and Docker Compose V2 are installed"
echo ""

# ===================================
# Step 2: Create Required Directories
# ===================================
echo "Step 2: Creating required directories..."

mkdir -p letsencrypt
mkdir -p traefik-logs
mkdir -p logs

# Set proper permissions for acme.json
touch letsencrypt/acme.json
chmod 600 letsencrypt/acme.json

echo "✅ Directories created"
echo ""

# ===================================
# Step 3: Environment Setup
# ===================================
echo "Step 3: Setting up environment configuration..."

if [ ! -f .env ]; then
    if [ -f .env.ssl.example ]; then
        cp .env.ssl.example .env
        echo "✅ Created .env file from .env.ssl.example"
        echo ""
        echo "⚠️  IMPORTANT: You MUST edit .env file with your values:"
        echo "   - DOMAIN (your domain name)"
        echo "   - LETSENCRYPT_EMAIL (your email)"
        echo "   - PGPASSWORD (database password)"
        echo "   - SESSION_SECRET (generate with: openssl rand -base64 32)"
        echo ""
        echo "📝 Edit .env now? (y/n)"
        read -r response
        if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
            ${EDITOR:-nano} .env
        else
            echo "⚠️  Remember to edit .env before running 'docker compose -f docker-compose.ssl.yml up -d'"
            exit 0
        fi
    else
        echo "❌ .env.ssl.example not found. Cannot create .env file."
        exit 1
    fi
else
    echo "✅ .env file already exists"
fi

echo ""

# ===================================
# Step 4: Verify DNS Configuration
# ===================================
echo "Step 4: DNS Configuration Check..."
echo ""

# Load domain from .env
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

if [ -z "$DOMAIN" ] || [ "$DOMAIN" = "yourdomain.com" ]; then
    echo "⚠️  Warning: DOMAIN is not set or still has default value!"
    echo "   Please update DOMAIN in .env file to your actual domain."
    echo ""
    exit 1
fi

echo "📋 DNS Records Required:"
echo "   Type    Name        Value"
echo "   ────────────────────────────────────"
echo "   A       @           YOUR_SERVER_IP"
echo "   A       www         YOUR_SERVER_IP"
echo "   A       traefik     YOUR_SERVER_IP"
echo ""

# Try to resolve domain
if command -v dig &> /dev/null; then
    RESOLVED_IP=$(dig +short "$DOMAIN" | head -n1)
    if [ -n "$RESOLVED_IP" ]; then
        echo "✅ Domain resolves to: $RESOLVED_IP"
    else
        echo "⚠️  Warning: Domain does not resolve. Please configure DNS first."
    fi
else
    echo "ℹ️  Install 'dig' to check DNS resolution: sudo apt install dnsutils"
fi

echo ""

# ===================================
# Step 5: Firewall Check
# ===================================
echo "Step 5: Firewall Configuration Check..."
echo ""
echo "Required Ports:"
echo "   Port 80  (HTTP)  - Let's Encrypt challenge"
echo "   Port 443 (HTTPS) - Secure traffic"
echo ""

# Check if ufw is active
if command -v ufw &> /dev/null; then
    if ufw status | grep -q "Status: active"; then
        echo "UFW Firewall is active. Checking ports..."
        
        if ! ufw status | grep -q "80"; then
            echo "⚠️  Port 80 not open. Run: sudo ufw allow 80/tcp"
        fi
        
        if ! ufw status | grep -q "443"; then
            echo "⚠️  Port 443 not open. Run: sudo ufw allow 443/tcp"
        fi
    else
        echo "ℹ️  UFW firewall is not active"
    fi
else
    echo "ℹ️  UFW not installed. Make sure ports 80 and 443 are open in your firewall."
fi

echo ""

# ===================================
# Step 6: Generate Dashboard Password
# ===================================
echo "Step 6: Traefik Dashboard Authentication..."

if command -v htpasswd &> /dev/null; then
    echo "Generate new dashboard password? (y/n)"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        echo "Enter username (default: admin):"
        read -r username
        username=${username:-admin}
        
        # Generate password
        NEW_AUTH=$(htpasswd -nB "$username")
        # Escape for .env file (double $)
        NEW_AUTH_ESCAPED=$(echo "$NEW_AUTH" | sed 's/\$/\$\$/g')
        
        # Update .env
        if grep -q "TRAEFIK_DASHBOARD_AUTH=" .env; then
            sed -i "s|TRAEFIK_DASHBOARD_AUTH=.*|TRAEFIK_DASHBOARD_AUTH=$NEW_AUTH_ESCAPED|" .env
            echo "✅ Updated TRAEFIK_DASHBOARD_AUTH in .env"
        else
            echo "TRAEFIK_DASHBOARD_AUTH=$NEW_AUTH_ESCAPED" >> .env
            echo "✅ Added TRAEFIK_DASHBOARD_AUTH to .env"
        fi
    fi
else
    echo "ℹ️  htpasswd not found. To generate secure password later:"
    echo "   1. Install: sudo apt install apache2-utils"
    echo "   2. Generate: htpasswd -nB admin"
    echo "   3. Update TRAEFIK_DASHBOARD_AUTH in .env (escape $ with $$)"
fi

echo ""

# ===================================
# Step 7: Build and Deploy
# ===================================
echo "Step 7: Ready to deploy!"
echo ""
echo "🚀 Start the application with SSL? (y/n)"
read -r response

if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    echo ""
    echo "Building and starting containers..."
    docker compose -f docker-compose.ssl.yml up -d --build
    
    echo ""
    echo "=========================================="
    echo "✅ Deployment Complete!"
    echo "=========================================="
    echo ""
    echo "📋 Access URLs:"
    echo "   Main App:  https://$DOMAIN"
    echo "   Dashboard: https://traefik.$DOMAIN"
    echo ""
    echo "📝 View logs:"
    echo "   docker compose -f docker-compose.ssl.yml logs -f"
    echo ""
    echo "📊 Check services:"
    echo "   docker compose -f docker-compose.ssl.yml ps"
    echo ""
    echo "⏳ Note: SSL certificates may take 1-2 minutes to generate on first run."
    echo "   Check logs with: docker compose -f docker-compose.ssl.yml logs -f traefik"
    echo ""
else
    echo ""
    echo "Manual deployment:"
    echo "   docker compose -f docker-compose.ssl.yml up -d --build"
    echo ""
    echo "View logs:"
    echo "   docker compose -f docker-compose.ssl.yml logs -f"
fi
