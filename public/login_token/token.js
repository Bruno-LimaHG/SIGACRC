const metodo = sessionStorage.getItem("metodoLoginFuncionarioSIGACRC") || "Certificado Digital ICP-Brasil";
const descricaoMetodo = document.getElementById("descricaoMetodo");
const statusToken = document.getElementById("statusToken");
const textoToken = document.getElementById("textoToken");
const btnEntrarPainel = document.getElementById("btnEntrarPainel");

descricaoMetodo.textContent = `Método selecionado: ${metodo}.`;

setTimeout(() => {
    statusToken.textContent = "Acesso reconhecido";
    textoToken.textContent = "O funcionário foi autenticado na simulação e já pode acessar o painel de análise.";
}, 900);

btnEntrarPainel.addEventListener("click", () => {
    SIGACRC.salvarEscreventeLogado({
        nome: "Escrevente SIGACRC",
        metodo,
        acessoEm: new Date().toISOString()
    });

    window.location.href = "/painel-funcionario";
});
