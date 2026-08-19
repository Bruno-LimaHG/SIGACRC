const { Worker } = require("bullmq");
const redisConnection = require("../config/redis");
const { uploadBase64ParaS3 } = require("../services/s3Service");
const pedidosDb = require("../db/pedidos");
const logger = require("../utils/logger");

const s3Worker = new Worker("s3-upload", async (job) => {
    try {
        const { base64String, nomeOriginal, pedidoId } = job.data;
        
        logger.info(`Processando upload S3 para o pedido ${pedidoId}`);
        const urlS3 = await uploadBase64ParaS3(base64String, nomeOriginal);
        
        // Obter o pedido atual para adicionar a URL
        const pedido = await pedidosDb.buscarPedidoPorId(pedidoId);
        if (pedido) {
            // Acha o placeholder e atualiza
            let documentos = pedido.documentosAnexos || [];
            let docIndex = documentos.findIndex(d => d.nome === nomeOriginal && d.status === "processando");
            if (docIndex !== -1) {
                documentos[docIndex].dados = urlS3;
                documentos[docIndex].status = "concluido";
                documentos[docIndex].tipo = "url_s3";
            } else {
                // Fallback se não encontrar o placeholder
                documentos.push({
                    nome: nomeOriginal,
                    dados: urlS3,
                    tipo: "url_s3",
                    status: "concluido"
                });
            }
            await pedidosDb.atualizarPedidoCompleto(pedidoId, { documentosAnexos: documentos });
            logger.info(`Upload S3 concluído com sucesso para o pedido ${pedidoId}. URL: ${urlS3}`);
        } else {
            logger.warn(`Pedido ${pedidoId} não encontrado após o upload S3.`);
        }
        
        return urlS3;
    } catch (error) {
        logger.error(`Erro ao processar job s3-upload: ${error.message}`);
        throw error;
    }
}, { connection: redisConnection, concurrency: 3 });

s3Worker.on('failed', (job, err) => {
    logger.error(`Job s3-upload ${job.id} falhou com erro: ${err.message}`);
});

module.exports = s3Worker;
