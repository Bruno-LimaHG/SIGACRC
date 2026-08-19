const http = require('http');

async function run() {
    const payload = JSON.stringify({
        status: "Pendente",
        documentosAnexos: []
    });

    const req = http.request('http://localhost:3000/api/pedidos/163', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload)
        }
    }, (res) => {
        let data = '';
        res.on('data', c => data += c);
        res.on('end', () => console.log("PUT:", JSON.parse(data).documentosAnexos.length));
    });
    req.write(payload);
    req.end();
}
run();
