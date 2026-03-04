const { Client } = require('ssh2');

const VPS_HOST = process.env.VPS_HOST || '161.97.88.40';
const VPS_USER = process.env.VPS_USER || 'root';
const VPS_PASSWORD = process.env.VPS_PASSWORD;
const SMTP_PASS = process.env.SMTP_PASS;

if (!VPS_PASSWORD) {
    console.error('ERROR: VPS_PASSWORD environment variable is required.');
    process.exit(1);
}
if (!SMTP_PASS) {
    console.error('ERROR: SMTP_PASS environment variable is required.');
    process.exit(1);
}

const conn = new Client();
console.log(`Connecting to VPS: ${VPS_HOST}`);

conn.on('ready', () => {
    const setupCommands = `
cd /opt/qualitivate/server
sed -i 's/SMTP_HOST=.*/SMTP_HOST=smtp.resend.com/g' .env
sed -i 's/SMTP_PORT=.*/SMTP_PORT=465/g' .env
sed -i 's/SMTP_USER=.*/SMTP_USER=resend/g' .env
sed -i 's/SMTP_PASS=.*/SMTP_PASS=${SMTP_PASS}/g' .env
sed -i 's/SMTP_FROM=.*/SMTP_FROM=onboarding@resend.dev/g' .env

echo "Showing updated .env vars:"
cat .env | grep SMTP

pm2 restart qualitivate --update-env
echo "Resend SMTP credentials updated remotely and server restarted."
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
