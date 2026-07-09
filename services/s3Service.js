const { S3Client, PutObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const crypto = require("crypto");

// Inicializando o cliente da AWS usando as credenciais do .env
const s3Client = new S3Client({
    region: process.env.AWS_REGION || "us-east-1",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

/**
 * Faz o upload de um arquivo base64 para o S3
 * @param {string} base64String O conteúdo do arquivo recebido do formulário
 * @param {string} nomeOriginal O nome ou rótulo original do arquivo
 * @returns {Promise<string>} A URL final do arquivo salvo na AWS
 */
async function uploadBase64ParaS3(base64String, nomeOriginal) {
    if (!base64String || typeof base64String !== 'string') {
        return null;
    }

    // 1. Extrair o conteúdo e o tipo do arquivo do Base64
    // O navegador manda algo como: "data:image/png;base64,iVBORw0KGgo..."
    const matches = base64String.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    let buffer;
    let mimeType = "application/octet-stream";

    if (matches && matches.length === 3) {
        mimeType = matches[1];
        buffer = Buffer.from(matches[2], "base64");
    } else {
        buffer = Buffer.from(base64String, "base64");
    }

    // 2. Gerar um nome de arquivo seguro e único
    const extensaoArquivo = mimeType.split("/")[1] || "bin";
    const nomeSanitizado = (nomeOriginal || "arquivo").replace(/[^a-zA-Z0-9_-]/g, "_");
    const nomeUnico = `${crypto.randomBytes(16).toString("hex")}-${nomeSanitizado}.${extensaoArquivo}`;
    const chaveNoBucket = `documentos/${nomeUnico}`;

    // 3. Montar a instrução de upload para o S3
    const command = new PutObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: chaveNoBucket,
        Body: buffer,
        ContentType: mimeType,
        // ACL: "public-read" // Descomente caso o bucket não tenha política pública configurada na raiz
    });

    // 4. Executar o envio
    await s3Client.send(command);

    // 5. Devolver a URL gerada
    const regiao = process.env.AWS_REGION || "us-east-1";
    return `https://${process.env.AWS_BUCKET_NAME}.s3.${regiao}.amazonaws.com/${chaveNoBucket}`;
}

/**
 * Extrai a chave (Key) do objeto S3 a partir de uma URL completa ou string.
 */
function extrairChaveS3(input) {
    if (!input) return null;
    if (input.startsWith("http")) {
        try {
            const url = new URL(input);
            // Remove a barra inicial do pathname para obter a chave
            return url.pathname.startsWith("/") ? url.pathname.substring(1) : url.pathname;
        } catch (e) {
            return null;
        }
    }
    return input;
}

/**
 * Gera uma URL assinada para download/visualização.
 */
async function gerarPreSignedUrl(arquivoInput, expiracaoSegundos = 900) {
    try {
        const chave = extrairChaveS3(arquivoInput);
        if (!chave) throw new Error("Chave do arquivo inválida.");

        const command = new GetObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: chave,
        });

        const urlAssinada = await getSignedUrl(s3Client, command, { 
            expiresIn: expiracaoSegundos 
        });

        return urlAssinada;
    } catch (error) {
        console.error("Erro ao gerar Pre-Signed URL:", error);
        throw error;
    }
}

module.exports = {
    uploadBase64ParaS3,
    gerarPreSignedUrl,
    extrairChaveS3
};
