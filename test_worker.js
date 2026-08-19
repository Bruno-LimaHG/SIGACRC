const fetch = require('node-fetch'); // actually http
const http = require('http');
const mongoose = require('mongoose');

async function run() {
    const payload = JSON.stringify({
        status: "Pendente",
        documentosAnexos: [
            {
                id: "arquivo_rg_noivos",
                rotulo: "Documento: rg_noivos",
                nome: "minha_foto_nova.png",
                tipo: "image/png",
                dados: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
            }
        ]
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
        res.on('end', () => console.log("PUT:", JSON.parse(data).documentosAnexos));
    });
    req.write(payload);
    req.end();
}
run();
