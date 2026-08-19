const { Server } = require("socket.io");
const { createAdapter } = require("@socket.io/redis-adapter");
const redisClient = require("../config/redis");
const chatHandler = require("./chatHandler");
const jwt = require("jsonwebtoken");

function setupSocket(server) {
    const io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST", "PATCH", "PUT", "DELETE"]
        }
    });

    // Como o adapter do Redis precisa de um pubClient e subClient separados,
    // criamos um duplicate a partir da conexão existente
    const pubClient = redisClient;
    const subClient = pubClient.duplicate();

    io.adapter(createAdapter(pubClient, subClient));

    io.use((socket, next) => {
        const token = socket.handshake.auth?.token;
        if (!token) {
            return next(new Error("Acesso negado: Token não fornecido"));
        }
        jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            if (err) {
                return next(new Error("Acesso negado: Token inválido ou expirado"));
            }
            socket.user = decoded;
            next();
        });
    });

    chatHandler(io);

    return io;
}

module.exports = { setupSocket };
