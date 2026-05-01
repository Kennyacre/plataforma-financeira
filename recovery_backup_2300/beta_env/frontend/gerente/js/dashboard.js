// 1. O "Crachá" do usuário
const usuarioLogado = localStorage.getItem('usuario_login') || 'Visitante';

// 2. Formatador de Moeda (Brasil)
function formatarMoeda(valor) {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// 3. Carregar o Resumo Visual
// Nota: Deixamos os valores como 0 ou Mockados para focar no layout agora
async function carregarResumo() {
    console.log(`🎨 Renderizando interface para: ${usuarioLogado}`);

    try {
        // Simulando dados para o Front ficar bonito sem depender do banco agora
        const dadosSimulados = {
            saldo: 1250.00,
            receitas: 2500.00,
            despesas: 1250.00
        };

        // Injetando no HTML
        const saldoElement = document.getElementById('saldo-total');
        const receitaElement = document.getElementById('receitas-total');
        const despesaElement = document.getElementById('despesas-total');

        if (saldoElement) saldoElement.innerText = formatarMoeda(dadosSimulados.saldo);
        if (receitaElement) receitaElement.innerText = formatarMoeda(dadosSimulados.receitas);
        if (despesaElement) despesaElement.innerText = formatarMoeda(dadosSimulados.despesas);

    } catch (error) {
        console.error("❌ Erro ao renderizar o resumo:", error);
    }
}

// 4. Desenha o Gráfico (Visual Dinâmico)
function desenharGrafico() {
    const canvas = document.getElementById('financeChart');
    if (!canvas) return; // Segurança caso o canvas não exista na página

    const ctx = canvas.getContext('2d');
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
            datasets: [
                {
                    label: 'Receitas',
                    data: [1200, 1900, 1500, 2200, 1800, 2500],
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                },
                {
                    label: 'Despesas',
                    data: [500, 800, 600, 1000, 700, 900],
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { labels: { color: '#94a3b8', font: { family: 'Inter' } } }
            },
            scales: {
                y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(51, 65, 85, 0.5)' } },
                x: { ticks: { color: '#94a3b8' }, grid: { display: false } }
            }
        }
    });
}

// 5. Inicialização Única
document.addEventListener('DOMContentLoaded', () => {
    carregarResumo();
    desenharGrafico();
});
// Dados simulados para garantir o funcionamento imediato do Front
const DADOS_CLIENTE = {
    nome: "Cliente TN INFO",
    financeiro: { saldo: 1500.00, receitas: 2000.00, despesas: 500.00 },
    faturas: [
        { id: 1, desc: "Mensalidade Março", valor: 150.00, status: "Pendente", venc: "2026-03-20" },
        { id: 2, desc: "Serviço Adicional", valor: 50.00, status: "Pago", venc: "2026-03-05" }
    ]
};

// Função: Atualizar Dashboard Visual
function atualizarDashboard() {
    const f = DADOS_CLIENTE.financeiro;
    document.getElementById('saldo-total').innerText = formatarMoeda(f.saldo);
    document.getElementById('receitas-total').innerText = formatarMoeda(f.receitas);
    document.getElementById('despesas-total').innerText = formatarMoeda(f.despesas);
}

// Função: Gerenciar Pagamento PIX (Função de Front)
function simularPagamento(id) {
    const fatura = DADOS_CLIENTE.faturas.find(f => f.id === id);
    if (fatura) {
        fatura.status = "Pago";
        alert(`Pagamento da fatura "${fatura.desc}" simulado com sucesso!`);
        // Aqui você chamaria a função de recarregar a tabela
    }
}