const s3Worker = require("./s3Worker");
const emailWorker = require("./emailWorker");
const backupWorker = require("./backupWorker");
const { backupQueue } = require("../queues");
const logger = require("../utils/logger");

logger.info("Workers iniciados");

// Agendar backup automático a cada 24h
const UM_DIA_EM_MS = 24 * 60 * 60 * 1000;

function agendarBackups() {
    const colecoes = ["pedidos", "usuarios", "atendimentos"];
    colecoes.forEach(colecao => {
        backupQueue.add("backup", { colecao });
    });
}

// Executa um primeiro backup e depois agenda
setInterval(agendarBackups, UM_DIA_EM_MS);

// Tratar SIGINT e SIGTERM para fechar workers graciosamente
async function gracefulShutdown() {
    logger.info("Encerrando workers graciosamente...");
    try {
        await Promise.all([
            s3Worker.close(),
            emailWorker.close(),
            backupWorker.close()
        ]);
        logger.info("Workers encerrados.");
        process.exit(0);
    } catch (err) {
        logger.error(`Erro ao encerrar workers: ${err.message}`);
        process.exit(1);
    }
}

process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);
