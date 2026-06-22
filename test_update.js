const { conectarMongo } = require("./db/connect");
const usuariosDb = require("./db/usuarios");
const Usuario = require("./models/Usuario");
const bcrypt = require("bcryptjs");

async function run() {
    await conectarMongo();
    
    // Check old hash
    let admin = await Usuario.findOne({ email: "admin@sigacrc.com.br" });
    console.log("Old hash:", admin.senha);
    
    // Call the same method
    await usuariosDb.atualizarSenha("admin@sigacrc.com.br", "novaSenha123");
    
    // Check new hash
    admin = await Usuario.findOne({ email: "admin@sigacrc.com.br" });
    console.log("New hash:", admin.senha);
    
    // Test verification
    const correct = await bcrypt.compare("novaSenha123", admin.senha);
    console.log("Password verified?", correct);
    
    // Revert back
    await usuariosDb.atualizarSenha("admin@sigacrc.com.br", "admin");
    process.exit(0);
}
run();
