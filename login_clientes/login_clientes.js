function irParaFuncionarios() {
  window.location.href = "../login_escreventes/login_escreventes.html";
}

function login() {
  const senha = document.getElementById("senha").value;

  if (senha.length === 0) {
    alert("Digite a senha");
  } else if (senha.length < 4) {
    alert("Senha muito curta!");
  } else {
    alert("Login realizado (simulação)");
  }
}