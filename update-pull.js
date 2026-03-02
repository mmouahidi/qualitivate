const { Client } = require('ssh2');

const conn = new Client();
console.log('Connecting to VPS: 161.97.88.40');

conn.on('ready', () => {
    const setupCommands = `
cd /opt/qualitivate

echo "=== Pulling latest from Git ==="
git checkout master
git pull

echo "=== Building Server ==="
cd server
npm i
npm run build

echo "=== Building Client ==="
cd ../client
npm i
npm run build

echo "=== Restarting Services ==="
pm2 restart qualitivate

echo "Deployment finished successfully!"
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
