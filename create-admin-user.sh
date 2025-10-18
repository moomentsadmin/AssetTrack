#!/bin/bash
# Create admin user directly in database (bypasses setup page)

echo "=========================================="
echo "Create Admin User Directly"
echo "=========================================="
echo ""

# Prompt for admin credentials
read -p "Enter admin username (min 3 chars): " ADMIN_USERNAME
read -p "Enter admin email: " ADMIN_EMAIL
read -p "Enter admin full name: " ADMIN_FULLNAME
read -s -p "Enter admin password (min 8 chars): " ADMIN_PASSWORD
echo ""

# Validate inputs
if [ ${#ADMIN_USERNAME} -lt 3 ]; then
    echo "❌ Username must be at least 3 characters"
    exit 1
fi

if [ ${#ADMIN_PASSWORD} -lt 8 ]; then
    echo "❌ Password must be at least 8 characters"
    exit 1
fi

echo ""
echo "Creating admin user..."

# Use Node.js to hash the password using bcrypt (same as the app does)
HASHED_PASSWORD=$(node -e "
const bcrypt = require('bcrypt');
const password = process.argv[1];
const hash = bcrypt.hashSync(password, 10);
console.log(hash);
" "$ADMIN_PASSWORD")

# Insert admin user into database
psql -h localhost -U asset_user -d asset_management <<EOF
-- Insert admin user
INSERT INTO users (username, password, email, full_name, role, is_contractor)
VALUES ('$ADMIN_USERNAME', '$HASHED_PASSWORD', '$ADMIN_EMAIL', '$ADMIN_FULLNAME', 'admin', false)
ON CONFLICT (username) DO NOTHING;

-- Mark setup as completed
INSERT INTO system_settings (setup_completed, company_name, default_currency)
VALUES (true, 'Asset Management System', 'USD')
ON CONFLICT (id) DO UPDATE SET setup_completed = true;
EOF

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ ✅ ✅ SUCCESS! ✅ ✅ ✅"
    echo ""
    echo "Admin user created:"
    echo "  Username: $ADMIN_USERNAME"
    echo "  Email: $ADMIN_EMAIL"
    echo ""
    echo "🔄 Restarting PM2..."
    pm2 restart asset-management
    sleep 2
    echo ""
    echo "🌐 Now visit: https://asset.digile.com"
    echo ""
    echo "Login with:"
    echo "  Username: $ADMIN_USERNAME"
    echo "  Password: (the password you just entered)"
    echo ""
else
    echo ""
    echo "❌ Failed to create admin user"
    echo ""
    echo "Check if user already exists:"
    echo "  psql -h localhost -U asset_user -d asset_management -c 'SELECT username, email, role FROM users;'"
fi
echo ""
