// gerente/js/painel-admin.js
const user = localStorage.getItem('usuarioLogado');

document.addEventListener('DOMContentLoaded', () => {
    if (typeof inicializarSidebar === 'function') inicializarSidebar();
    const elNome = document.getElementById('nome-admin-sidebar');
    if (elNome) elNome.innerText = user ? user.toUpperCase() : "ADMIN";
    carregarDadosDashboard();
    carregarConfiguracao();
});

async function carregarDadosDashboard() {
    try {
        const response = await fetch('/api/admin/dashboard');
        const data = await response.json();

        if (data.status === 'sucesso') {
            const h2s = document.querySelectorAll('.stat-card h2');
            if (h2s.length >= 4) {
                h2s[0].innerText = data.total_clientes;
                h2s[1].innerText = `R$ ${data.total_receitas.toFixed(2).replace('.', ',')}`;
                h2s[2].innerText = data.total_transacoes;
                h2s[3].innerText = data.total_recuperacoes;
            }

            const tbody = document.querySelector('.premium-table tbody');
            if (tbody) {
                tbody.innerHTML = '';
                console.log("Processando", data.ultimos_usuarios.length, "usuários no sumário.");

                data.ultimos_usuarios.forEach(u => {
                    try {
                        let acoes = '';
                        // Protege o Admin Supremo
                        if (u.username && u.username.toLowerCase() !== 'admin') {
                            acoes = `
                                <div style="display: flex; gap: 8px;">
                                    <button onclick="bloquearUsuario(${u.id}, '${u.username}')" title="Bloquear / Suspender" class="btn-block">
                                        <span class="material-symbols-rounded" style="font-size: 16px;">block</span>
                                    </button>
                                    <button onclick="excluirUsuario(${u.id}, '${u.username}')" title="Mover para Lixeira" class="btn-reject">
                                        <span class="material-symbols-rounded" style="font-size: 16px;">delete</span>
                                    </button>
                                </div>
                            `;
                        } else {
                            acoes = `<span class="material-symbols-rounded" style="color: #ffffff;" title="Admin Supremo">security</span>`;
                        }

                        const role = u.role ? u.role.toLowerCase() : 'cliente';
                        let badgeColor = role === 'admin' ? '#ffffff' : (role === 'revenda' ? '#a1a1aa' : '#e2e8f0');
                        let badgeBg = role === 'admin' ? 'rgba(255, 255, 255, 0.15)' : (role === 'revenda' ? 'rgba(161, 161, 170, 0.1)' : 'rgba(255, 255, 255, 0.05)');

                        tbody.innerHTML += `
                            <tr>
                                <td class="hide-mobile" style="color: #94a3b8;">#${u.id}</td>
                                <td style="font-weight: bold; color: #f8fafc;">${u.username}</td>
                                <td class="hide-tablet"><span style="background: ${badgeBg}; color: ${badgeColor}; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: bold; text-transform: uppercase;">${u.role}</span></td>
                                <td style="text-align: right;">${acoes}</td>
                            </tr>
                        `;
                    } catch (err) {
                        console.error("Erro ao renderizar linha de usuário:", u, err);
                    }
                });
            }
        }
    } catch (error) { console.error("Erro ao carregar dashboard:", error); }
}

// === FUNÇÕES DE AÇÃO ===
async function excluirUsuario(id, username) {
    if (!confirm(`⚠️ Deseja mover '${username}' para a lixeira?`)) return;
    try {
        const response = await fetch(`/api/admin/usuarios/${id}`, { method: 'DELETE' });
        if (response.ok) {
            carregarDadosDashboard(); // Recarrega os dados instantaneamente
        } else {
            alert("Erro ao excluir. Verifique o servidor.");
        }
    } catch (error) { alert("Erro de conexão."); }
}

async function carregarConfiguracao() {
    try {
        const response = await fetch('/api/admin/config');
        const config = await response.json();
        if (config) {
            document.getElementById('config-api-url').value = config.api_url || "";
            document.getElementById('config-system-name').value = config.system_name || "";
        }
    } catch (e) { console.error("Erro ao carregar config:", e); }
}

async function salvarConfiguracao() {
    const api_url = document.getElementById('config-api-url').value;
    const system_name = document.getElementById('config-system-name').value;
    
    try {
        const response = await fetch('/api/admin/config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ api_url, system_name })
        });
        if (response.ok) {
            alert("✅ Configurações de endereçamento salvas!");
        }
    } catch (e) { alert("Erro ao salvar config."); }
}

function abrirModalRestaurar() {
    document.getElementById('modal-restaurar').style.display = 'flex';
}

async function executarRestauro() {
    const btn = document.getElementById('btn-confirmar-restauro');
    const status = document.getElementById('status-restauro');
    
    btn.disabled = true;
    btn.innerText = "Restaurando...";
    status.style.display = 'block';
    
    try {
        const response = await fetch('/api/admin/restaurar-backup', { method: 'POST' });
        const result = await response.json();
        
        if (response.ok && result.status === 'sucesso') {
            alert("✅ " + result.mensagem);
            location.reload(); // Recarrega para ver os dados novos
        } else {
            alert("⚠️ " + (result.mensagem || result.detail || "Erro no restauro."));
            if (result.aviso) console.warn(result.aviso);
        }
    } catch (e) {
        alert("Erro crítico ao tentar restaurar. Verifique o console.");
        console.error(e);
    } finally {
        btn.disabled = false;
        btn.innerText = "Iniciar Restauração";
        status.style.display = 'none';
        document.getElementById('modal-restaurar').style.display = 'none';
    }
}

async function bloquearUsuario(id, username) {
    if (!confirm(`⚠️ Deseja alterar o status de bloqueio de '${username}'?`)) return;
    try {
        const response = await fetch(`/api/admin/bloquear/${id}`, { method: 'POST' });
        if (response.ok) {
            alert(`✅ Status de '${username}' alterado com sucesso!`);
            carregarDadosDashboard();
        } else {
            alert("Erro: A rota de bloqueio não foi encontrada no motor Python.");
        }
    } catch (error) { alert("Erro de conexão."); }
}