const { conectarMongo } = require("./db/connect");
const Usuario = require("./models/Usuario");

async function run() {
    await conectarMongo();
    const admin = await Usuario.findOne({ email: "admin@sigacrc.com.br" });
    console.log("Admin password in DB:", admin.senha);
    process.exit(0);
}
run();
