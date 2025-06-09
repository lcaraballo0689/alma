const https = require('https');
const http = require('http');

const data = JSON.stringify({
  email: 'lecmbogota@gmail.com'
});

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/password-reset/request',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  let responseData = '';

  res.on('data', (chunk) => {
    responseData += chunk;
  });

  res.on('end', () => {
    console.log('Código de estado:', res.statusCode);
    console.log('Respuesta:', responseData);
  });
});

req.on('error', (error) => {
  console.error('Error:', error);
});

req.write(data);
req.end(); 