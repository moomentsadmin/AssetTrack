#!/bin/bash
# Complete fix for server deployment issues

echo "=========================================="
echo "Complete Server Fix"
echo "=========================================="
echo ""

# Load environment variables
if [ -f ~/AssetTrack/.env ]; then
    source ~/AssetTrack/.env
    echo "✅ Loaded .env file"
else
    echo "❌ .env file not found!"
    exit 1
fi

echo ""
echo "Step 1: Fixing Database Permissions..."
echo "----------------------------------------"

# Fix database permissions as postgres superuser
sudo -u postgres psql <<EOF
-- Connect to database
\c $PGDATABASE

-- Grant all privileges on schema public
GRANT ALL ON SCHEMA public TO $PGUSER;

-- Grant privileges on all existing tables and sequences
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO $PGUSER;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO $PGUSER;

-- Grant default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO $PGUSER;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO $PGUSER;

-- Make user owner of schema
ALTER SCHEMA public OWNER TO $PGUSER;

-- Verify
SELECT schemaname, schemaowner FROM pg_catalog.pg_namespace WHERE schemaname = 'public';
EOF

if [ $? -eq 0 ]; then
    echo "✅ Database permissions fixed"
else
    echo "❌ Failed to fix database permissions"
    exit 1
fi

echo ""
echo "Step 2: Running Database Migrations..."
echo "----------------------------------------"

cd ~/AssetTrack
npm run db:push

if [ $? -eq 0 ]; then
    echo "✅ Migrations completed"
else
    echo "⚠️  Migrations had warnings (might be ok)"
fi

echo ""
echo "Step 3: Checking if admin user exists..."
echo "----------------------------------------"

ADMIN_COUNT=$(sudo -u postgres psql -d $PGDATABASE -t -c "SELECT COUNT(*) FROM users WHERE role = 'admin';" 2>/dev/null | xargs)

if [ "$ADMIN_COUNT" = "0" ]; then
    echo "⚠️  No admin user found. You need to create one."
    echo ""
    echo "Run this command after the script completes:"
    echo "  cd ~/AssetTrack && ./create-admin-correct.sh"
else
    echo "✅ Found $ADMIN_COUNT admin user(s)"
fi

echo ""
echo "Step 4: Building Application..."
echo "----------------------------------------"

cd ~/AssetTrack
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build completed"
else
    echo "❌ Build failed"
    exit 1
fi

echo ""
echo "Step 5: Restarting PM2..."
echo "----------------------------------------"

pm2 stop all
pm2 delete all
pm2 start ecosystem.config.cjs
pm2 save

echo ""
echo "Step 6: Verifying Application..."
echo "----------------------------------------"

sleep 5

HEALTH=$(curl -s http://localhost:5000/health)

if [ $? -eq 0 ]; then
    echo "✅ ✅ ✅ SUCCESS! ✅ ✅ ✅"
    echo ""
    echo "App is running!"
    echo "Response: $HEALTH"
    echo ""
    pm2 list
    echo ""
    echo "🌐 Visit: https://assetmgt.digile.com"
    echo ""
    if [ "$ADMIN_COUNT" = "0" ]; then
        echo "⚠️  IMPORTANT: Create admin user now:"
        echo "  cd ~/AssetTrack"
        echo "  ./create-admin-correct.sh"
    fi
else
    echo "❌ App is not responding"
    echo ""
    echo "Check logs:"
    pm2 logs --lines 50 --nostream
fi

echo ""
echo "=========================================="
