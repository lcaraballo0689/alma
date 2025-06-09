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

async function testCompleteOTPFlow() {
    const email = 'lecmbogota@gmail.com';
    
    console.log('🔄 Probando flujo completo de restablecimiento con OTP...\n');
    
    try {
        // Paso 1: Solicitar código OTP
        console.log('1️⃣ Solicitando código OTP...');
        const requestData = JSON.stringify({ email });
        const requestOptions = {
            hostname: 'localhost',
            port: 3001,
            path: '/api/password-reset/request',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': requestData.length
            }
        };
        
        const requestResponse = await makeRequest(requestOptions, requestData);
        console.log('   ✅ Código:', requestResponse.statusCode);
        console.log('   📧 Respuesta:', JSON.parse(requestResponse.data).message);
        
        if (requestResponse.statusCode !== 200) {
            console.log('❌ Error al solicitar código OTP');
            return;
        }

        console.log('\n📋 Próximos pasos manuales:');
        console.log('1. Revisa tu correo electrónico');
        console.log('2. Copia el código OTP de 6 dígitos');
        console.log('3. Abre tu navegador en http://localhost:3000');
        console.log('4. Ve a "¿Olvidaste tu contraseña?"');
        console.log('5. Ingresa tu email y el código que recibiste');
        console.log('6. Define una nueva contraseña');
        
        console.log('\n🎯 Alternativamente, puedes probar los endpoints manualmente:');
        console.log('');
        console.log('Para validar OTP:');
        console.log('POST http://localhost:3001/api/password-reset/validate-otp');
        console.log('Body: { "email": "' + email + '", "otp": "CODIGO_DE_6_DIGITOS" }');
        console.log('');
        console.log('Para restablecer contraseña:');
        console.log('POST http://localhost:3001/api/password-reset/reset');
        console.log('Body: { "email": "' + email + '", "otp": "CODIGO_DE_6_DIGITOS", "password": "nuevaContraseña123" }');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testCompleteOTPFlow(); 