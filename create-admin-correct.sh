#!/bin/bash
# Create admin user with correct scrypt password hashing (matches app's auth.ts)

echo "=========================================="
echo "Create Admin User (Correct Password Hash)"
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
echo "Creating admin user with scrypt password hash..."

# Load database credentials from .env
if [ -f ~/AssetTrack/.env ]; then
    source ~/AssetTrack/.env
    DB_USER=$(echo $DATABASE_URL | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
    DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')
    DB_PASSWORD=$(echo $DATABASE_URL | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
else
    echo "❌ .env file not found!"
    exit 1
fi

# Hash password using scrypt (matches auth.ts implementation)
HASHED_PASSWORD=$(node -e "
const crypto = require('crypto');
const { promisify } = require('util');
const scryptAsync = promisify(crypto.scrypt);

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const buf = await scryptAsync(password, salt, 64);
  return \`\${buf.toString('hex')}.\${salt}\`;
}

hashPassword(process.argv[1]).then(hash => console.log(hash));
" "$ADMIN_PASSWORD")

echo "Password hashed successfully"

# Insert admin user into database
PGPASSWORD="$DB_PASSWORD" psql -h localhost -U "$DB_USER" -d "$DB_NAME" <<EOF
-- Delete any existing admin user with this username
DELETE FROM users WHERE username = '$ADMIN_USERNAME';

-- Insert new admin user
INSERT INTO users (username, password, email, full_name, role, is_contractor)
VALUES ('$ADMIN_USERNAME', '$HASHED_PASSWORD', '$ADMIN_EMAIL', '$ADMIN_FULLNAME', 'admin', false);

-- Ensure setup is marked as completed
DELETE FROM system_settings;
INSERT INTO system_settings (setup_completed, company_name, default_currency)
VALUES (true, 'Asset Management System', 'USD');

-- Verify user was created
SELECT username, email, role FROM users WHERE username = '$ADMIN_USERNAME';
EOF

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ ✅ ✅ SUCCESS! ✅ ✅ ✅"
    echo ""
    echo "Admin user created:"
    echo "  Username: $ADMIN_USERNAME"
    echo "  Email: $ADMIN_EMAIL"
    echo ""
    echo "🌐 Now visit: https://assetmgt.digile.com"
    echo ""
    echo "Login with:"
    echo "  Username: $ADMIN_USERNAME"
    echo "  Password: (the password you entered)"
    echo ""
else
    echo ""
    echo "❌ Failed to create admin user"
    echo "Check database connection and permissions"
fi
