// gerente/js/painel-admin.js
const user = localStorage.getItem('usuarioLogado');

document.addEventListener('DOMContentLoaded', () => {
    if (typeof inicializarSidebar === 'function') inicializarSidebar();
    const elNome = document.getElementById('nome-admin-sidebar');
    if (elNome) elNome.innerText = user ? user.toUpperCase() : "ADMIN";
    carregarDadosDashboard();
    inicializarGraficos();
});

function inicializarGraficos() {
    // 1. Gráfico de Evolução Financeira (Linhas)
    const ctxEvolucao = document.getElementById('evolucaoChart');
    if (ctxEvolucao) {
        new Chart(ctxEvolucao, {
            type: 'line',
            data: {
                labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
                datasets: [{
                    label: 'Receita Bruta (R$)',
                    data: [1200, 1900, 1500, 2500, 2200, 3100],
                    borderColor: '#ffffff',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    fill: true,
                    tension: 0.4,
                    borderWidth: 3,
                    pointBackgroundColor: '#ffffff',
                    pointRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#666666' } },
                    x: { grid: { display: false }, ticks: { color: '#666666' } }
                }
            }
        });
    }

    // 2. Gráfico de Distribuição (Doughnut)
    const ctxDist = document.getElementById('distribuicaoChart');
    if (ctxDist) {
        new Chart(ctxDist, {
            type: 'doughnut',
            data: {
                labels: ['Ativos', 'Expirados', 'Teste'],
                datasets: [{
                    data: [65, 20, 15],
                    backgroundColor: ['#ffffff', '#888888', '#444444'],
                    borderWidth: 0,
                    hoverOffset: 10
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom', labels: { color: '#666666', boxWidth: 12, font: { size: 10 } } }
                },
                cutout: '70%'
            }
        });
    }
}

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
                                    <button onclick="resetarSenha(${u.id}, '${u.username}')" title="Resetar Senha" class="btn-block">
                                        <span class="material-symbols-rounded" style="font-size: 16px;">lock_reset</span>
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
                        let badgeColor = '#ffffff';
                        let badgeBg = 'rgba(255, 255, 255, 0.1)';
                        if (role === 'admin') {
                            badgeColor = '#ffffff';
                            badgeBg = 'rgba(255, 255, 255, 0.2)';
                        }

                        tbody.innerHTML += `
                            <tr>
                                <td class="hide-mobile" style="color: #ffffff; opacity: 0.7;">#${u.id}</td>
                                <td style="font-weight: bold; color: #ffffff;">${u.username}</td>
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

async function resetarSenha(id, username) {
    if (!confirm(`Deseja resetar a senha de '${username}'? O sistema gerará uma senha temporária.`)) return;
    try {
        const response = await fetch(`/api/admin/reset-senha-usuario/${id}`, { method: 'POST' });
        const data = await response.json();
        if (response.ok && data.status === 'sucesso') {
            alert(`✅ Senha de '${username}' resetada!\n\nNOVA SENHA: ${data.nova_senha}\n\nCopie esta senha e envie ao cliente. Ele deverá trocá-la no próximo acesso.`);
        } else {
            alert("Erro ao resetar senha.");
        }
    } catch (error) { alert("Erro de conexão."); }
}

// === MODAL DE NOVO UTILIZADOR ===
function abrirModalNovoUser() {
    const modal = document.getElementById('modalNovoUser');
    if (modal) {
        modal.classList.add('active');
        // Limpa os campos
        document.getElementById('form-novo-cliente-modal').reset();
    }
}

function fecharModalNovoUser() {
    const modal = document.getElementById('modalNovoUser');
    if (modal) {
        modal.classList.remove('active');
    }
}