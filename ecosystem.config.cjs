/** Configuração PM2 para manter o SIGACRC rodando no Windows Server */
module.exports = {
    apps: [
        {
            name: "sigacrc",
            script: "server.js",
            cwd: __dirname,
            instances: 1,
            autorestart: true,
            watch: false,
            max_memory_restart: "512M",
            env: {
                NODE_ENV: "production",
                PORT: 3000
            }
        }
    ]
};
