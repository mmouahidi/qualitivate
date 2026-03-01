const { Client } = require('ssh2');

const conn = new Client();

conn.on('ready', () => {
    const setupCommands = `
echo "--- Finding PM2 app path ---"
node -e "
const { execSync } = require('child_process');
try {
  const output = execSync('pm2 jlist', { encoding: 'utf-8' });
  const pm2Data = JSON.parse(output);
  const app = pm2Data.find(p => p.name === 'qualitivate');
  if (app) {
    console.log('Found App CWD:', app.pm2_env.pm_cwd);
    execSync('ls -la ' + app.pm2_env.pm_cwd + '/../../client/dist', { stdio: 'inherit' });
  } else {
    console.log('qualitivate pm2 process not found');
  }
} catch (e) {
  console.error(e.message);
}
"
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
