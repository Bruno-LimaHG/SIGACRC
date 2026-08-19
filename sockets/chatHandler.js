const logger = require("../utils/logger");
const atendimentosDb = require("../db/atendimentos");

function chatHandler(io) {
    io.on("connection", (socket) => {
        console.log(`Conexão Socket estabelecida: ${socket.id} (Usuário: ${socket.user?.email})`);
        logger.info(`Usuário conectado: ${socket.id}`);

        socket.on("entrar_atendimento", (data) => {
            console.log(`Entrada no atendimento: ${socket.id} entrou em ${data?.atendimentoId}`);
            if (!data || !data.atendimentoId) return;
            const room = `atendimento_${data.atendimentoId}`;
            socket.join(room);
            logger.info(`Socket ${socket.id} entrou na sala ${room}`);
        });

        socket.on("enviar_mensagem", async (data) => {
            console.log(`Tentativa de envio: de ${data?.autor} para atendimento ${data?.atendimentoId}`);
            const { atendimentoId, autor, perfil, texto } = data;
            
            try {
                // Salvar a mensagem no MongoDB
                await atendimentosDb.adicionarMensagem(atendimentoId, autor, perfil, texto);
                
                const room = `atendimento_${atendimentoId}`;
                const novaMensagem = { autor, perfil, texto, timestamp: new Date() };
                
                // Emitir para todos na sala
                io.to(room).emit("nova_mensagem", novaMensagem);
                console.log(`Mensagem enviada com sucesso na sala ${room}`);
            } catch (error) {
                console.error(`Erro ao salvar mensagem: ${error.message}`);
                logger.error(`Erro ao processar enviar_mensagem no chat: ${error.message}`);
            }
        });

        socket.on("sair_atendimento", (data) => {
            if (!data || !data.atendimentoId) return;
            const room = `atendimento_${data.atendimentoId}`;
            socket.leave(room);
            logger.info(`Socket ${socket.id} saiu da sala ${room}`);
        });

        socket.on("disconnect", () => {
            console.log(`Desconexão Socket: ${socket.id}`);
            logger.info(`Usuário desconectado: ${socket.id}`);
        });
    });
}

module.exports = chatHandler;
