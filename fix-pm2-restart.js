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
echo "--- Ensuring Environment Variables are Injected ---"
cd /opt/qualitivate/server

# Explicitly stop the process entirely so it loses all old memory state
pm2 delete qualitivate

# Start it fresh, forcing it to read the updated .env file in the current directory
pm2 start dist/index.js --name qualitivate --cwd /opt/qualitivate/server --node-args="-r dotenv/config"
pm2 save
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
