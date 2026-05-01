// gerente/js/receitas.js
const user = localStorage.getItem('usuarioLogado');

document.addEventListener('DOMContentLoaded', () => {
    // 1. Inicializa o Guarda da Nave e Sidebar
    if (typeof inicializarSidebar === 'function') inicializarSidebar();

    const elNome = document.getElementById('nome-admin-sidebar');
    if (elNome) elNome.innerText = user ? user.toUpperCase() : "ADMIN";

    // 2. Abre a conexão com o Cofre Forte
    carregarCofreForte();
});

async function carregarCofreForte() {
    try {
        const response = await fetch('/api/admin/receitas');
        const data = await response.json();

        if (data.status === 'sucesso') {
            // Atualiza os Valores do Painel
            document.getElementById('total-geral').innerText = `R$ ${data.total_geral.toFixed(2).replace('.', ',')}`;
            document.getElementById('total-mes').innerText = `R$ ${data.total_mes.toFixed(2).replace('.', ',')}`;

            const tbody = document.getElementById('lista-receitas');
            tbody.innerHTML = '';

            // Se não houver dados
            if (!data.historico || data.historico.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:#64748b; padding: 30px;">O radar ainda não detetou nenhuma transação no sistema.</td></tr>';
                return;
            }

            // Injeta as transações
            data.historico.forEach(t => {
                let isGasto = t.tipo === 'gasto';
                let badgeClass = isGasto ? 'badge-out' : 'badge-in';
                let iconTipo = isGasto ? 'Saída' : 'Entrada';
                let corValor = isGasto ? '#999999' : '#ffffff';
                let sinal = isGasto ? '-' : '+';

                tbody.innerHTML += `
                    <tr>
                        <td style="color: #94a3b8;">${t.data}</td>
                        <td style="font-weight: bold; color: #ffffff;">${t.username}</td>
                        <td class="hide-tablet">${t.descricao}</td>
                        <td class="hide-mobile" style="color: #94a3b8;">${t.pagamento}</td>
                        <td class="hide-mobile"><span class="type-badge ${badgeClass}">${iconTipo}</span></td>
                        <td style="text-align: right; font-weight: bold; color: ${corValor};">
                            ${sinal} R$ ${t.valor.toFixed(2).replace('.', ',')}
                        </td>
                    </tr>
                `;
            });
        }
    } catch (error) {
        console.error("Erro ao carregar o cofre:", error);
    }
}