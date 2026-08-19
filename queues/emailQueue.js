const { Queue } = require("bullmq");
const redisConnection = require("../config/redis");
const logger = require("../utils/logger");

const emailQueue = new Queue("email-send", { connection: redisConnection });

emailQueue.on("added", (job) => {
    logger.info(`Job ${job.id} adicionado à fila email-send para ${job.data.to}`);
});

module.exports = emailQueue;
