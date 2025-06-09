require('dotenv').config();

console.log('Variables de entorno necesarias para el restablecimiento de contraseña:');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? '✓ Configurado' : '✗ No configurado');
console.log('FRONTEND_URL:', process.env.FRONTEND_URL ? '✓ Configurado' : '✗ No configurado');
console.log('SMTP_HOST:', process.env.SMTP_HOST ? '✓ Configurado' : '✗ No configurado');
console.log('SMTP_PORT:', process.env.SMTP_PORT ? '✓ Configurado' : '✗ No configurado');
console.log('SMTP_USER:', process.env.SMTP_USER ? '✓ Configurado' : '✗ No configurado');
console.log('SMTP_PASS:', process.env.SMTP_PASS ? '✓ Configurado' : '✗ No configurado'); 