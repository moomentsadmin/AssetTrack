#!/bin/bash
# Reset Database Script
# WARNING: This will DELETE ALL DATA and reset to first-time setup

echo "⚠️  WARNING: This will DELETE ALL DATA from the database!"
echo "This includes:"
echo "  - All users"
echo "  - All assets"
echo "  - All assignments"
echo "  - All audit logs"
echo "  - All settings"
echo ""
read -p "Are you sure you want to continue? (type 'yes' to confirm): " confirm

if [ "$confirm" != "yes" ]; then
    echo "❌ Database reset cancelled."
    exit 1
fi

echo ""
echo "🗑️  Resetting database..."

# Method 1: Reset system_settings to mark setup as incomplete
echo "Resetting setup status..."
psql $DATABASE_URL -c "UPDATE system_settings SET setup_completed = false;"

# Method 2: Optionally delete all users (uncomment if you want to remove all data)
# echo "Deleting all users..."
# psql $DATABASE_URL -c "TRUNCATE TABLE users CASCADE;"
# psql $DATABASE_URL -c "TRUNCATE TABLE assets CASCADE;"
# psql $DATABASE_URL -c "TRUNCATE TABLE assignments CASCADE;"
# psql $DATABASE_URL -c "TRUNCATE TABLE audit_logs CASCADE;"

echo ""
echo "✅ Database has been reset!"
echo ""
echo "🔐 You can now access the first-time setup page:"
echo "   Local: http://localhost:5000"
echo "   Production: http://test.digile.com:5000"
echo ""
echo "The setup page will appear automatically when you visit the URL."
