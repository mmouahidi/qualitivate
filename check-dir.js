const { Client } = require('ssh2');

const conn = new Client();

conn.on('ready', () => {
    const setupCommands = `
echo "--- Directory Structure of /root/qualitivate.io ---"
ls -la /root/qualitivate.io

echo "--- Content of /root/qualitivate.io/client ---"
ls -la /root/qualitivate.io/client

echo "--- Expected build path inside Node ---"
node -e "const path = require('path'); console.log(path.join('/root/qualitivate.io/server/dist', '../../client/dist'));"
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
