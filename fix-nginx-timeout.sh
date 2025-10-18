#!/bin/bash
# Fix Nginx timeout settings

echo "=========================================="
echo "Fix Nginx Timeout Settings"
echo "=========================================="
echo ""

NGINX_CONF="/etc/nginx/sites-available/asset-management"

if [ ! -f "$NGINX_CONF" ]; then
    echo "❌ Nginx config not found at $NGINX_CONF"
    exit 1
fi

echo "Current Nginx configuration:"
echo "----------------------------------------"
cat "$NGINX_CONF"
echo ""

echo "Checking current timeout settings:"
echo "----------------------------------------"
grep -i timeout "$NGINX_CONF" || echo "No timeout settings found"
echo ""

echo "Creating backup..."
sudo cp "$NGINX_CONF" "$NGINX_CONF.backup.$(date +%s)"
echo "✅ Backup created"
echo ""

echo "Updating Nginx configuration with increased timeouts..."

# Create updated config
sudo tee "$NGINX_CONF" > /dev/null <<'EOF'
server {
    listen 80;
    server_name assetmgt.digile.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name assetmgt.digile.com;

    # SSL configuration
    ssl_certificate /etc/letsencrypt/live/assetmgt.digile.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/assetmgt.digile.com/privkey.pem;

    # Increased timeouts to prevent 504 errors
    proxy_connect_timeout 300s;
    proxy_send_timeout 300s;
    proxy_read_timeout 300s;
    send_timeout 300s;

    # Increase buffer sizes
    proxy_buffer_size 128k;
    proxy_buffers 4 256k;
    proxy_busy_buffers_size 256k;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

echo "✅ Configuration updated"
echo ""

echo "Testing Nginx configuration..."
sudo nginx -t

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Nginx configuration is valid"
    echo ""
    echo "Reloading Nginx..."
    sudo systemctl reload nginx
    
    if [ $? -eq 0 ]; then
        echo "✅ Nginx reloaded successfully"
        echo ""
        echo "=========================================="
        echo "✅ ✅ ✅ SUCCESS! ✅ ✅ ✅"
        echo "=========================================="
        echo ""
        echo "Nginx timeout increased to 300 seconds (5 minutes)"
        echo ""
        echo "🌐 Now try: https://assetmgt.digile.com"
        echo ""
    else
        echo "❌ Failed to reload Nginx"
        echo "Restoring backup..."
        sudo cp "$NGINX_CONF.backup."* "$NGINX_CONF"
    fi
else
    echo ""
    echo "❌ Nginx configuration test failed"
    echo "Restoring backup..."
    sudo cp "$NGINX_CONF.backup."* "$NGINX_CONF"
    exit 1
fi
