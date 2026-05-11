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

    async function mostrarTelaBloqueio() {
        let pixChave = "Buscando...";
        let pixTitular = "Buscando...";
        let pixBanco = "Buscando...";
        let valor = "0,00";

        try {
            const resPix = await fetch(`/api/pix-pagamento/${userLogado}`);
            if (resPix.ok) {
                const dataPix = await resPix.json();
                pixChave = dataPix.pix_chave;
                pixTitular = dataPix.pix_titular;
                pixBanco = dataPix.pix_banco || "Não informado";
                valor = parseFloat(dataPix.valor || 0).toFixed(2).replace('.', ',');
            }
        } catch(e) { console.error("Erro ao buscar PIX:", e); }

        document.body.innerHTML = `
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&display=swap');
                
                :root {
                    --bg-dark: #09090b;
                    --accent: #ffffff;
                    --glass: rgba(255, 255, 255, 0.03);
                    --glass-border: rgba(255, 255, 255, 0.08);
                }

                body { 
                    margin: 0; padding: 0; overflow: hidden; 
                    background: var(--bg-dark);
                    font-family: 'Outfit', sans-serif;
                    color: white;
                    display: flex; align-items: center; justify-content: center; height: 100vh;
                    background-image: radial-gradient(circle at center, rgba(255,255,255,0.02) 0%, transparent 100%);
                }

                .lock-container {
                    background: var(--glass);
                    border: 1px solid var(--glass-border);
                    backdrop-filter: blur(20px);
                    padding: 40px;
                    border-radius: 32px;
                    width: 90%;
                    max-width: 500px;
                    text-align: center;
                    box-shadow: 0 40px 100px -20px rgba(0,0,0,0.5);
                    animation: slideUp 0.8s cubic-bezier(0.2, 0.8, 0.2, 1);
                }

                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(30px) scale(0.95); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }

                .icon-box {
                    width: 80px; height: 80px;
                    background: white;
                    color: black;
                    border-radius: 24px;
                    display: flex; align-items: center; justify-content: center;
                    margin: 0 auto 30px;
                    box-shadow: 0 15px 30px rgba(255,255,255,0.1);
                }

                h1 { font-size: 32px; font-weight: 800; margin-bottom: 15px; letter-spacing: -1px; }
                p { color: rgba(255,255,255,0.5); font-size: 16px; line-height: 1.6; margin-bottom: 30px; }

                .pix-card {
                    background: rgba(255,255,255,0.03);
                    border: 1px dashed rgba(255,255,255,0.15);
                    border-radius: 20px;
                    padding: 25px;
                    margin-bottom: 30px;
                    text-align: left;
                }

                .field-label { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: rgba(255,255,255,0.4); margin-bottom: 6px; font-weight: 700; }
                .field-value { font-size: 16px; font-weight: 600; color: white; margin-bottom: 15px; word-break: break-all; }

                .value-box {
                    display: flex; justify-content: space-between; align-items: center;
                    padding-top: 15px; border-top: 1px solid rgba(255,255,255,0.05);
                }
                .value-label { font-weight: 600; color: rgba(255,255,255,0.4); }
                .value-amount { font-size: 22px; font-weight: 800; color: white; }

                .btn-action {
                    width: 100%;
                    padding: 18px;
                    border-radius: 16px;
                    font-weight: 700;
                    font-size: 16px;
                    cursor: pointer;
                    transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    border: none;
                    margin-bottom: 12px;
                }

                .btn-unlock { background: white; color: black; }
                .btn-unlock:hover { transform: translateY(-2px); box-shadow: 0 10px 20px rgba(255,255,255,0.2); background: #f4f4f5; }

                .btn-logout { background: transparent; color: rgba(255,255,255,0.4); border: 1px solid rgba(255,255,255,0.1); }
                .btn-logout:hover { background: rgba(255,255,255,0.05); color: white; }
            </style>

            <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@24,400,1,0" />
            
            <div class="lock-container">
                <div class="icon-box">
                    <span class="material-symbols-rounded" style="font-size: 40px;">lock_clock</span>
                </div>
                
                <h1>Assinatura Expirada</h1>
                <p>O seu ciclo de faturamento encerrou. Efetue o pagamento abaixo para desbloquear seu acesso instantaneamente.</p>

                <div class="pix-card">
                    <div class="field-label">Chave PIX</div>
                    <div class="field-value" style="user-select: all; cursor: pointer;" onclick="navigator.clipboard.writeText('${pixChave}'); alert('Chave PIX copiada!')" title="Clique para copiar">${pixChave}</div>
                    
                    <div class="field-label">Titular da Conta</div>
                    <div class="field-value">${pixTitular}</div>

                    <div class="field-label">Instituição / Banco</div>
                    <div class="field-value">${pixBanco}</div>

                    <div class="value-box">
                        <span class="value-label">Valor da Renovação</span>
                        <span class="value-amount">R$ ${valor}</span>
                    </div>
                </div>

                <button class="btn-action btn-unlock" onclick="solicitarAtivacao(this)">
                    Já realizei o pagamento
                </button>

                <button class="btn-logout btn-action" onclick="localStorage.clear(); location.href='/index.html'">
                    Sair e entrar em outra conta
                </button>

                <div style="margin-top: 40px; font-size: 10px; color: rgba(255,255,255,0.3); letter-spacing: 1px; text-transform: uppercase; font-weight: 600;">
                    MTConnect V2 &copy; 2026 | by.tninfo | v2.1.0-PIX
                </div>
            </div>
        `;
    }

    window.solicitarAtivacao = async function(btn) {
        btn.innerText = "Enviando solicitação...";
        btn.disabled = true;

        try {
            const res = await fetch(`/api/solicitar-desbloqueio/${userLogado}`, { method: 'POST' });
            if (res.ok) {
                alert("Solicitação enviada com sucesso! Assim que o administrador confirmar o recebimento, seu acesso será liberado.");
                btn.innerText = "Solicitação Pendente";
            } else {
                alert("Erro ao enviar solicitação. Tente novamente.");
                btn.innerText = "Já realizei o pagamento";
                btn.disabled = false;
            }
        } catch(e) {
            alert("Erro de conexão.");
            btn.disabled = false;
        }
    };

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

function inicializarSidebar() { setupSidebar(); }
window.addEventListener('DOMContentLoaded', setupSidebar);

function forcarAtualizacao() {
    const url = new URL(window.location.href);
    url.searchParams.set('refresh', Date.now());
    window.location.href = url.toString();
}

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js', { scope: '/' })
            .then(reg => console.log('PWA: Ativo'))
            .catch(err => console.error('PWA: Erro', err));
    });
}
