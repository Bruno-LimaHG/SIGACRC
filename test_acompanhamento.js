const http = require('http');

async function run() {
    const { exec } = require('child_process');
    const server = exec('node server.js');
    
    await new Promise(r => setTimeout(r, 2000));
    
    http.get('http://localhost:3000/api/pedidos', (resp) => {
      let data = '';
      resp.on('data', (chunk) => { data += chunk; });
      resp.on('end', () => {
        const pedidos = JSON.parse(data);
        console.log(pedidos.find(p => p.id === '001').observacaoEscrevente);
        server.kill();
      });
    }).on("error", (err) => {
      console.log("Error: " + err.message);
      server.kill();
    });
}
run().catch(console.error);
