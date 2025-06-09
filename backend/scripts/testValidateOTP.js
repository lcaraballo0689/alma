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

async function testValidateOTP() {
    const args = process.argv.slice(2);
    
    if (args.length < 2) {
        console.log('❌ Uso: node testValidateOTP.js <email> <codigo_otp>');
        console.log('Ejemplo: node testValidateOTP.js lecmbogota@gmail.com 123456');
        return;
    }
    
    const email = args[0];
    const otp = args[1];
    
    console.log('🔄 Validando código OTP...\n');
    console.log('Email:', email);
    console.log('Código OTP:', otp);
    
    try {
        // Validar código OTP
        const validateData = JSON.stringify({ email, otp });
        const validateOptions = {
            hostname: 'localhost',
            port: 3001,
            path: '/api/password-reset/validate-otp',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': validateData.length
            }
        };
        
        const validateResponse = await makeRequest(validateOptions, validateData);
        console.log('\nCódigo de estado:', validateResponse.statusCode);
        console.log('Respuesta:', validateResponse.data);
        
        if (validateResponse.statusCode === 200) {
            console.log('\n✅ Código OTP válido');
            console.log('\n📋 Para restablecer la contraseña, ejecuta:');
            console.log(`   node scripts/testResetPassword.js ${email} ${otp} nuevaContraseña123`);
        } else {
            console.log('\n❌ Código OTP inválido o expirado');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testValidateOTP(); 