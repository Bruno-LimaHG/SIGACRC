const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, 'public');
const a11yHtmlPath = path.join(publicDir, 'components', 'a11y', 'a11y.html');

const a11yHtmlContent = fs.readFileSync(a11yHtmlPath, 'utf8');

const headSnippet = `    <link rel="stylesheet" href="/components/a11y/a11y.css">\n`;
const bodySnippet = `
    <!-- Início do Widget de Acessibilidade Personalizado -->
${a11yHtmlContent}
    <script src="/components/a11y/a11y.js"></script>
    <!-- Fim do Widget de Acessibilidade Personalizado -->

    <!-- Início do VLibras -->
    <div vw class="enabled">
      <div vw-access-button class="active"></div>
      <div vw-plugin-wrapper>
        <div class="vw-plugin-top-wrapper"></div>
      </div>
    </div>
    <script src="https://vlibras.gov.br/app/vlibras-plugin.js"></script>
    <script>
      new window.VLibras.Widget('https://vlibras.gov.br/app');
    </script>
    <!-- Fim do VLibras -->
`;

function processDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            // Ignore node_modules or any other irrelevant directories if they exist in public
            processDir(fullPath);
        } else if (fullPath.endsWith('.html')) {
            // Don't modify the a11y.html itself
            if (fullPath === a11yHtmlPath) continue;

            let content = fs.readFileSync(fullPath, 'utf8');
            let modified = false;

            // Insert into <head> if not already there
            if (content.includes('</head>') && !content.includes('a11y.css')) {
                content = content.replace('</head>', headSnippet + '</head>');
                modified = true;
            }

            // Insert into <body> if not already there
            if (content.includes('</body>') && !content.includes('a11y.js')) {
                content = content.replace('</body>', bodySnippet + '</body>');
                modified = true;
            }

            if (modified) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(`Updated: ${fullPath}`);
            }
        }
    }
}

processDir(publicDir);
console.log("Done adding accessibility widgets.");
