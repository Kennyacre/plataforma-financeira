const usuarioAtivo = localStorage.getItem('usuario_login');
const API_URL = '/api/transacoes';

// 1. Busca apenas as transações do login logado
async function carregarTabela() {
    if (!usuarioAtivo) return;

    // Chamamos a rota personalizada para o usuário: /api/transacoes/admin ou /api/transacoes/cliente1
    const res = await fetch(`${API_URL}/${usuarioAtivo}`); 
    const dados = await res.json();
    
    const corpoTabela = document.getElementById('listaTransacoes');
    if (corpoTabela) {
        corpoTabela.innerHTML = '';
        dados.forEach(t => {
            const corValor = t.tipo === 'receita' ? '#10b981' : '#ef4444';
            corpoTabela.innerHTML += `
                <tr>
                    <td>${t.descricao}</td>
                    <td style="color: ${corValor}; font-weight: bold;">R$ ${t.valor.toFixed(2)}</td>
                    <td><span class="badge ${t.tipo}">${t.tipo.toUpperCase()}</span></td>
                    <td style="text-align: center;">
                        <button onclick="deletarLancamento(${t.id})" style="background:none; border:none; cursor:pointer;">
                            🗑️
                        </button>
                    </td>
                </tr>
            `;
        });
    }
}

// 2. Lógica do formulário (ADICIONANDO O CARIMBO DO DONO)
const financeForm = document.getElementById('financeForm');
if (financeForm) {
    financeForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const payload = {
            descricao: document.getElementById('descricao').value,
            valor: parseFloat(document.getElementById('valor').value),
            tipo: document.getElementById('tipo').value,
            usuario_login: usuarioAtivo // <--- AQUI ESTÁ A ETIQUETA DE DONO
        };

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            financeForm.reset();
            carregarTabela(); // Recarrega apenas os dados do dono
        }
    });
}

carregarTabela();