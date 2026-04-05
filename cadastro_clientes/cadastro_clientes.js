function cadastrar() {
  const nome = document.getElementById("nome").value;
  const email = document.getElementById("email").value;
  const cpf = document.getElementById("cpf").value;
  const senha = document.getElementById("senha").value;

  if (!nome || !email || !cpf || !senha) {
    alert("Preencha todos os campos!");
    return;
  }

  if (senha.length < 4) {
    alert("Senha muito curta!");
    return;
  }

  // Simulação de cadastro
  alert("Cadastro realizado com sucesso!");

  // Redireciona para login
  window.location.href = "../login_clientes/login_clientes.html";
}