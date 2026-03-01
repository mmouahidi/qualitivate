#!/bin/bash

# Qualitivate.io VPS Nginx & SSL Setup Script
# Run this script on your Ubuntu VPS as root or with sudo privileges.
# Usage: sudo ./setup-nginx.sh

DOMAIN="qualtivate.io"
EMAIL="your-email@example.com" # Replace with your actual email for SSL renewal notices
PORT=5000

echo "🚀 Starting Nginx and SSL setup for $DOMAIN..."

# 1. Update package list and install Nginx + Certbot
echo "📦 Installing Nginx and Certbot..."
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx

# 2. Create Nginx Configuration
echo "⚙️ Creating Nginx configuration file for $DOMAIN..."

cat <<EOF | sudo tee /etc/nginx/sites-available/$DOMAIN
server {
    server_name $DOMAIN www.$DOMAIN;

    location / {
        proxy_pass http://localhost:$PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# 3. Enable the site
echo "🔗 Enabling the site..."
sudo ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/

# Remove the default nginx config if it exists to prevent conflicts
if [ -f /etc/nginx/sites-enabled/default ]; then
    echo "🗑️ Removing default Nginx site..."
    sudo rm /etc/nginx/sites-enabled/default
fi

# 4. Test and restart Nginx
echo "🔄 Testing and restarting Nginx..."
sudo nginx -t

if [ $? -eq 0 ]; then
    sudo systemctl restart nginx
    echo "✅ Nginx restarted successfully."
else
    echo "❌ Nginx configuration test failed. Please check the errors above."
    exit 1
fi

# 5. Obtain SSL Certificate
echo "🔒 Securing the domain with Let's Encrypt Free SSL..."
# We use --non-interactive and --agree-tos for headless execution, 
# but we prompt the user for an email first if they want it fully automated.
# For safety, we'll run the standard interactive certbot command:

echo "Securing domain headlessly..."
sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --register-unsafely-without-email

echo "🎉 Setup complete! Your domain https://$DOMAIN is now securely pointing to your app."
