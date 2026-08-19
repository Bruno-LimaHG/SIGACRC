const { Queue } = require("bullmq");
const redisConnection = require("../config/redis");
const logger = require("../utils/logger");

const backupQueue = new Queue("mongo-backup", { connection: redisConnection });

backupQueue.on("added", (job) => {
    logger.info(`Job ${job.id} adicionado à fila mongo-backup para coleção ${job.data.colecao || 'todas'}`);
});

module.exports = backupQueue;
