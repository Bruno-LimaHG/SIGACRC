const formLoginCliente = document.getElementById("formLoginCliente");
const mensagemLogin = document.getElementById("mensagemLogin");


function exibirPopupLoginObrigatorio(texto) {
    const modal = document.createElement("section");
    modal.className = "modal modal-login-aviso";
    modal.setAttribute("aria-hidden", "false");
    modal.innerHTML = `
        <div class="modal-card">
            <div class="icone-aviso">!</div>
            <h2>Login necessário</h2>
            <p>${texto}</p>
            <div class="form-acoes">
                <button type="button" id="btnEntendiLogin">Entendi</button>
                <a class="btn btn-secundario" href="../cadastro_clientes/cadastro_clientes.html">Criar cadastro</a>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    const fechar = () => modal.remove();
    modal.querySelector("#btnEntendiLogin").addEventListener("click", fechar);
    modal.addEventListener("click", (event) => {
        if (event.target === modal) {
            fechar();
        }
    });
}

function verificarAvisoLoginObrigatorio() {
    const parametros = new URLSearchParams(window.location.search);
    const aviso = sessionStorage.getItem("avisoLoginSIGACRC");

    if (aviso || parametros.has("aviso")) {
        exibirPopupLoginObrigatorio(aviso || "Para acessar essa área, faça login ou crie seu cadastro.");
        sessionStorage.removeItem("avisoLoginSIGACRC");
    }
}

verificarAvisoLoginObrigatorio();

function mostrarMensagemLogin(texto, tipo = "erro") {
    mensagemLogin.className = `mensagem ${tipo}`;
    mensagemLogin.textContent = texto;
    mensagemLogin.classList.remove("oculto");
}

formLoginCliente.addEventListener("submit", async (event) => {
    event.preventDefault();

    const identificador = document.getElementById("identificador").value.trim();
    const senha = document.getElementById("senha").value;

    if (!identificador || !senha) {
        mostrarMensagemLogin("Preencha e-mail/CPF e senha para continuar.");
        return;
    }

    try {
        const response = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ identificador, senha })
        });
        const result = await response.json();
        
        if (!response.ok) {
            mostrarMensagemLogin(result.erro || "Falha ao autenticar.");
            return;
        }

        if (typeof SIGACRC !== "undefined" && SIGACRC.salvarClienteLogado) {
            SIGACRC.salvarClienteLogado({
                id: result._id || result.id,
                token: result.token,
                nome: result.nome,
                email: result.email,
                cpf: result.cpf,
                acessoEm: new Date().toISOString()
            });
        } else {
            sessionStorage.setItem("usuarioLogado", JSON.stringify(result));
        }

        mostrarMensagemLogin("Login realizado com sucesso. Redirecionando...", "sucesso");

        setTimeout(() => {
            const destino = sessionStorage.getItem("destinoAposLoginSIGACRC");
            sessionStorage.removeItem("destinoAposLoginSIGACRC");
            window.location.href = destino || "../area_cliente/area_cliente.html";
        }, 700);

    } catch (error) {
        console.error(error);
        mostrarMensagemLogin("Erro ao se conectar ao servidor.");
    }
});

// Autenticação com o Google
async function handleCredentialResponse(response) {
    try {
        const res = await fetch("/api/auth/google", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token: response.credential })
        });
        const result = await res.json();
        
        if (!res.ok) {
            mostrarMensagemLogin(result.erro || "Falha no login com Google.");
            return;
        }

        if (typeof SIGACRC !== "undefined" && SIGACRC.salvarClienteLogado) {
            SIGACRC.salvarClienteLogado({
                id: result._id || result.id,
                token: result.token,
                nome: result.nome,
                email: result.email,
                cpf: result.cpf,
                acessoEm: new Date().toISOString()
            });
        } else {
            sessionStorage.setItem("usuarioLogado", JSON.stringify(result));
        }

        mostrarMensagemLogin("Login com Google realizado com sucesso. Redirecionando...", "sucesso");

        setTimeout(() => {
            window.location.href = "../area_cliente/area_cliente.html";
        }, 700);
    } catch (error) {
        console.error(error);
        mostrarMensagemLogin("Erro ao se conectar com Google.");
    }
}

// Recuperação de senha
const linkEsqueciSenha = document.getElementById("linkEsqueciSenha");
const modalEsqueciSenha = document.getElementById("modalEsqueciSenha");
const btnFecharModal = document.getElementById("btnFecharModal");
const btnEnviarCodigo = document.getElementById("btnEnviarCodigo");
const emailRecuperacao = document.getElementById("emailRecuperacao");
const msgRecuperacao = document.getElementById("msgRecuperacao");

const modalRedefinirSenha = document.getElementById("modalRedefinirSenha");
const btnSalvarNovaSenha = document.getElementById("btnSalvarNovaSenha");
const btnFecharModalRedefinir = document.getElementById("btnFecharModalRedefinir");

linkEsqueciSenha.addEventListener("click", (e) => {
    e.preventDefault();
    modalEsqueciSenha.classList.remove("oculto");
    modalEsqueciSenha.setAttribute("aria-hidden", "false");
});

btnFecharModal.addEventListener("click", () => {
    modalEsqueciSenha.classList.add("oculto");
    modalEsqueciSenha.setAttribute("aria-hidden", "true");
});

btnFecharModalRedefinir.addEventListener("click", () => {
    modalRedefinirSenha.classList.add("oculto");
    modalRedefinirSenha.setAttribute("aria-hidden", "true");
});

btnEnviarCodigo.addEventListener("click", async () => {
    const email = emailRecuperacao.value.trim();
    if (!email) {
        msgRecuperacao.textContent = "Digite seu e-mail.";
        msgRecuperacao.className = "mensagem erro";
        msgRecuperacao.classList.remove("oculto");
        return;
    }
    msgRecuperacao.textContent = "Enviando código...";
    msgRecuperacao.className = "mensagem sucesso";
    msgRecuperacao.classList.remove("oculto");

    try {
        const res = await fetch("/api/auth/esqueci-senha", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email })
        });
        const result = await res.json();
        
        if (!res.ok) {
            msgRecuperacao.textContent = result.erro || "Erro ao enviar e-mail.";
            msgRecuperacao.className = "mensagem erro";
            return;
        }

        msgRecuperacao.textContent = "Código enviado! Verifique seu e-mail.";
        setTimeout(() => {
            modalEsqueciSenha.classList.add("oculto");
            modalRedefinirSenha.classList.remove("oculto");
        }, 1500);

    } catch (error) {
        msgRecuperacao.textContent = "Erro de conexão.";
        msgRecuperacao.className = "mensagem erro";
    }
});

btnSalvarNovaSenha.addEventListener("click", async () => {
    const email = emailRecuperacao.value.trim();
    const codigo = document.getElementById("codigoVerificacao").value.trim();
    const novaSenha = document.getElementById("novaSenhaRecuperacao").value;
    const msgRedefinir = document.getElementById("msgRedefinir");

    if (!codigo || !novaSenha) {
        msgRedefinir.textContent = "Preencha todos os campos.";
        msgRedefinir.className = "mensagem erro";
        msgRedefinir.classList.remove("oculto");
        return;
    }

    try {
        const res = await fetch("/api/auth/redefinir-senha", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, codigo, novaSenha })
        });
        const result = await res.json();
        
        if (!res.ok) {
            msgRedefinir.textContent = result.erro || "Erro ao redefinir senha.";
            msgRedefinir.className = "mensagem erro";
            msgRedefinir.classList.remove("oculto");
            return;
        }

        msgRedefinir.textContent = "Senha redefinida com sucesso! Faça o login.";
        msgRedefinir.className = "mensagem sucesso";
        msgRedefinir.classList.remove("oculto");

        setTimeout(() => {
            modalRedefinirSenha.classList.add("oculto");
            document.getElementById("senha").value = "";
        }, 2000);

    } catch (error) {
        msgRedefinir.textContent = "Erro de conexão.";
        msgRedefinir.className = "mensagem erro";
        msgRedefinir.classList.remove("oculto");
    }
});
