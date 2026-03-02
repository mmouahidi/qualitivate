const { Client } = require('ssh2');

const conn = new Client();
console.log('Connecting to VPS: 161.97.88.40');

conn.on('ready', () => {
    const setupCommands = `
cd /opt/qualitivate/server
sed -i 's/SMTP_HOST=.*/SMTP_HOST=smtp.resend.com/g' .env
sed -i 's/SMTP_PORT=.*/SMTP_PORT=465/g' .env
sed -i 's/SMTP_USER=.*/SMTP_USER=resend/g' .env
sed -i 's/SMTP_PASS=.*/SMTP_PASS=re_NThQRTmE_AYJBn9x45ZuD8tEHbxuBhtYw/g' .env
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
    host: '161.97.88.40',
    port: 22,
    username: 'root',
    password: 'afflatusing'
});
