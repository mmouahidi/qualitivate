
import fetch from 'node-fetch'; // Requires node-fetch or native fetch in node 18+

async function testApiLogin() {
    try {
        console.log('--- Testing API Login ---');
        const email = 'test@qualitivate.io';
        const password = 'password123';

        console.log(`Sending POST to http://localhost:5000/api/auth/login`);

        try {
            const response = await fetch('http://localhost:5000/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            console.log(`Status: ${response.status} ${response.statusText}`);
            const text = await response.text();
            console.log('Body:', text);

        } catch (fetchError) {
            // Handle case where fetch is not available globally (Node < 18)
            // But we are using tsx so it might rely on node version.
            console.error('Fetch error:', fetchError);
        }

    } catch (error) {
        console.error(error);
    }
}

testApiLogin();
