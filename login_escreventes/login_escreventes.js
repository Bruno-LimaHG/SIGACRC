console.log("Página de login carregada com sucesso");

const btnToken = document.getElementById("btnToken");

btnToken.addEventListener("click", function() {
    window.location.href = "../login_token/token.html";
});