# Política de Privacidade e Retenção de Dados (LGPD) - SIGACRC

Esta documentação descreve as diretrizes adotadas pelo **Sistema Integrado de Gestão do Cartório de Registro Civil (SIGACRC)** em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 - LGPD).

## 1. Coleta e Finalidade dos Dados
O sistema coleta dados pessoais sensíveis (CPF, RG, Certidões, Endereço e Filiação) de requerentes exclusivamente para a finalidade de **abertura e tramitação de processos de Casamento Civil**.

A coleta está amparada pelas seguintes bases legais (Art. 7º da LGPD):
- **Obrigação Legal ou Regulatória:** Os cartórios são obrigados por provimentos do CNJ e leis federais a arquivar documentos comprobatórios para atos de registro civil.
- **Execução de Contrato:** Realização de serviços solicitados diretamente pelos titulares (noivos).

## 2. Retenção e Ciclo de Vida dos Dados

### A. Dados de Pedidos (Formulários e Anexos S3)
* **Pedidos Finalizados (Aprovados e Registrados no Livro):** Os dados digitais no MongoDB e os anexos (RG, CPF) no AWS S3 serão mantidos por **5 anos**, conforme tabela de temporalidade documental padrão do Judiciário/Cartórios, para auditorias das Corregedorias. Após esse período, os dados digitais podem ser anonimizados, mantendo-se apenas o registro oficial físico do livro.
* **Pedidos Recusados ou Abandonados:** Formulários iniciados mas não concluídos ou que tiveram pendências documentais não sanadas em até **90 dias** deverão ser **excluídos permanentemente** (hard delete) do banco de dados (MongoDB) e os documentos anexos deletados do bucket da AWS S3.

### B. Dados de Usuários (Contas de Acesso)
* Contas de usuários inativas (sem nenhum pedido gerado ou login efetuado) por mais de **1 ano** serão excluídas da base de dados (coleção `usuarios`).

### C. Backups de Banco de Dados
* Os backups físicos (arquivos `.archive`) armazenados no servidor possuem uma **política de rotação rígida de 7 dias**. Qualquer dado deletado do sistema (por expiração ou solicitação) deixará de existir completamente de todos os backups do servidor em, no máximo, 7 dias.

## 3. Direitos do Titular (Direito ao Esquecimento)
De acordo com o Art. 18 da LGPD, os titulares possuem o direito de solicitar a eliminação dos seus dados pessoais.
No entanto, no contexto de **Serviços Notariais e de Registro**, o direito à eliminação **não é absoluto**, sendo superado pela obrigação legal de arquivamento dos atos praticados (Art. 16, inciso I da LGPD).

* **Se não houve ato (pedido não finalizado):** O requerente tem o direito de solicitar e ter sua conta e seus documentos (S3) excluídos em até 15 dias úteis.
* **Se houve ato oficial (casamento realizado):** A solicitação de exclusão limitará o acesso online aos dados na plataforma SIGACRC, porém o Cartório reterá os dados necessários para cumprir sua obrigação legal no acervo permanente (livros e arquivos mortos).

## 4. Medidas Técnicas de Segurança
O SIGACRC garante a segurança técnica dos dados através de:
- **Criptografia em Repouso:** Senhas de acesso são criptografadas unidirecionalmente utilizando `bcrypt`.
- **Controle de Acesso:** Os documentos (S3) não são públicos. Apenas funcionários autenticados via Token JWT conseguem gerar URLs assinadas (Pre-Signed URLs) de acesso temporário (expiração imediata).
- **Rastreabilidade (Logs):** Todos os acessos e erros do sistema ficam centralizados nos arquivos internos protegidos (`logs/error.log` e `logs/combined.log`).
