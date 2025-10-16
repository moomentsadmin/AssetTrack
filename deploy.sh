#!/bin/bash
# Production Deployment Script
# This script helps deploy the Asset Management System with proper configuration

set -e

echo "🚀 Asset Management System - Production Deployment"
echo "=================================================="
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo ""
    echo "Please create .env file from template:"
    echo "  cp .env.production.example .env"
    echo "  nano .env"
    echo ""
    echo "Then configure your domain, database, and secrets."
    exit 1
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Error: Docker is not running!"
    echo "Please start Docker and try again."
    exit 1
fi

# Source .env to check configuration
source .env

# Check required variables
if [ -z "$DOMAIN" ]; then
    echo "❌ Error: DOMAIN not set in .env"
    exit 1
fi

if [ -z "$LETSENCRYPT_EMAIL" ]; then
    echo "❌ Error: LETSENCRYPT_EMAIL not set in .env"
    exit 1
fi

echo "📋 Configuration:"
echo "  Domain: $DOMAIN"
echo "  Email: $LETSENCRYPT_EMAIL"
echo "  External DB: ${USE_EXTERNAL_DB:-false}"
echo ""

# Determine deployment mode
if [ "$USE_EXTERNAL_DB" = "true" ]; then
    if [ -z "$DATABASE_URL" ]; then
        echo "❌ Error: DATABASE_URL not set for external database"
        exit 1
    fi
    echo "🗄️  Deploying with EXTERNAL database"
    echo "  Database: ${DATABASE_URL%%@*}@..." # Show only user part
    echo ""
    
    # Deploy without local database
    docker compose -f docker-compose.production.yml down
    docker compose -f docker-compose.production.yml up -d --build
    
else
    echo "🗄️  Deploying with LOCAL PostgreSQL database"
    echo "  User: ${PGUSER:-asset_user}"
    echo "  Database: ${PGDATABASE:-asset_management}"
    echo ""
    
    # Deploy with local database profile
    docker compose -f docker-compose.production.yml down
    docker compose -f docker-compose.production.yml --profile local-db up -d --build
fi

echo ""
echo "⏳ Waiting for services to start..."
sleep 10

# Check status
echo ""
echo "📊 Container Status:"
docker compose -f docker-compose.production.yml ps

echo ""
echo "📝 Recent Application Logs:"
docker compose -f docker-compose.production.yml logs app --tail 20

echo ""
echo "✅ Deployment Complete!"
echo ""
echo "🌐 Access your application:"
echo "  Main App: https://$DOMAIN"
echo "  Dashboard: https://traefik.$DOMAIN"
echo ""
echo "📚 Useful Commands:"
echo "  View logs:    docker compose -f docker-compose.production.yml logs -f app"
echo "  Stop app:     docker compose -f docker-compose.production.yml down"
echo "  Restart app:  docker compose -f docker-compose.production.yml restart app"
echo ""
echo "🔧 If you see SSL errors with external database, ensure:"
echo "  1. NODE_TLS_REJECT_UNAUTHORIZED=0 is set in .env"
echo "  2. Your server IP is whitelisted in database provider"
echo "  3. DATABASE_URL includes proper SSL mode"
echo ""
