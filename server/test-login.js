const http = require('http');

const accounts = [
    { email: 'admin@wod.ma', password: 'wod2026', role: 'company_admin' },
    { email: 'basma.agdal@wod.ma', password: 'wod2026', role: 'site_admin' },
    { email: 'mohamed.agdal@wod.ma', password: 'wod2026', role: 'user' },
];

async function testLogin(email, password) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify({ email, password });
        const req = http.request({
            hostname: 'localhost',
            port: 5000,
            path: '/api/auth/login',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': data.length
            }
        }, res => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                resolve({ status: res.statusCode, body: JSON.parse(body) });
            });
        });
        req.on('error', reject);
        req.write(data);
        req.end();
    });
}

async function main() {
    console.log('Testing WOD account logins...\n');
    
    for (const account of accounts) {
        try {
            const result = await testLogin(account.email, account.password);
            if (result.status === 200 && result.body.user) {
                console.log(`✓ ${account.email} - Login OK (${result.body.user.role})`);
            } else {
                console.log(`✗ ${account.email} - Failed: ${result.body.error || 'Unknown error'}`);
            }
        } catch (err) {
            console.log(`✗ ${account.email} - Error: ${err.message}`);
        }
    }
}

main();
