async function testarS3() {
    try {
        // Criando uma micro-imagem (1x1 pixel) em formato Base64 para teste
        const dummyBase64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
        
        const payload = {
            solicitante: "Robô Testador S3",
            conjuge: "Sistema AWS",
            tipo: "Casamento Civil",
            cpf: "000.000.000-00",
            documentosAnexos: [
                {
                    id: "doc-teste-s3",
                    rotulo: "Documento de Teste Automático",
                    nome: "teste_s3.png",
                    tipo: "image/png",
                    dados: dummyBase64
                }
            ]
        };

        console.log("Enviando requisição de teste para a API...");

        const response = await fetch("http://localhost:3000/api/pedidos", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-user-id": "escrevente"
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        console.log("Código HTTP:", response.status);
        console.log("Dados salvos no banco:", JSON.stringify(data, null, 2));
        
        if (data.documentosAnexos && data.documentosAnexos[0] && data.documentosAnexos[0].dados.startsWith("http")) {
            console.log("\nSUCESSO: A AWS retornou o link S3 -> " + data.documentosAnexos[0].dados);
        } else {
            console.log("\nAVISO: O arquivo não virou um link S3. Verifique os logs do PM2 para erros de credenciais.");
        }
    } catch (e) {
        console.error("Erro no script de teste:", e.message);
    }
}

testarS3();
