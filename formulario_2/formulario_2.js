document.addEventListener("DOMContentLoaded", function() {

    // BOTÃO VOLTAR
    const btnVoltar = document.getElementById("voltar");
    if (btnVoltar) {
        btnVoltar.onclick = function(e) {
            e.preventDefault();
            window.location.href = "../formulario_1/formulario_1.html";
        };
    }

    // CAMPOS (Ajustados para o 2º Contraente)
    const cpf = document.querySelector('input[name="cpf_contraente2"]');
    const rg = document.querySelector('input[name="rg_contraente2"]');
    const celular = document.querySelector('input[name="celular_contraente2"]');
    const cep = document.querySelector('input[name="cep_contraente2"]');

    // Campos de endereço para preenchimento automático
    const inputLogradouro = document.querySelector('input[name="logradouro_contraente2"]');
    const inputBairro = document.querySelector('input[name="bairro_contraente2"]');
    const inputCidade = document.querySelector('input[name="cidade_contraente2"]');
    
    const btnProximo = document.getElementById("proximo");

    // Trava de segurança do formulário
    let cepPermitidoParaAvancar = false;

    // MÁSCARAS
    if (cpf) {
        cpf.addEventListener("input", function(e) {
            let value = e.target.value.replace(/\D/g, '').slice(0, 11);
            value = value.replace(/(\d{3})(\d)/, '$1.$2');
            value = value.replace(/(\d{3})(\d)/, '$1.$2');
            value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
            e.target.value = value;
        });
    }

    if (rg) {
        rg.addEventListener("input", function(e) {
            let value = e.target.value.replace(/\D/g, '').slice(0, 9);
            value = value.replace(/(\d{2})(\d)/, '$1.$2');
            value = value.replace(/(\d{3})(\d)/, '$1.$2');
            value = value.replace(/(\d{3})(\d{1})$/, '$1-$2');
            e.target.value = value;
        });
    }

    if (celular) {
        celular.addEventListener("input", function(e) {
            let value = e.target.value.replace(/\D/g, '').slice(0, 11);
            value = value.replace(/^(\d{2})(\d)/g, '($1) $2');
            value = value.replace(/(\d{5})(\d)/, '$1-$2');
            e.target.value = value;
        });
    }

    if (cep) {
        cep.addEventListener("input", function(e) {
            let value = e.target.value.replace(/\D/g, '').slice(0, 8);
            value = value.replace(/(\d{5})(\d)/, '$1-$2');
            e.target.value = value;
        });

        // INTEGRAÇÃO COM A API (Corrigida para usar o Proxy do Nginx)
        cep.addEventListener("blur", async function(e) {
            const cepLimpo = e.target.value.replace(/\D/g, ''); 

            if(cepLimpo.length !== 8) return; 

            try {
                // Rota relativa corrigida e usando crases
                const resposta = await fetch(`http://localhost:3000/cep/${cepLimpo}`);
                const dados = await resposta.json();

                if (!resposta.ok) {
                    alert(`Erro: ${dados.erro}`); 
                    
                    if(inputLogradouro) inputLogradouro.value = "";
                    if(inputBairro) inputBairro.value = "";
                    if(inputCidade) inputCidade.value = "";
                    
                    cepPermitidoParaAvancar = false;
                    return;
                }

                if(inputLogradouro) inputLogradouro.value = dados.logradouro;
                if(inputBairro) inputBairro.value = dados.bairro;
                if(inputCidade) inputCidade.value = dados.localidade;
                
                cepPermitidoParaAvancar = true;

            } catch (erro) {
                alert("Erro ao conectar com a API do cartório.");
                cepPermitidoParaAvancar = false;
            }
        });
    }

    // VALIDAÇÃO DO BOTÃO PRÓXIMO
    if (btnProximo) {
        btnProximo.onclick = function(e) {
            e.preventDefault(); 
            
            // Impede o avanço se o CEP não for validado pela API
            if (!cepPermitidoParaAvancar) {
                alert("Atenção: O endereço precisa ser validado para prosseguir.");
                return; 
            }

            window.location.href = "../formulario_3/formulario_3.html";
        };
    }

});