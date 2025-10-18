#!/bin/bash
# Check if admin user exists and reset setup if needed

echo "=========================================="
echo "Checking Setup Status"
echo "=========================================="
echo ""

# Check database for users
echo "Checking for existing users in database..."
USER_COUNT=$(psql -h localhost -U asset_user -d asset_management -t -c "SELECT COUNT(*) FROM users WHERE role = 'admin';" 2>/dev/null || echo "0")
USER_COUNT=$(echo $USER_COUNT | xargs)

echo "Admin users found: $USER_COUNT"
echo ""

if [ "$USER_COUNT" -eq "0" ]; then
    echo "⚠️  No admin users found!"
    echo ""
    echo "Resetting setup status to allow first-time setup..."
    
    # Reset setup status in database
    psql -h localhost -U asset_user -d asset_management <<EOF
UPDATE system_settings SET "setupCompleted" = false WHERE id IS NOT NULL;
EOF
    
    if [ $? -eq 0 ]; then
        echo "✅ Setup status reset successfully!"
        echo ""
        echo "🌐 Now visit your website to create the first admin account:"
        echo "   https://asset.digile.com"
        echo ""
        echo "You should see the setup page instead of login."
    else
        echo "❌ Failed to reset setup status"
        echo ""
        echo "Manual reset: Run this SQL command:"
        echo "  psql -h localhost -U asset_user -d asset_management"
        echo "  UPDATE system_settings SET \"setupCompleted\" = false;"
    fi
else
    echo "✅ Admin user(s) already exist in database"
    echo ""
    echo "Setup is complete. Use the login page:"
    echo "   https://asset.digile.com"
    echo ""
    echo "To see existing users:"
    echo "  psql -h localhost -U asset_user -d asset_management -c 'SELECT username, email, role FROM users;'"
fi
echo ""
