const fetch = require('node-fetch'); // node 16 fallback? no, we use http

const http = require('http');

async function test() {
    // first fetch protocol 163
    const p = await new Promise((resolve) => {
        http.get('http://localhost:3000/api/pedidos/163', (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => resolve(JSON.parse(data)));
        });
    });

    console.log("Original anexos:", p.documentosAnexos.length);

    // reconstruct like formulario.js
    let dadosFormulario = { ...p.dadosCompletos };
    p.documentosAnexos.forEach(doc => {
        dadosFormulario[doc.id] = {
            nome: doc.nome,
            tipo: doc.tipo,
            url: doc.dados,
            dados: doc.dados
        };
    });

    // simulate sending
    const anexos = [];
    Object.keys(dadosFormulario).forEach(chave => {
        if (chave.startsWith("arquivo_") && dadosFormulario[chave]?.dados) {
            anexos.push({
                id: chave,
                rotulo: chave.replace("arquivo_", "Documento: "),
                nome: dadosFormulario[chave].nome,
                tipo: dadosFormulario[chave].tipo,
                dados: dadosFormulario[chave].dados
            });
        }
    });

    console.log("Anexos sent:", anexos.length);

    const payload = JSON.stringify({
        solicitante: p.solicitante,
        conjuge: p.conjuge,
        tipo: p.tipo,
        cpf: p.cpf,
        dadosCompletos: p.dadosCompletos,
        documentos: p.documentos,
        documentosAnexos: anexos,
        status: p.status
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
        res.on('end', () => {
            console.log("PUT Response:", JSON.parse(data).documentosAnexos.length);
        });
    });
    req.write(payload);
    req.end();
}
test();
