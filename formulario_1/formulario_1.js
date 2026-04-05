// CAMPOS
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

// Função de cálculo de idade
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
inputCep.addEventListener("blur", async function(e) {
    const cepLimpo = e.target.value.replace(/\D/g, ''); 

    if(cepLimpo.length !== 8) return; 

    try {
        // AQUI ESTÁ A CORREÇÃO NO LUGAR CERTO, USANDO CRASE (`) E O CAMINHO RELATIVO
        const resposta = await fetch(`http://localhost:3000/cep/${cepLimpo}`);
        const dados = await resposta.json();

        if (!resposta.ok) {
            alert(`Erro: ${dados.erro}`); 
            
            inputLogradouro.value = "";
            inputBairro.value = "";
            inputCidade.value = "";
            cepPermitidoParaAvancar = false;
            return;
        }

        inputLogradouro.value = dados.logradouro;
        inputBairro.value = dados.bairro;
        inputCidade.value = dados.localidade;
        
        cepPermitidoParaAvancar = true;

    } catch (erro) {
        alert("Erro ao conectar com a API.");
        cepPermitidoParaAvancar = false;
    }
});

// VALIDAÇÃO DO BOTÃO PRÓXIMO
btnProximo.onclick = function(e){
    e.preventDefault(); 
    
    if (!cepPermitidoParaAvancar) {
        alert("Atenção: Você precisa informar um CEP válido e pertencente à área de atendimento do cartório para prosseguir.");
        return; 
    }

    window.location.href = "../formulario_2/formulario_2.html";
}