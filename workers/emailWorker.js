require("dotenv").config();
const { Worker } = require("bullmq");
const redisConnection = require("../config/redis");
const nodemailer = require("nodemailer");
const logger = require("../utils/logger");

const emailWorker = new Worker("email-send", async (job) => {
    try {
        const { to, subject, text, html } = job.data;
        logger.info(`Processando envio de e-mail para ${to}`);
        
        let transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST || 'smtp.ethereal.email',
            port: process.env.EMAIL_PORT || 587,
            auth: {
                user: process.env.EMAIL_USER || 'johathan.nicolas@ethereal.email',
                pass: process.env.EMAIL_PASS
            }
        });
        
        const info = await transporter.sendMail({
            from: '"SIGACRC" <noreply@sigacrc.com.br>',
            to,
            subject,
            text,
            html
        });
        
        logger.info(`E-mail enviado para ${to}: ${info.messageId}`);
        return info;
    } catch (error) {
        logger.error(`Erro ao enviar e-mail: ${error.message}`);
        throw error;
    }
}, { connection: redisConnection, concurrency: 5 });

emailWorker.on('failed', (job, err) => {
    logger.error(`Job email-send ${job.id} falhou com erro: ${err.message}`);
});

module.exports = emailWorker;
