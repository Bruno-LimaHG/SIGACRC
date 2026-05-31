/* MALDITO BANCO DE DADOS TEMPORARIO         */

const pedidos = [

    {
        id: "001",

        solicitante: "Helena Santos",

        conjuge: "Carlos Henrique",

        tipo: "Casamento Civil",

        cpf: "456.224.543-56",

        status: "Pendente",

        data: "15/12/2026",

        testemunha1: "Marcos Silva",

        testemunha2: "Fernanda Costa",

        documentos: [
            "RG.pdf",
            "CPF.pdf",
            "Comprovante.pdf"
        ]
    },

    {
        id: "002",

        solicitante: "João Souza",

        conjuge: "Maria Souza",

        tipo: "Casamento Religioso",

        cpf: "111.222.333-44",

        status: "Em análise",

        data: "22/01/2027",

        testemunha1: "Lucas Martins",

        testemunha2: "Ana Clara",

        documentos: [
            "RG.pdf",
            "CPF.pdf"
        ]
    },

    {
        id: "003",

        solicitante: "Amanda Costa",

        conjuge: "Gabriel Lima",

        tipo: "Casamento Civil",

        cpf: "999.888.777-66",

        status: "Aprovado",

        data: "08/02/2027",

        testemunha1: "Pedro Silva",

        testemunha2: "Julia Costa",

        documentos: [
            "RG.pdf",
            "CPF.pdf",
            "Certidão.pdf"
        ]
    }

];

/* ELEMENTOS DO HTML                 */


const corpoTabela =
document.getElementById("corpoTabela");

const filtro =
document.getElementById("filtro");

const modal =
document.getElementById("modal");

const fecharModal =
document.getElementById("fecharModal");

const btnAprovar =
document.getElementById("btnAprovar");

const btnRecusar =
document.getElementById("btnRecusar");


/* VARIÁVEL DO PEDIDO ABERTO         */

let pedidoSelecionado = null;


/* RENDERIZAR TABELA                 */

function renderizarTabela(listaPedidos){

    corpoTabela.innerHTML = "";

    listaPedidos.forEach(pedido => {

        let classeStatus = "";

        if(pedido.status === "Pendente"){
            classeStatus = "status-pendente";
        }

        else if(pedido.status === "Aprovado"){
            classeStatus = "status-aprovado";
        }

        else if(pedido.status === "Recusado"){
            classeStatus = "status-recusado";
        }

        else{
            classeStatus = "status-analise";
        }

        corpoTabela.innerHTML += `

            <tr data-id="${pedido.id}">

                <td>${pedido.id}</td>

                <td>${pedido.solicitante}</td>

                <td>${pedido.tipo}</td>

                <td>${pedido.cpf}</td>

                <td class="${classeStatus}">
                    ${pedido.status}
                </td>

            </tr>

        `;

    });

    adicionarEventosLinhas();
}

/* EVENTO DE CLIQUE NAS LINHAS       */

function adicionarEventosLinhas(){

    const linhas =
    document.querySelectorAll("#corpoTabela tr");

    linhas.forEach(linha => {

        linha.addEventListener("click", () => {

            const id =
            linha.dataset.id;

            pedidoSelecionado =
            pedidos.find(
                pedido => pedido.id === id
            );

            abrirModal();

        });

    });

}

/* ABRIR MODAL                       */

function abrirModal(){

    document.getElementById(
        "nomeSolicitante"
    ).innerHTML =
    `<strong>Solicitante:</strong> ${pedidoSelecionado.solicitante}`;

    document.getElementById(
        "nomeConjuge"
    ).innerHTML =
    `<strong>Cônjuge:</strong> ${pedidoSelecionado.conjuge}`;

    document.getElementById(
        "tipoCasamento"
    ).innerHTML =
    `<strong>Tipo:</strong> ${pedidoSelecionado.tipo}`;

    document.getElementById(
        "dataCasamento"
    ).innerHTML =
    `<strong>Data:</strong> ${pedidoSelecionado.data}`;

    document.getElementById(
        "testemunha1"
    ).innerHTML =
    `<strong>Testemunha 1:</strong> ${pedidoSelecionado.testemunha1}`;

    document.getElementById(
        "testemunha2"
    ).innerHTML =
    `<strong>Testemunha 2:</strong> ${pedidoSelecionado.testemunha2}`;

    const areaDocumentos =
    document.getElementById("documentos");

    areaDocumentos.innerHTML = "";

    pedidoSelecionado.documentos.forEach(doc => {

        areaDocumentos.innerHTML +=
        `<button>${doc}</button>`;

    });

    modal.style.display = "flex";
}

/* FECHAR MODAL                      */


fecharModal.addEventListener("click", () => {

    modal.style.display = "none";

});


/* FECHAR CLICANDO FORA              */

window.addEventListener("click", (event) => {

    if(event.target === modal){

        modal.style.display = "none";
    }

});

/* APROVAR PEDIDO                    */

btnAprovar.addEventListener("click", () => {

    if(!pedidoSelecionado) return;

    pedidoSelecionado.status = "Aprovado";

    renderizarTabela(pedidos);

    modal.style.display = "none";

});

/* RECUSAR PEDIDO                    */

btnRecusar.addEventListener("click", () => {

    if(!pedidoSelecionado) return;

    pedidoSelecionado.status = "Recusado";

    renderizarTabela(pedidos);

    modal.style.display = "none";

});

/* FILTRO                            */

filtro.addEventListener("keyup", () => {

    const texto =
    filtro.value.toLowerCase();

    const resultado =
    pedidos.filter(pedido =>

        pedido.id.toLowerCase().includes(texto) ||

        pedido.solicitante
        .toLowerCase()
        .includes(texto) ||

        pedido.tipo
        .toLowerCase()
        .includes(texto) ||

        pedido.cpf
        .toLowerCase()
        .includes(texto) ||

        pedido.status
        .toLowerCase()
        .includes(texto)

    );

    renderizarTabela(resultado);

});

/* INICIAR SISTEMA                   */

renderizarTabela(pedidos);