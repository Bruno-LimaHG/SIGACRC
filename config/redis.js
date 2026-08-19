require("dotenv").config();
const Redis = require("ioredis");
const logger = require("../utils/logger");

const redisConfig = {
    host: process.env.REDIS_HOST || "localhost",
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: null // Necessário para o BullMQ
};

const connection = new Redis(redisConfig);

connection.on("connect", () => {
    logger.info("Conexão bem-sucedida com Redis.");
});

connection.on("error", (err) => {
    logger.error(`Erro na conexão com Redis: ${err.message}`);
});

module.exports = connection;
