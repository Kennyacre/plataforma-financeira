// js/security.js
(function () {
    const userLogado = localStorage.getItem('usuarioLogado');
    const funcaoUser = localStorage.getItem('funcaoUsuario') ? localStorage.getItem('funcaoUsuario').toLowerCase() : '';
    const path = window.location.pathname;

    // Se não estiver logado e NÃO estiver na login (index.html), manda para o login
    if (!userLogado && path !== '/' && !path.endsWith('index.html')) {
        window.location.href = '/index.html';
        return;
    }

    // Bloqueia clientes de entrar na pasta /gerente (Painel Admin)
    if (path.includes('/gerente/') && (funcaoUser !== 'admin' && funcaoUser !== 'gerente')) {
        alert("Acesso restrito à Torre de Controlo!");
        window.location.href = '/cliente/painel-cliente.html';
    }

    // Verificações em tempo real (Bloqueio e Vencimento)
    if (userLogado && path !== '/' && !path.endsWith('index.html')) {
        fetch(`/api/usuarios/sessao/${userLogado}`)
            .then(res => res.json())
            .then(data => {
                if (data.status === 'bloqueado') {
                    mostrarTelaBloqueio();
                } else if (data.dias_restantes !== null && data.dias_restantes <= 3 && funcaoUser === 'cliente') {
                    mostrarAvisoVencimento(data.dias_restantes);
                }
            })
            .catch(e => console.error("Erro no check de segurança:", e));
    }

    function mostrarTelaBloqueio() {
        document.body.innerHTML = `
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap');
                .material-symbols-rounded { font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
                body { margin: 0; padding: 0; overflow: hidden; }
            </style>
            <div style="height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #0f172a; color: white; font-family: 'Inter', sans-serif; text-align: center; padding: 20px;">
                <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@24,400,1,0" />
                <span class="material-symbols-rounded" style="font-size: 80px; color: #ef4444; margin-bottom: 20px;">lock</span>
                <h1 style="font-size: 32px; margin-bottom: 10px;">Acesso Suspenso</h1>
                <p style="font-size: 18px; color: #94a3b8; max-width: 500px; line-height: 1.6;">
                    A sua conta foi temporariamente bloqueada. Para continuar a utilizar o sistema, é necessário renovar a sua subscrição.
                </p>
                <div style="margin-top: 30px; padding: 20px; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; background: rgba(255,255,255,0.05);">
                    <p style="color: #fcd34d; font-weight: bold;">Entre em contacto com o seu administrador ou revendedor para autorizar o acesso.</p>
                </div>
                <button onclick="localStorage.clear(); location.href='/'" style="margin-top: 40px; background: #3b82f6; color: white; border: none; padding: 12px 30px; border-radius: 8px; cursor: pointer; font-weight: bold; transition: 0.3s; box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);">Ir para o Login</button>
            </div>
        `;
    }

    function mostrarAvisoVencimento(dias) {
        if (document.getElementById('banner-vencimento')) return;
        const banner = document.createElement('div');
        banner.id = 'banner-vencimento';
        banner.style = "position: fixed; top: 0; left: 0; width: 100%; background: #f59e0b; color: #000; text-align: center; padding: 10px; font-weight: bold; z-index: 9999; box-shadow: 0 2px 10px rgba(0,0,0,0.2); font-family: 'Inter', sans-serif;";
        banner.innerHTML = `⚠️ Atenção: A sua assinatura expira em ${dias === 0 ? 'hoje' : dias + ' dias'}. Renove para evitar bloqueio! <button onclick="this.parentElement.remove()" style="margin-left: 20px; border: 1px solid black; background: transparent; cursor: pointer; padding: 2px 8px; border-radius: 4px; font-weight: bold;">OK</button>`;
        document.body.prepend(banner);
    }
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
