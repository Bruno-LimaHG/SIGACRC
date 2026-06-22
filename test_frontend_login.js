const axios = require('axios');
async function run() {
    // 1. Login to get ID
    const resLogin = await axios.post('http://localhost:3000/api/auth/login', {
        identificador: 'admin@sigacrc.com.br',
        senha: 'admin'
    });
    const adminId = resLogin.data.id;
    console.log("Logged in, ID is", adminId);
    
    // 2. Change password
    const resPatch = await axios.patch(`http://localhost:3000/api/usuarios/${adminId}/senha`, {
        novaSenha: 'newpassword123'
    }, { headers: { 'x-user-id': 'oficial' } });
    console.log("Patch response:", resPatch.data);
    
    // 3. Try to login with new password
    try {
        const resLogin2 = await axios.post('http://localhost:3000/api/auth/login', {
            identificador: 'admin@sigacrc.com.br',
            senha: 'newpassword123'
        });
        console.log("Login with new password SUCCESS", resLogin2.data.id);
    } catch (e) {
        console.log("Login with new password FAILED", e.response.data);
    }
    
    // 4. Revert to 'admin'
    await axios.patch(`http://localhost:3000/api/usuarios/${adminId}/senha`, {
        novaSenha: 'admin'
    }, { headers: { 'x-user-id': 'oficial' } });
}
run();
