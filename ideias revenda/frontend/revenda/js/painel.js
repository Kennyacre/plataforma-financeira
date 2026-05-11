// revenda/js/painel.js
const user = localStorage.getItem('usuarioLogado');

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Inicializa a segurança e a sidebar
    if (typeof inicializarSidebar === 'function') inicializarSidebar();

    // 2. Preenche os dados do Revendedor
    const elNome = document.getElementById('nome-revendedor-sidebar');
    const elAvatar = document.getElementById('user-avatar');
    const tituloBoasVindas = document.getElementById('boas-vindas');
    
    if(elNome) elNome.innerText = user.toUpperCase();
    if(tituloBoasVindas) tituloBoasVindas.innerText = `Olá, ${user.toUpperCase()}!`;
    if(elAvatar) elAvatar.innerText = user.substring(0,2).toUpperCase();

    // 3. Aciona o radar para buscar os clientes
    await carregarClientesDaRevenda();
});

async function carregarClientesDaRevenda() {
    try {
        const response = await fetch(`/api/revenda/clientes/${user}`);
        if (response.ok) {
            const data = await response.json();
            
            if(data.status === 'sucesso') {
                const clientes = data.clientes || [];
                
                // Atualiza os Widgets (Calcula o lucro estimado: R$ 15 por cliente)
                document.getElementById('total-clientes').innerText = clientes.length;
                document.getElementById('clientes-ativos').innerText = clientes.length; // Por enquanto todos ativos
                document.getElementById('lucro-estimado').innerText = `R$ ${(clientes.length * 15).toFixed(2).replace('.', ',')}`;

                renderizarTabela(clientes);
            }
        }
    } catch (error) {
        console.error("Erro ao carregar clientes da revenda:", error);
        document.getElementById('tabela-clientes').innerHTML = `
            <tr><td colspan="5" style="text-align:center; color:#ef4444;">Erro de conexão com o servidor tático.</td></tr>
        `;
    }
}

function renderizarTabela(clientes) {
    const tbody = document.getElementById('tabela-clientes');
    tbody.innerHTML = '';

    if (clientes.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; color: #94a3b8; padding: 40px;">
                    <span class="material-symbols-rounded" style="font-size: 40px; opacity: 0.3;">group_off</span>
                    <h3>Nenhum cliente na sua carteira ainda</h3>
                    <p>Use o menu lateral para cadastrar o seu primeiro cliente.</p>
                </td>
            </tr>
        `;
        return;
    }

    // Exibe apenas os 5 clientes mais recentes
    const recentes = clientes.slice(0, 5);

    recentes.forEach(cliente => {
        tbody.innerHTML += `
            <tr>
                <td style="color: #64748b;">#${cliente.id}</td>
                <td style="font-weight: 600; color: #f8fafc;">${cliente.username}</td>
                <td><span style="background: rgba(16, 185, 129, 0.1); color: #10b981; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: bold;">ATIVO</span></td>
                <td style="color: #94a3b8;">Premium Anual</td>
                <td style="text-align: center;">
                    <button title="Detalhes" onclick="alert('Funcionalidade de detalhes em construção!')" style="background: rgba(59, 130, 246, 0.1); color: #3b82f6; border: none; padding: 6px; border-radius: 8px; cursor: pointer; transition: 0.3s;">
                        <span class="material-symbols-rounded" style="font-size: 18px;">visibility</span>
                    </button>
                </td>
            </tr>
        `;
    });
}