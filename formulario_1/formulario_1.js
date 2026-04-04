// CAMPOS
const resposta = await fetch(`/api/cep/${cepLimpo}`);
const inputCpf = document.querySelector('input[name="cpf_contraente1"]');
const inputRg = document.querySelector('input[name="rg_contraente1"]');
const inputCelular = document.querySelector('input[name="celular_contraente1"]');
const inputCep = document.querySelector('input[name="cep_contraente1"]');

// Campos de endereço que serão preenchidos automaticamente
const inputLogradouro = document.querySelector('input[name="logradouro_contraente1"]');
const inputBairro = document.querySelector('input[name="bairro_contraente1"]');
const inputCidade = document.querySelector('input[name="cidade_contraente1"]');

const btnProximo = document.getElementById("proximo");

// Variável de controle (Cadeado do formulário)
let cepPermitidoParaAvancar = false;

// Função de cálculo de idade (Mantida do seu código)
function calcularIdade(dataNascimento) {
    const hoje = new Date();
    const nascimento = new Date(dataNascimento);
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const mes = hoje.getMonth() - nascimento.getMonth();
    if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
        idade--;
    }
    return idade;
}

// MÁSCARAS
inputCpf.addEventListener("input", function(e) {
    let value = e.target.value.replace(/\D/g, '').slice(0, 11);
    value = value.replace(/(\d{3})(\d)/, '$1.$2');
    value = value.replace(/(\d{3})(\d)/, '$1.$2');
    value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    e.target.value = value;
});

inputRg.addEventListener("input", function(e) {
    let value = e.target.value.replace(/\D/g, '').slice(0, 9);
    value = value.replace(/(\d{2})(\d)/, '$1.$2');
    value = value.replace(/(\d{3})(\d)/, '$1.$2');
    value = value.replace(/(\d{3})(\d{1})$/, '$1-$2');
    e.target.value = value;
});

inputCelular.addEventListener("input", function(e) {
    let value = e.target.value.replace(/\D/g, '').slice(0, 11);
    value = value.replace(/^(\d{2})(\d)/g, '($1) $2');
    value = value.replace(/(\d{5})(\d)/, '$1-$2')
    e.target.value = value;
});

inputCep.addEventListener("input", function(e) {
    let value = e.target.value.replace(/\D/g, '').slice(0, 8);
    value = value.replace(/(\d{5})(\d)/, '$1-$2');
    e.target.value = value;
});


// 🚀 INTEGRAÇÃO COM A API DE CEP
// Usamos o evento 'blur' (quando o usuário clica fora do campo de CEP após digitar)
inputCep.addEventListener("blur", async function(e) {
    // Tira o traço do CEP para mandar só os números para a API
    const cepLimpo = e.target.value.replace(/\D/g, ''); 

    // Se não tiver 8 números, ignora
    if(cepLimpo.length !== 8) return; 

    try {
        // Faz a requisição para o seu servidor Node.js
        const resposta = await fetch(`http://localhost:3000/cep/${cepLimpo}`);
        const dados = await resposta.json();

        // Se a API retornar algum erro (como o 403 de jurisdição que você criou)
        if (!resposta.ok) {
            alert(`Erro: ${dados.erro}`); // Exibe o erro do seu back-end
            
            // Limpa os campos e tranca o formulário
            inputLogradouro.value = "";
            inputBairro.value = "";
            inputCidade.value = "";
            cepPermitidoParaAvancar = false;
            return;
        }

        // Se passou, preenche os campos automaticamente com a resposta do ViaCEP
        inputLogradouro.value = dados.logradouro;
        inputBairro.value = dados.bairro;
        inputCidade.value = dados.localidade;
        
        // Destranca o formulário
        cepPermitidoParaAvancar = true;

    } catch (erro) {
        alert("Erro ao conectar com a API. Verifique se o servidor Node.js está rodando no terminal.");
        cepPermitidoParaAvancar = false;
    }
});

// VALIDAÇÃO DO BOTÃO PRÓXIMO
btnProximo.onclick = function(e){
    e.preventDefault(); // Impede o envio cego do formulário
    
    // Verifica se os campos básicos estão preenchidos e se o CEP foi validado
    if (!cepPermitidoParaAvancar) {
        alert("Atenção: Você precisa informar um CEP válido e pertencente à área de atendimento do cartório para prosseguir.");
        return; // Para a execução aqui, não deixa mudar de página
    }

    // Se chegou aqui, o CEP foi validado no servidor e tá tudo certo.
    window.location.href = "../formulario_2/formulario_2.html";
}