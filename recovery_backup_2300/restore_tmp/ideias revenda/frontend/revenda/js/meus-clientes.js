// revenda/js/meus-clientes.js
const user = localStorage.getItem('usuarioLogado');

document.addEventListener('DOMContentLoaded', () => {
    // 1. Inicializa Segurança e Sidebar
    if (typeof inicializarSidebar === 'function') inicializarSidebar();

    document.getElementById('nome-revendedor-sidebar').innerText = user.toUpperCase();

    // 2. Aciona o radar de busca
    carregarClientes();

    // 3. Liga o sistema de filtro em tempo real
    const inputFiltro = document.getElementById('filtro-cliente');
    if (inputFiltro) {
        inputFiltro.addEventListener('keyup', filtrarTabela);
    }
});

async function carregarClientes() {
    try {
        const response = await fetch(`/api/revenda/clientes/${user}`);
        const data = await response.json();
        const tbody = document.getElementById('lista-clientes');
        tbody.innerHTML = '';

        if (data.status === 'sucesso') {
            const clientes = data.clientes || [];

            if (clientes.length === 0) {
                tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#94a3b8; padding:30px;">A sua carteira de clientes está vazia.</td></tr>`;
                return;
            }

            clientes.forEach(c => {
                const isBloqueado = c.status === 'bloqueado';
                const iconBloqueio = isBloqueado ? 'lock_open' : 'block';
                const corBloqueio = isBloqueado ? '#10b981' : '#f59e0b';
                const labelBloqueio = isBloqueado ? 'Desbloquear' : 'Bloquear';

                tbody.innerHTML += `
                    <tr class="cliente-row">
                        <td style="color: #64748b;">#${c.id}</td>
                        <td class="nome-cliente" style="font-weight: bold; color: ${isBloqueado ? '#64748b' : '#f8fafc'};">
                            ${c.username} ${isBloqueado ? '<small>(Bloqueado)</small>' : ''}
                        </td>
                        <td><span class="status-pill ${c.status_vencimento}-pill">${c.status_vencimento.toUpperCase()}</span></td>
                        <td style="color: #94a3b8;">${c.vencimento}</td>
                        <td class="actions-cell">
                            <div style="display: flex; gap: 8px; justify-content: flex-end;">
                                <button onclick="toggleBloqueio('${c.username}')" title="${labelBloqueio}" style="background: rgba(255,255,255,0.05); color: ${corBloqueio}; border: 1px solid rgba(255,255,255,0.1); padding: 8px; border-radius: 8px; cursor: pointer;">
                                    <span class="material-symbols-rounded" style="font-size: 18px;">${iconBloqueio}</span>
                                </button>
                                <button class="btn-reject" onclick="excluirCliente('${c.username}')" title="Mover para Lixeira" style="background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.2); padding: 8px; border-radius: 8px; cursor: pointer;">
                                    <span class="material-symbols-rounded" style="font-size: 18px;">delete</span>
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            });
        }
    } catch (error) {
        console.error("Erro ao carregar clientes:", error);
    }
}

async function toggleBloqueio(cliente) {
    try {
        const response = await fetch(`/api/revenda/toggle-bloqueio/${user}/${cliente}`, { method: 'POST' });
        if (response.ok) {
            const data = await response.json();
            carregarClientes();
            alert(`O status de \${cliente} foi alterado para: \${data.novo_status.toUpperCase()}`);
        } else {
            const result = await response.json();
            alert("Erro: " + (result.detail || "Falha ao mudar status."));
        }
    } catch (error) { alert("Erro de conexão."); }
}

// --- EXCLUSÃO LÓGICA (MANDA PRA LIXEIRA) ---
async function excluirCliente(clienteAlvo) {
    if (!confirm(`⚠️ Comandante, deseja mover o cliente '${clienteAlvo}' para a Lixeira?`)) return;

    try {
        const response = await fetch(`/api/revenda/excluir-cliente/${user}/${clienteAlvo}`, { method: 'DELETE' });
        const result = await response.json();

        if (response.ok) {
            carregarClientes(); // Some da lista na hora
        } else {
            alert("❌ Erro: " + (result.detail || "Falha ao excluir."));
        }
    } catch (error) {
        alert("🚨 Erro de conexão com o motor central.");
    }
}

function filtrarTabela() {
    const filter = document.getElementById('filtro-cliente').value.toLowerCase();
    const rows = document.querySelectorAll('.cliente-row');

    rows.forEach(row => {
        const nome = row.querySelector('.nome-cliente').innerText.toLowerCase();
        if (nome.includes(filter)) {
            row.style.display = "";
        } else {
            row.style.display = "none";
        }
    });
}