const { Client } = require('ssh2');

const VPS_HOST = process.env.VPS_HOST || '161.97.88.40';
const VPS_USER = process.env.VPS_USER || 'root';
const VPS_PASSWORD = process.env.VPS_PASSWORD;

if (!VPS_PASSWORD) {
    console.error('ERROR: VPS_PASSWORD environment variable is required.');
    process.exit(1);
}

const conn = new Client();
console.log(`Connecting to VPS: ${VPS_HOST}`);

conn.on('ready', () => {
    const setupCommands = `
echo "--- Updating CORS_ORIGINS to https://qualtivate.io ---"
sed -i -E 's|^CORS_ORIGINS=.*|CORS_ORIGINS=https://qualtivate.io|g' /opt/qualitivate/server/.env

echo "--- Verifying .env File ---"
cat /opt/qualitivate/server/.env | grep -E "FRONTEND_URL|CORS_ORIGINS"

echo "--- Restarting PM2 Backend with fresh env ---"
cd /opt/qualitivate/server
pm2 restart qualitivate --update-env
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
    host: VPS_HOST,
    port: 22,
    username: VPS_USER,
    password: VPS_PASSWORD
});
