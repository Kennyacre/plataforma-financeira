// js/security.js
(function () {
    // MOCK PARA O FRONTEND LOCAL (Sem backend)
    // Se quiser ver como o admin, definimos fake no localStorage:
    localStorage.setItem('usuarioLogado', 'admin');
    localStorage.setItem('funcaoUsuario', 'admin');
    
    // TODAS AS TRAVAS DE SEGURANÇA FORAM DESATIVADAS PARA VISUALIZAÇÃO DO LAYOUT
    return;
})();

// Função global para logout
function fazerLogout() {
    localStorage.clear();
    window.location.href = '../index.html';
}

// Função para fechar/abrir sidebar (comum a todos)
function setupSidebar() {
    const btn = document.getElementById('btn-toggle-sidebar');
    const sidebar = document.getElementById('minha-sidebar');

    // Cria o overlay se não existir (necessário para fechar no mobile clicando fora)
    let overlay = document.getElementById('sidebar-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'sidebar-overlay';
        overlay.style = "position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.5); z-index: 998; display: none; opacity: 0; transition: opacity 0.3s ease;";
        document.body.appendChild(overlay);

        overlay.onclick = () => {
            if (sidebar) sidebar.classList.remove('aberta');
            overlay.style.opacity = '0';
            setTimeout(() => overlay.style.display = 'none', 300);
        };
    }

    if (btn && sidebar) {
        btn.onclick = () => {
            // No mobile, usamos a classe 'aberta'. No desktop, 'escondida'.
            const isMobile = window.innerWidth <= 992;

            if (isMobile) {
                sidebar.classList.toggle('aberta');
                if (sidebar.classList.contains('aberta')) {
                    overlay.style.display = 'block';
                    setTimeout(() => overlay.style.opacity = '1', 10);
                } else {
                    overlay.style.opacity = '0';
                    setTimeout(() => overlay.style.display = 'none', 300);
                }
            } else {
                sidebar.classList.toggle('escondida');
            }
        };
    }
}

// Alias para compatibilidade com o painel admin
function inicializarSidebar() {
    setupSidebar();
}

// Auto-inicialização quando a página carregar
window.addEventListener('DOMContentLoaded', setupSidebar);

// Função para forçar atualização no celular (limpar cache básico)
function forcarAtualizacao() {
    const url = new URL(window.location.href);
    url.searchParams.set('refresh', Date.now());
    window.location.href = url.toString();
}
