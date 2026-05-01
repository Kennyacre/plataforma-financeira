// revenda/js/financeiro.js
const user = localStorage.getItem('usuarioLogado');

document.addEventListener('DOMContentLoaded', () => {
    // 1. Inicializa Segurança e Sidebar
    if (typeof inicializarSidebar === 'function') inicializarSidebar();
    
    document.getElementById('nome-revendedor-sidebar').innerText = user.toUpperCase();

    // 2. Carrega as estatísticas financeiras
    carregarStats();
});

async function carregarStats() {
    try {
        const res = await fetch(`/api/revenda/stats/${user}`);
        const data = await res.json();
        
        if (data.status === 'sucesso') {
            // Atualiza o Saldo de Créditos
            const elCreditos = document.getElementById('saldo-creditos');
            if (elCreditos) elCreditos.innerText = data.creditos;

            // Atualiza o Lucro Total
            const elLucro = document.getElementById('lucro-total');
            if (elLucro) elLucro.innerText = `R$ ${data.lucro_total.toFixed(2).replace('.', ',')}`;
        }
    } catch (e) {
        console.error("Erro ao carregar dados financeiros:", e);
        alert("🚨 Falha ao sincronizar com o banco de dados financeiro.");
    }
}