const formLogin = document.getElementById("formLoginEscrevente");
const mensagemErro = document.getElementById("mensagemErro");
const btnEntrar = document.getElementById("btnEntrar");

formLogin.addEventListener("submit", async (event) => {
    event.preventDefault();
    
    const identificador = document.getElementById("identificador").value.trim();
    const senha = document.getElementById("senha").value.trim();

    if (!identificador || !senha) {
        mensagemErro.textContent = "Preencha e-mail/CPF e senha.";
        mensagemErro.classList.remove("oculto");
        return;
    }

    btnEntrar.textContent = "Autenticando...";
    btnEntrar.disabled = true;
    mensagemErro.classList.add("oculto");

    try {
        const response = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ identificador, senha })
        });
        
        const dados = await response.json();
        
        if (response.ok) {
            if (dados.perfil !== "escrevente" && dados.perfil !== "oficial") {
                mensagemErro.textContent = "Acesso negado: Perfil incorreto.";
                mensagemErro.classList.remove("oculto");
                btnEntrar.textContent = "Entrar";
                btnEntrar.disabled = false;
                return;
            }
            
            SIGACRC.salvarEscreventeLogado({
                nome: dados.nome,
                email: dados.email,
                id: dados.id,
                perfil: dados.perfil,
                token: dados.token,
                acessoEm: new Date().toISOString()
            });
            window.location.href = "../painel_escrevente/painel_escrevente.html";
        } else {
            mensagemErro.textContent = dados.erro || "Credenciais inválidas.";
            mensagemErro.classList.remove("oculto");
            btnEntrar.textContent = "Entrar";
            btnEntrar.disabled = false;
        }
    } catch (error) {
        mensagemErro.textContent = "Erro de conexão com o servidor.";
        mensagemErro.classList.remove("oculto");
        btnEntrar.textContent = "Entrar";
        btnEntrar.disabled = false;
    }
});
