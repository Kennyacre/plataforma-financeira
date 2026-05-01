// gerente/js/aprovar-creditos.js
const user = localStorage.getItem('usuarioLogado');

document.addEventListener('DOMContentLoaded', () => {
    // 1. Inicializa o Guarda da Nave e Sidebar
    if (typeof inicializarSidebar === 'function') inicializarSidebar();

    const elNome = document.getElementById('nome-admin-sidebar');
    if (elNome) elNome.innerText = user ? user.toUpperCase() : "ADMIN";

    // 2. Carrega a lista de pedidos pendentes
    carregarPedidos();
});

async function carregarPedidos() {
    try {
        const response = await fetch('/api/admin/solicitacoes');
        const data = await response.json();
        const tbody = document.getElementById('lista-pedidos');
        tbody.innerHTML = '';

        if (!data || data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 40px; color: #94a3b8;">Nenhum pedido de crédito pendente no radar.</td></tr>`;
            return;
        }

        data.forEach(p => {
            tbody.innerHTML += `
                <tr class="order-row">
                    <td style="color: #64748b;">#${p.id}</td>
                    <td style="font-weight: bold; color: #f8fafc;">${p.username}</td>
                    <td style="color: #f59e0b; font-weight: 700;">${p.creditos} Créditos</td>
                    <td style="color: #10b981; font-weight: 600;">R$ ${p.valor.toFixed(2).replace('.', ',')}</td>
                    <td class="actions-cell">
                        <button class="btn-approve" onclick="responderPedido(${p.id}, 'aprovar')">
                            <span class="material-symbols-rounded">check_circle</span> Aprovar
                        </button>
                        <button class="btn-reject" onclick="responderPedido(${p.id}, 'recusar')">
                            <span class="material-symbols-rounded">cancel</span> Recusar
                        </button>
                    </td>
                </tr>
            `;
        });
    } catch (error) {
        console.error("Erro ao carregar pedidos:", error);
    }
}

async function responderPedido(id, acao) {
    const confirmacao = acao === 'aprovar' ? "Confirmar aprovação e injetar créditos?" : "Deseja recusar este pedido?";
    if (!confirm(confirmacao)) return;

    try {
        const response = await fetch('/api/admin/responder-solicitacao', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id_solicitacao: id, acao: acao })
        });

        const resultado = await response.json();

        if (response.ok && resultado.status === 'sucesso') {
            alert('✅ ' + resultado.mensagem);
            carregarPedidos(); // Atualiza a tabela imediatamente
        } else {
            alert('❌ Erro: ' + (resultado.detail || 'Falha ao processar.'));
        }
    } catch (error) {
        alert('🚨 Erro de conexão com o motor central.');
    }
}