const { Worker } = require("bullmq");
const redisConnection = require("../config/redis");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const logger = require("../utils/logger");

const BACKUP_DIR = path.join(__dirname, "..", "backups");

// Garante que o diretório de backups existe
if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

const backupWorker = new Worker("mongo-backup", async (job) => {
    try {
        const colecao = job.data.colecao;
        if (!colecao) {
            throw new Error("Coleção não especificada");
        }

        logger.info(`Iniciando backup da coleção ${colecao}`);
        
        // Conectar ao MongoDB se não estiver conectado
        if (mongoose.connection.readyState !== 1) {
            await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/sigacrc");
        }
        
        const data = await mongoose.connection.db.collection(colecao).find({}).toArray();
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const arquivoBackup = path.join(BACKUP_DIR, `backup-${colecao}-${timestamp}.json`);
        
        fs.writeFileSync(arquivoBackup, JSON.stringify(data, null, 2));
        
        logger.info(`Backup da coleção ${colecao} concluído com sucesso em ${arquivoBackup}`);
        return arquivoBackup;
    } catch (error) {
        logger.error(`Erro ao realizar backup: ${error.message}`);
        throw error;
    }
}, { connection: redisConnection, concurrency: 1 });

backupWorker.on('failed', (job, err) => {
    logger.error(`Job mongo-backup ${job.id} falhou com erro: ${err.message}`);
});

module.exports = backupWorker;
