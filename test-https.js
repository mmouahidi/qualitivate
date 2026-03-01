const { Client } = require('ssh2');

const conn = new Client();

conn.on('ready', () => {
    const setupCommands = `
echo "--- Testing Localhost HTTPS to Fetch index.html ---"
curl -k -s https://localhost | grep -o "<title>.*</title>"
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
