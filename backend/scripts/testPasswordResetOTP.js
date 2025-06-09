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

async function testOTPSystem() {
    const email = 'lecmbogota@gmail.com';
    
    console.log('🔄 Probando sistema de códigos OTP...\n');
    
    try {
        // 1. Solicitar código OTP
        console.log('1. Solicitando código OTP...');
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
        console.log('Código de estado:', requestResponse.statusCode);
        console.log('Respuesta:', requestResponse.data);
        
        if (requestResponse.statusCode === 200) {
            console.log('✅ Código OTP solicitado exitosamente');
            console.log('📧 Revisa tu correo electrónico para obtener el código OTP');
            
            // Instrucciones para el usuario
            console.log('\n📋 Para completar la prueba:');
            console.log('1. Revisa tu correo electrónico');
            console.log('2. Copia el código OTP de 6 dígitos');
            console.log('3. Ejecuta el siguiente comando reemplazando XXXXXX con tu código:');
            console.log(`   node scripts/testValidateOTP.js ${email} XXXXXX`);
        } else {
            console.log('❌ Error al solicitar código OTP');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testOTPSystem(); 