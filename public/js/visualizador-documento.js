(function () {
    let modal = null;

    function garantirModal() {
        if (modal) {
            return modal;
        }

        modal = document.createElement("div");
        modal.id = "modalVisualizadorDoc";
        modal.className = "modal-visualizador oculto";
        modal.innerHTML = `
            <div class="modal-visualizador-box" role="dialog" aria-modal="true">
                <div class="modal-visualizador-topo">
                    <h3 class="modal-visualizador-titulo">Documento</h3>
                    <button type="button" class="modal-visualizador-fechar" aria-label="Fechar">&times;</button>
                </div>
                <div class="modal-visualizador-conteudo"></div>
            </div>
        `;

        document.body.appendChild(modal);

        modal.querySelector(".modal-visualizador-fechar").addEventListener("click", fecharVisualizador);
        modal.addEventListener("click", (event) => {
            if (event.target === modal) {
                fecharVisualizador();
            }
        });

        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape" && modal && !modal.classList.contains("oculto")) {
                fecharVisualizador();
            }
        });

        return modal;
    }

    function fecharVisualizador() {
        if (!modal) {
            return;
        }

        modal.querySelector(".modal-visualizador-conteudo").innerHTML = "";
        modal.classList.add("oculto");
    }

    function inferirTipo(arquivo) {
        if (arquivo.tipo) {
            return arquivo.tipo;
        }

        const nome = (arquivo.nome || "").toLowerCase();

        if (nome.endsWith(".pdf")) {
            return "application/pdf";
        }

        if (/\.(png|jpe?g|gif|webp|bmp)$/i.test(nome)) {
            return "image/jpeg";
        }

        return "";
    }

    function obterUrl(arquivo) {
        if (arquivo.dados) {
            return arquivo.dados;
        }

        if (arquivo.url) {
            return arquivo.url;
        }

        return null;
    }

    window.visualizarArquivo = function (arquivo) {
        const url = obterUrl(arquivo);

        if (!url) {
            alert("Nenhum arquivo para visualizar.");
            return;
        }

        const elementoModal = garantirModal();
        const titulo = elementoModal.querySelector(".modal-visualizador-titulo");
        const conteudo = elementoModal.querySelector(".modal-visualizador-conteudo");
        const tipo = inferirTipo(arquivo);
        const nome = arquivo.nome || arquivo.rotulo || "Documento";

        titulo.textContent = nome;
        conteudo.innerHTML = "";

        if (tipo.startsWith("image/")) {
            const imagem = document.createElement("img");
            imagem.src = url;
            imagem.alt = nome;
            conteudo.appendChild(imagem);
        } else if (tipo === "application/pdf" || nome.toLowerCase().endsWith(".pdf")) {
            const iframe = document.createElement("iframe");
            iframe.src = url;
            iframe.title = nome;
            conteudo.appendChild(iframe);
        } else {
            const aviso = document.createElement("p");
            aviso.className = "modal-visualizador-aviso";
            aviso.textContent =
                "Pré-visualização não disponível para este tipo de arquivo. Use o botão abaixo para baixar.";

            const link = document.createElement("a");
            link.href = url;
            link.download = nome;
            link.textContent = "Baixar arquivo";
            link.className = "modal-visualizador-download";

            conteudo.appendChild(aviso);
            conteudo.appendChild(link);
        }

        elementoModal.classList.remove("oculto");
    };

    window.fecharVisualizador = fecharVisualizador;
})();
