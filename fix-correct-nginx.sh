#!/bin/bash
# Fix the correct Nginx configuration file (assettrackr)

echo "=========================================="
echo "Fix Correct Nginx Configuration"
echo "=========================================="
echo ""

NGINX_CONFIG="/etc/nginx/sites-available/assettrackr"

echo "1. Checking for existing configuration..."
echo "----------------------------------------"

if [ -f "$NGINX_CONFIG" ]; then
    echo "✅ Found existing config: $NGINX_CONFIG"
    echo ""
    echo "Current configuration:"
    cat "$NGINX_CONFIG"
    echo ""
    echo "Creating backup..."
    sudo cp "$NGINX_CONFIG" "$NGINX_CONFIG.backup.$(date +%s)"
    echo "✅ Backup created"
else
    echo "⚠️  Config not found, will create new one"
fi

echo ""
echo "2. Checking for SSL certificates..."
echo "----------------------------------------"

if [ -f "/etc/letsencrypt/live/assetmgt.digile.com/fullchain.pem" ]; then
    echo "✅ SSL certificate found for assetmgt.digile.com"
    HAS_SSL=true
elif [ -f "/etc/letsencrypt/live/asset.digile.com/fullchain.pem" ]; then
    echo "✅ SSL certificate found for asset.digile.com"
    HAS_SSL=true
else
    echo "⚠️  No SSL certificate found"
    echo "Will create HTTP-only config"
    HAS_SSL=false
fi

echo ""
echo "3. Creating updated configuration..."
echo "----------------------------------------"

if [ "$HAS_SSL" = true ]; then
    # HTTPS configuration
    sudo tee "$NGINX_CONFIG" > /dev/null <<'EOF'
server {
    listen 80;
    server_name assetmgt.digile.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name assetmgt.digile.com;

    # SSL certificates
    ssl_certificate /etc/letsencrypt/live/assetmgt.digile.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/assetmgt.digile.com/privkey.pem;
    
    # SSL settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;

    # Increased timeouts to prevent 504 errors
    proxy_connect_timeout 300s;
    proxy_send_timeout 300s;
    proxy_read_timeout 300s;
    send_timeout 300s;
    keepalive_timeout 300s;

    # Increase buffer sizes
    proxy_buffer_size 128k;
    proxy_buffers 4 256k;
    proxy_busy_buffers_size 256k;
    
    # Client upload size
    client_max_body_size 100M;

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
        
        # Additional headers
        proxy_set_header X-Forwarded-Host $server_name;
        proxy_redirect off;
    }
}
EOF
else
    # HTTP only configuration
    sudo tee "$NGINX_CONFIG" > /dev/null <<'EOF'
server {
    listen 80;
    server_name assetmgt.digile.com;

    # Increased timeouts to prevent 504 errors
    proxy_connect_timeout 300s;
    proxy_send_timeout 300s;
    proxy_read_timeout 300s;
    send_timeout 300s;
    keepalive_timeout 300s;

    # Increase buffer sizes
    proxy_buffer_size 128k;
    proxy_buffers 4 256k;
    proxy_busy_buffers_size 256k;
    
    # Client upload size
    client_max_body_size 100M;

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
        
        # Additional headers
        proxy_set_header X-Forwarded-Host $server_name;
        proxy_redirect off;
    }
}
EOF
fi

echo "✅ Configuration file created/updated"
echo ""

echo "4. Enabling site (creating symlink)..."
echo "----------------------------------------"

if [ -L "/etc/nginx/sites-enabled/assettrackr" ]; then
    echo "✅ Symlink already exists"
else
    sudo ln -sf /etc/nginx/sites-available/assettrackr /etc/nginx/sites-enabled/assettrackr
    echo "✅ Symlink created"
fi

echo ""
echo "5. Disabling default site..."
echo "----------------------------------------"

if [ -L "/etc/nginx/sites-enabled/default" ]; then
    sudo rm /etc/nginx/sites-enabled/default
    echo "✅ Default site disabled"
else
    echo "✓ Default site already disabled"
fi

echo ""
echo "6. Testing Nginx configuration..."
echo "----------------------------------------"

sudo nginx -t

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Nginx configuration is valid"
    echo ""
    echo "7. Reloading Nginx..."
    sudo systemctl reload nginx
    
    if [ $? -eq 0 ]; then
        echo "✅ Nginx reloaded successfully"
        echo ""
        echo "=========================================="
        echo "✅ ✅ ✅ SUCCESS! ✅ ✅ ✅"
        echo "=========================================="
        echo ""
        echo "Configuration file: $NGINX_CONFIG"
        echo "Enabled: /etc/nginx/sites-enabled/assettrackr"
        echo "Timeout: 300 seconds (5 minutes)"
        echo ""
        if [ "$HAS_SSL" = true ]; then
            echo "🌐 Now visit: https://assetmgt.digile.com"
        else
            echo "🌐 Now try: http://assetmgt.digile.com"
            echo ""
            echo "💡 To enable HTTPS, install SSL certificate:"
            echo "   sudo certbot --nginx -d assetmgt.digile.com"
        fi
        echo ""
        echo "Verify with:"
        echo "  curl -I https://assetmgt.digile.com"
    else
        echo "❌ Failed to reload Nginx"
        echo "Check error with: sudo nginx -t"
        exit 1
    fi
else
    echo ""
    echo "❌ Nginx configuration test failed"
    echo "Check the error above and fix configuration"
    exit 1
fi

echo ""
echo "8. Checking Nginx status..."
echo "----------------------------------------"
sudo systemctl status nginx --no-pager | head -10
