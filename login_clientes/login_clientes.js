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

formLoginCliente.addEventListener("submit", (event) => {
    event.preventDefault();

    const identificador = document.getElementById("identificador").value.trim();
    const senha = document.getElementById("senha").value;

    if (!identificador || !senha) {
        mostrarMensagemLogin("Preencha e-mail/CPF e senha para continuar.");
        return;
    }

    const usuario = SIGACRC.obterClientePorIdentificador(identificador);

    if (!usuario || usuario.senha !== senha) {
        mostrarMensagemLogin("Cadastro não encontrado ou senha incorreta. Verifique os dados ou crie um cadastro.");
        return;
    }

    SIGACRC.salvarClienteLogado({
        nome: usuario.nome,
        email: usuario.email,
        cpf: usuario.cpf,
        acessoEm: new Date().toISOString()
    });

    mostrarMensagemLogin("Login realizado com sucesso. Redirecionando para a área do cliente...", "sucesso");

    setTimeout(() => {
        const destino = sessionStorage.getItem("destinoAposLoginSIGACRC");
        sessionStorage.removeItem("destinoAposLoginSIGACRC");
        window.location.href = destino || "../area_cliente/area_cliente.html";
    }, 700);
});
