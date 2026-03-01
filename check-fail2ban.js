const { Client } = require('ssh2');

const conn = new Client();
console.log('Connecting to VPS to check fail2ban logs...');

conn.on('ready', () => {
    const checkCommands = `
echo "--- Fail2Ban Status ---"
fail2ban-client status
fail2ban-client status sshd
echo "--- Recent SSH Failures for real root ---"
grep "sshd" /var/log/auth.log | grep -v "Invalid user" | tail -n 20
`;

    conn.exec(checkCommands, (err, stream) => {
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
