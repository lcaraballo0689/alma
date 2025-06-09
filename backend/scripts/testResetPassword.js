const http = require('http');

// Función para hacer peticiones HTTP
function makeRequest(options, data) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let responseData = '';
            
            res.on('data', (chunk) => {
                responseData += chunk;
            });
            
            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    data: responseData
                });
            });
        });
        
        req.on('error', (error) => {
            reject(error);
        });
        
        if (data) {
            req.write(data);
        }
        req.end();
    });
}

async function testResetPassword() {
    const args = process.argv.slice(2);
    
    if (args.length < 3) {
        console.log('❌ Uso: node testResetPassword.js <email> <codigo_otp> <nueva_contraseña>');
        console.log('Ejemplo: node testResetPassword.js lecmbogota@gmail.com 123456 nuevaContraseña123');
        return;
    }
    
    const email = args[0];
    const otp = args[1];
    const password = args[2];
    
    console.log('🔄 Restableciendo contraseña...\n');
    console.log('Email:', email);
    console.log('Código OTP:', otp);
    console.log('Nueva contraseña:', '*'.repeat(password.length));
    
    try {
        // Restablecer contraseña
        const resetData = JSON.stringify({ email, otp, password });
        const resetOptions = {
            hostname: 'localhost',
            port: 3001,
            path: '/api/password-reset/reset',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': resetData.length
            }
        };
        
        const resetResponse = await makeRequest(resetOptions, resetData);
        console.log('\nCódigo de estado:', resetResponse.statusCode);
        console.log('Respuesta:', resetResponse.data);
        
        if (resetResponse.statusCode === 200) {
            console.log('\n✅ Contraseña restablecida exitosamente');
            console.log('🎉 Ya puedes iniciar sesión con tu nueva contraseña');
        } else {
            console.log('\n❌ Error al restablecer la contraseña');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testResetPassword(); 