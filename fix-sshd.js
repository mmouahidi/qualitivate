const { Client } = require('ssh2');

const conn = new Client();
console.log('Connecting to VPS to harden SSH and fix MaxStartups...');

conn.on('ready', () => {
    const fixCommands = `
echo "--- Fixing SSH MaxStartups ---"
# Back up sshd_config
cp /etc/ssh/sshd_config /etc/ssh/sshd_config.bak

# Remove any existing MaxStartups line and append a higher limit
sed -i '/^MaxStartups/d' /etc/ssh/sshd_config
echo "MaxStartups 100:30:200" >> /etc/ssh/sshd_config

echo "--- Installing Fail2Ban to block brute force ---"
export DEBIAN_FRONTEND=noninteractive
apt-get update -yq
apt-get install -yq fail2ban
systemctl enable fail2ban
systemctl start fail2ban

echo "--- Restarting SSH Service ---"
systemctl restart ssh
systemctl restart sshd || true

echo "Fix completed."
`;

    conn.exec(fixCommands, (err, stream) => {
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
