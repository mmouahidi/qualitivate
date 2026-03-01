const { Client } = require('ssh2');

const conn = new Client();
console.log('Connecting to VPS: 161.97.88.40');

conn.on('ready', () => {
    const setupCommands = `
DOMAIN="qualtivate.io"

echo "Deploying correct static asset Nginx configuration for /opt/qualitivate"

# We found the app runs from /opt/qualitivate

cat <<EOF | sudo tee /etc/nginx/sites-available/\$DOMAIN
server {
    server_name \$DOMAIN www.\$DOMAIN;

    root /opt/qualitivate/client/dist;
    index index.html;

    location / {
        try_files \\\$uri \\\$uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \\\$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \\\$host;
        proxy_set_header X-Real-IP \\\$remote_addr;
        proxy_set_header X-Forwarded-For \\\$proxy_add_x_forwarded_for;
        proxy_cache_bypass \\\$http_upgrade;
    }
}
EOF

sudo nginx -t
sudo systemctl reload nginx

# Ensure Let's Encrypt certificates are appended back (certbot will see the file changed)
sudo certbot install --cert-name qualtivate.io --nginx --non-interactive
sudo systemctl reload nginx
echo "SSL and static asset paths are now secured."
`;

    conn.exec(setupCommands, (err, stream) => {
        if (err) throw err;
        stream.on('close', (code, signal) => {
            conn.end();
        }).on('data', (data) => {
            process.stdout.write(data);
        }).stderr.on('data', (data) => {
            process.stderr.write(data);
        });
    });
}).connect({
    host: '161.97.88.40',
    port: 22,
    username: 'root',
    password: 'afflatusing'
});
