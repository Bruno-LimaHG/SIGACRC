const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// Configurações
const DB_NAME = 'sigacrc';
const BACKUP_DIR = path.join(__dirname, '..', 'backups');
const DIAS_RETENCAO = 7;

// Garante que o diretório de backups existe
if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR);
}

// Cria nome do arquivo baseado na data e hora
const dataAtual = new Date();
const timestamp = dataAtual.toISOString().replace(/[:.]/g, '-');
const arquivoBackup = path.join(BACKUP_DIR, `backup-${DB_NAME}-${timestamp}.archive`);

console.log(`Iniciando backup do banco '${DB_NAME}' para ${arquivoBackup}...`);

// Comando do mongodump: faz um dump completo e empacota em um único arquivo (.archive)
const cmd = `mongodump --db=${DB_NAME} --archive="${arquivoBackup}" --gzip`;

exec(cmd, (error, stdout, stderr) => {
    if (error) {
        console.error(`Erro ao executar o backup: ${error.message}`);
        process.exit(1);
    }
    
    console.log(`Backup concluído com sucesso: ${arquivoBackup}`);
    
    limparBackupsAntigos();
});

function limparBackupsAntigos() {
    console.log("Verificando política de retenção (7 dias)...");
    
    fs.readdir(BACKUP_DIR, (err, arquivos) => {
        if (err) {
            console.error(`Erro ao ler diretório de backups: ${err.message}`);
            return;
        }

        const agora = Date.now();
        const tempoRetencaoMs = DIAS_RETENCAO * 24 * 60 * 60 * 1000;

        arquivos.forEach((arquivo) => {
            const caminhoArquivo = path.join(BACKUP_DIR, arquivo);
            
            // Ignora se não for arquivo de backup
            if (!arquivo.startsWith('backup-') || !arquivo.endsWith('.archive')) return;

            fs.stat(caminhoArquivo, (err, status) => {
                if (err) {
                    console.error(`Erro ao verificar o status do arquivo ${arquivo}: ${err.message}`);
                    return;
                }

                const diferenca = agora - status.mtimeMs;
                if (diferenca > tempoRetencaoMs) {
                    fs.unlink(caminhoArquivo, (err) => {
                        if (err) {
                            console.error(`Erro ao excluir backup antigo ${arquivo}: ${err.message}`);
                        } else {
                            console.log(`Backup antigo excluído (rotacionado): ${arquivo}`);
                        }
                    });
                }
            });
        });
    });
}
