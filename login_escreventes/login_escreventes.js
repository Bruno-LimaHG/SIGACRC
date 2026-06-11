const mensagemFuncionario = document.getElementById("mensagemFuncionario");

document.querySelectorAll(".btnMetodoLogin").forEach((botao) => {
    botao.addEventListener("click", () => {
        const metodo = botao.dataset.metodo;
        sessionStorage.setItem("metodoLoginFuncionarioSIGACRC", metodo);

        mensagemFuncionario.className = "mensagem sucesso";
        mensagemFuncionario.textContent = `Método selecionado: ${metodo}. Redirecionando para a validação...`;
        mensagemFuncionario.classList.remove("oculto");

        setTimeout(() => {
            window.location.href = "../login_token/token.html";
        }, 600);
    });
});
