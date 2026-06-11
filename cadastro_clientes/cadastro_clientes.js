const formCadastro = document.getElementById("formCadastroCliente");
const mensagemCadastro = document.getElementById("mensagemCadastro");
const campoCPF = document.getElementById("cpf");

function mascaraCPF(valor) {
    return valor
        .replace(/\D/g, "")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2")
        .slice(0, 14);
}

function mostrarMensagemCadastro(texto, tipo = "erro") {
    mensagemCadastro.className = `mensagem ${tipo}`;
    mensagemCadastro.textContent = texto;
    mensagemCadastro.classList.remove("oculto");
}

campoCPF.addEventListener("input", () => {
    campoCPF.value = mascaraCPF(campoCPF.value);
});

formCadastro.addEventListener("submit", (event) => {
    event.preventDefault();

    const nome = document.getElementById("nome").value.trim();
    const email = document.getElementById("email").value.trim().toLowerCase();
    const cpf = document.getElementById("cpf").value.trim();
    const senha = document.getElementById("senha").value;
    const cpfNumeros = cpf.replace(/\D/g, "");

    if (!nome || !email || !cpf || !senha) {
        mostrarMensagemCadastro("Preencha todos os campos para concluir o cadastro.");
        return;
    }

    if (!email.includes("@") || !email.includes(".")) {
        mostrarMensagemCadastro("Informe um e-mail válido.");
        return;
    }

    if (cpfNumeros.length !== 11) {
        mostrarMensagemCadastro("Informe um CPF com 11 números.");
        return;
    }

    if (senha.length < 4) {
        mostrarMensagemCadastro("A senha precisa ter pelo menos 4 caracteres.");
        return;
    }

    const usuarios = SIGACRC.usuarios();
    const jaExiste = usuarios.some((usuario) => {
        return usuario.email === email || String(usuario.cpf || "").replace(/\D/g, "") === cpfNumeros;
    });

    if (jaExiste) {
        mostrarMensagemCadastro("Já existe um cadastro com esse e-mail ou CPF.");
        return;
    }

    const novoUsuario = {
        id: crypto.randomUUID ? crypto.randomUUID() : `cliente-${Date.now()}`,
        nome,
        email,
        cpf,
        senha,
        criadoEm: new Date().toISOString()
    };

    usuarios.push(novoUsuario);
    SIGACRC.salvarUsuarios(usuarios);
    SIGACRC.salvarClienteLogado({
        nome,
        email,
        cpf,
        acessoEm: new Date().toISOString()
    });

    mostrarMensagemCadastro("Cadastro realizado com sucesso. Redirecionando para sua área...", "sucesso");

    setTimeout(() => {
        window.location.href = "../area_cliente/area_cliente.html";
    }, 800);
});
