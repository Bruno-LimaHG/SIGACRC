function cadastrar() {
  const nome = document.getElementById("nome").value;
  const email = document.getElementById("email").value;
  const cpf = document.getElementById("cpf").value;
  const senha = document.getElementById("senha").value;

  // 1. Valida se algo está vazio
  if (!nome || !email || !cpf || !senha) {
    alert("Preencha todos os campos!");
    return;
  }

  // 2. Valida o tamanho da senha
  if (senha.length < 4) {
    alert("Senha muito curta!");
    return;
  }

  // 3. Simulação de sucesso para a apresentação
  alert("Cadastro realizado com sucesso!");

  // 4. Redirecionamento correto para o Formulário 1
  window.location.href = "../formulario_1/formulario_1.html";
}