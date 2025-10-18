#!/bin/bash
# Fix PostgreSQL database permissions
# Run this on your server as root

echo "=========================================="
echo "Fixing Database Permissions"
echo "=========================================="
echo ""

# Run as postgres user to fix permissions
sudo -u postgres psql << EOF
-- Connect to the database
\c asset_management

-- Grant all privileges on schema public
GRANT ALL ON SCHEMA public TO asset_user;

-- Grant privileges on all existing tables
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO asset_user;

-- Grant privileges on all sequences
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO asset_user;

-- Grant privileges on all functions
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO asset_user;

-- Make sure future objects also get permissions
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO asset_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO asset_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO asset_user;

-- Verify permissions
\dp
EOF

echo ""
echo "✅ Database permissions fixed!"
echo ""
echo "Now run the deployment again:"
echo "  cd ~/AssetTrack"
echo "  ./fix-deployment.sh"
echo ""
