#!/bin/bash
# Deployment script for Asset Management System (PM2 + Nginx)

set -e

echo "======================================"
echo "Asset Management System - Deployment"
echo "======================================"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "Please create .env file with required variables."
    echo "See .env.example for reference."
    exit 1
fi

# Load environment variables
export $(grep -v '^#' .env | xargs)

echo "✓ Environment variables loaded"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm ci
echo "✓ Dependencies installed"
echo ""

# Run database migrations
echo "🗄️  Running database migrations..."
npx drizzle-kit push
echo "✓ Database migrations complete"
echo ""

# Build application
echo "🔨 Building application..."
npm run build
echo "✓ Build complete"
echo ""

# Create logs directory
mkdir -p logs
echo "✓ Logs directory created"
echo ""

# Clean up old PM2 processes (in case of name mismatch)
echo "🧹 Cleaning up old PM2 processes..."
pm2 delete all 2>/dev/null || true
echo "✓ Cleanup complete"
echo ""

# Start with PM2
echo "🚀 Starting application with PM2..."
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📊 Application status:"
pm2 status

echo ""
echo "📝 View logs with:"
echo "   pm2 logs asset-management"
echo ""
echo "🔄 Restart with:"
echo "   pm2 restart asset-management"
echo ""
