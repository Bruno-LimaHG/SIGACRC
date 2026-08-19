const { Queue } = require("bullmq");
const redisConnection = require("../config/redis");
const logger = require("../utils/logger");

const s3Queue = new Queue("s3-upload", { connection: redisConnection });

s3Queue.on("added", (job) => {
    logger.info(`Job ${job.id} adicionado à fila s3-upload para pedido ${job.data.pedidoId}`);
});

module.exports = s3Queue;
