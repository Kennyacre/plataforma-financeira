// gerente/js/painel-admin.js
const user = localStorage.getItem('usuarioLogado');

document.addEventListener('DOMContentLoaded', () => {
    if (typeof inicializarSidebar === 'function') inicializarSidebar();
    const elNome = document.getElementById('nome-admin-sidebar');
    if (elNome) elNome.innerText = user ? user.toUpperCase() : "ADMIN";
    carregarDadosDashboard();
});

async function carregarDadosDashboard() {
    try {
        const response = await fetch('/api/admin/dashboard');
        const data = await response.json();

        if (data.status === 'sucesso') {
            const h2s = document.querySelectorAll('.stat-card h2');
            if (h2s.length >= 3) {
                h2s[0].innerText = data.total_clientes;
                h2s[1].innerText = `R$ ${data.total_receitas.toFixed(2).replace('.', ',')}`;
                h2s[2].innerText = data.total_transacoes;
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
                            acoes = `<span class="material-symbols-rounded" style="color: #10b981;" title="Admin Supremo">security</span>`;
                        }

                        const role = u.role ? u.role.toLowerCase() : 'cliente';
                        let badgeColor = role === 'admin' ? '#f59e0b' : (role === 'revenda' ? '#8b5cf6' : '#10b981');
                        let badgeBg = role === 'admin' ? 'rgba(245, 158, 11, 0.1)' : (role === 'revenda' ? 'rgba(139, 92, 246, 0.1)' : 'rgba(16, 185, 129, 0.1)');

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