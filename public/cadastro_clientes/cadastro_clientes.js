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

formCadastro.addEventListener("submit", async (event) => {
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

    try {
        const btnSubmit = formCadastro.querySelector("button[type='submit']");
        btnSubmit.disabled = true;
        btnSubmit.textContent = "Cadastrando...";

        const response = await fetch("/api/usuarios", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nome, email, cpf, senha, perfil: "cliente" })
        });

        const data = await response.json();

        if (response.ok) {
            mostrarMensagemCadastro("Cadastro realizado com sucesso! Redirecionando...", "sucesso");
            
            // Faz login automaticamente após criar
            try {
                const loginRes = await fetch("/api/auth/login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ identificador: email, senha })
                });
                
                if (loginRes.ok) {
                    const authData = await loginRes.json();
                    SIGACRC.salvarClienteLogado({
                        id: authData._id || authData.id,
                        nome: authData.nome,
                        email: authData.email,
                        cpf: authData.cpf,
                        token: authData.token,
                        acessoEm: new Date().toISOString()
                    });
                    setTimeout(() => window.location.href = "/area-cliente", 1000);
                    return;
                }
            } catch (ignore) {}
            
            setTimeout(() => window.location.href = "/login", 1500);
        } else {
            mostrarMensagemCadastro(data.erro || "Erro ao criar conta.", "erro");
            btnSubmit.disabled = false;
            btnSubmit.textContent = "Cadastrar";
        }
    } catch (error) {
        mostrarMensagemCadastro("Erro de conexão com o servidor.", "erro");
        formCadastro.querySelector("button[type='submit']").disabled = false;
        formCadastro.querySelector("button[type='submit']").textContent = "Cadastrar";
    }
});
