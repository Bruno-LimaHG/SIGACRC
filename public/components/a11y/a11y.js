/* a11y.js - Lógica do Componente Global de Acessibilidade */

/* 
  O IIFE (Immediately Invoked Function Expression) abaixo é executado 
  assim que o script é carregado para evitar FOUC (Flash of Unstyled Content) 
  e aplicar imediatamente as configurações de acessibilidade antes da renderização.
*/
(function initA11y() {
  const currentFontSizeLevel = parseInt(localStorage.getItem('a11y_fontSizeLevel')) || 0;
  const isHighContrast = localStorage.getItem('a11y_highContrast') === 'true';
  const isHighlightLinks = localStorage.getItem('a11y_highlightLinks') === 'true';

  // 1. Aplica o tamanho de fonte no :root (html)
  if (currentFontSizeLevel !== 0) {
    const baseSize = 16;
    const newSize = baseSize + (currentFontSizeLevel * 2);
    document.documentElement.style.setProperty('--font-size-base', `${newSize}px`);
  }

  // Função auxiliar para aplicar as classes no <body>
  function applyBodyClasses() {
    if (isHighContrast) document.body.classList.add('high-contrast');
    if (isHighlightLinks) document.body.classList.add('highlight-links');
  }

  // 2. Aplica as classes no body. Se o body não existir ainda, aguarda o DOMContentLoaded
  if (document.body) {
    applyBodyClasses();
  } else {
    document.addEventListener('DOMContentLoaded', applyBodyClasses);
  }
})();

// Lógica de interação do widget após o DOM ser carregado
document.addEventListener('DOMContentLoaded', () => {
  // 1. Seletores
  const mainBtn = document.getElementById('a11yMainBtn');
  const panel = document.getElementById('a11yPanel');
  const btnIncrease = document.getElementById('btnIncreaseFont');
  const btnDecrease = document.getElementById('btnDecreaseFont');
  const btnContrast = document.getElementById('btnHighContrast');
  const btnHighlight = document.getElementById('btnHighlightLinks');
  
  if (!mainBtn || !panel) return; // Segurança caso o HTML não esteja presente

  const menuItems = [btnIncrease, btnDecrease, btnContrast, btnHighlight];
  
  // 2. Estado
  let isPanelOpen = false;
  let currentFontSizeLevel = parseInt(localStorage.getItem('a11y_fontSizeLevel')) || 0;
  let isHighContrast = localStorage.getItem('a11y_highContrast') === 'true';
  let isHighlightLinks = localStorage.getItem('a11y_highlightLinks') === 'true';

  // Atualiza os botões (aria-pressed) visualmente baseados no estado salvo
  if (isHighContrast) btnContrast.setAttribute('aria-pressed', 'true');
  if (isHighlightLinks) btnHighlight.setAttribute('aria-pressed', 'true');

  // 3. Funções de Acessibilidade
  function togglePanel() {
    isPanelOpen = !isPanelOpen;
    mainBtn.setAttribute('aria-expanded', isPanelOpen);
    
    if (isPanelOpen) {
      panel.removeAttribute('hidden');
      
      // A11y: Atualiza o tabindex para permitir navegação e move foco para o primeiro item
      menuItems.forEach(item => item.setAttribute('tabindex', '0'));
      menuItems[0].focus();
    } else {
      panel.setAttribute('hidden', '');
      
      // A11y: Remove do fluxo de tab e retorna foco ao botão principal
      menuItems.forEach(item => item.setAttribute('tabindex', '-1'));
      mainBtn.focus();
    }
  }

  function applyFontSize(level) {
    const baseSize = 16;
    const newSize = baseSize + (level * 2);
    document.documentElement.style.setProperty('--font-size-base', `${newSize}px`);
  }

  function increaseFont() {
    if (currentFontSizeLevel < 5) { // Limite máximo para não quebrar layout
      currentFontSizeLevel++;
      applyFontSize(currentFontSizeLevel);
      localStorage.setItem('a11y_fontSizeLevel', currentFontSizeLevel);
    }
  }

  function decreaseFont() {
    if (currentFontSizeLevel > -2) { // Limite mínimo
      currentFontSizeLevel--;
      applyFontSize(currentFontSizeLevel);
      localStorage.setItem('a11y_fontSizeLevel', currentFontSizeLevel);
    }
  }

  function toggleContrast() {
    isHighContrast = !isHighContrast;
    
    if (isHighContrast) {
      document.body.classList.add('high-contrast');
      btnContrast.setAttribute('aria-pressed', 'true');
    } else {
      document.body.classList.remove('high-contrast');
      btnContrast.setAttribute('aria-pressed', 'false');
    }
    
    localStorage.setItem('a11y_highContrast', isHighContrast);
  }

  function toggleHighlight() {
    isHighlightLinks = !isHighlightLinks;
    
    if (isHighlightLinks) {
      document.body.classList.add('highlight-links');
      btnHighlight.setAttribute('aria-pressed', 'true');
    } else {
      document.body.classList.remove('highlight-links');
      btnHighlight.setAttribute('aria-pressed', 'false');
    }
    
    localStorage.setItem('a11y_highlightLinks', isHighlightLinks);
  }

  // 4. Event Listeners
  mainBtn.addEventListener('click', togglePanel);
  
  btnIncrease.addEventListener('click', increaseFont);
  btnDecrease.addEventListener('click', decreaseFont);
  btnContrast.addEventListener('click', toggleContrast);
  btnHighlight.addEventListener('click', toggleHighlight);

  // 5. Melhorias na Navegação por Teclado
  document.addEventListener('keydown', (e) => {
    // Esc: Fecha o menu e volta foco ao botão principal
    if (e.key === 'Escape' && isPanelOpen) {
      togglePanel();
    }
  });

  // Fecha o painel se o usuário clicar fora dele
  document.addEventListener('click', (e) => {
    if (isPanelOpen && !document.getElementById('a11yWidget').contains(e.target)) {
      togglePanel();
    }
  });
});
