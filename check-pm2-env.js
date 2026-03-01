const { Client } = require('ssh2');

const conn = new Client();
console.log('Connecting to VPS: 161.97.88.40');

conn.on('ready', () => {
    const setupCommands = `
echo "--- Checking Node Server Environment Variables running inside PM2 ---"
node -e "
const { execSync } = require('child_process');
try {
  const env = execSync('pm2 env qualitivate', { encoding: 'utf-8' });
  console.log(env.split('\\n').filter(line => line.includes('FRONTEND') || line.includes('CORS')).join('\\n'));
} catch (e) {
  console.error(e.message);
}
"
echo "--- Checking PM2 Logs for Qualitivate ---"
pm2 logs qualitivate --lines 30 --nostream
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
