const path = require("path");
const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Redireciona a raiz do sistema para a tela inicial.
app.get("/", (req, res) => {
    res.redirect("/tela_inicial/tela_inicial.html");
});

// Rota simples para conferir se o servidor está ligado.
app.get("/api/status", (req, res) => {
    res.json({
        sistema: "SIGACRC",
        api: "online"
    });
});

// Rota da API de CEP.
// Consulta o ViaCEP e aceita apenas endereços localizados em Osasco/SP.
app.get("/cep/:cep", async (req, res) => {
    const cep = String(req.params.cep || "").replace(/\D/g, "");

    if (!/^\d{8}$/.test(cep)) {
        return res.status(400).json({
            erro: "CEP inválido. Informe 8 números."
        });
    }

    try {
        const response = await axios.get(`https://viacep.com.br/ws/${cep}/json/`);

        if (response.data.erro) {
            return res.status(404).json({
                erro: "CEP não encontrado."
            });
        }

        const cidade = response.data.localidade || "";
        const uf = response.data.uf || "";

        if (cidade.toUpperCase() !== "OSASCO" || uf.toUpperCase() !== "SP") {
            return res.status(403).json({
                erro: "CEP fora do município de Osasco."
            });
        }

        return res.json({
            cep: response.data.cep,
            logradouro: response.data.logradouro || "",
            bairro: response.data.bairro || "",
            localidade: response.data.localidade || "",
            uf: response.data.uf || "",
            estado: response.data.estado || "São Paulo",
            regiao: response.data.regiao || "Sudeste"
        });
    } catch (error) {
        console.error("Erro ao consultar CEP:", error.message);

        return res.status(500).json({
            erro: "Erro ao se comunicar com a API de CEP."
        });
    }
});

// Libera acesso aos arquivos HTML, CSS, JS e imagens do front-end.
app.use(express.static(path.join(__dirname)));

app.listen(PORT, () => {
    console.log(`SIGACRC rodando em http://localhost:${PORT}`);
    console.log(`API de CEP disponível em http://localhost:${PORT}/cep/00000000`);
});
