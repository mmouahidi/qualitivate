const { Client } = require('ssh2');

const conn = new Client();
console.log('Connecting to VPS: 161.97.88.40');

conn.on('ready', () => {
    const setupCommands = `
echo "--- Finding process holding Port 5000 ---"
lsof -i :5000

echo "--- Killing process on Port 5000 ---"
fuser -k 5000/tcp

echo "--- Restarting PM2 Backend with fresh env ---"
cd /opt/qualitivate/server
pm2 restart qualitivate --update-env

echo "--- Checking PM2 Status ---"
pm2 jlist | grep -o '"status":"[^"]*"' | head -1
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
