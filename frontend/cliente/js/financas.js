// cliente/js/financas.js
const user = localStorage.getItem('usuarioLogado');

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Segurança e Sidebar
    if (typeof inicializarSidebar === 'function') inicializarSidebar();

    const elNome = document.getElementById('nome-cliente-sidebar');
    const elAvatar = document.getElementById('user-avatar');
    if (elNome) elNome.innerText = user.toUpperCase();
    if (elAvatar) elAvatar.innerText = user.substring(0, 2).toUpperCase();

    // 2. Carregar Motor Financeiro
    await carregarDadosFinancas();
});

async function carregarDadosFinancas() {
    try {
        const resLancamentos = await fetch(`/api/lancamentos/${user}`);
        if (resLancamentos.ok) {
            const dataLanc = await resLancamentos.json();
            const lancamentos = dataLanc.dados || [];

            // Elementos de filtro
            const selMes = document.getElementById('filtro-mes');
            const selAno = document.getElementById('filtro-ano');

            const atualizarTudo = () => {
                const mes = parseInt(selMes?.value) || (new Date().getMonth() + 1);
                const ano = parseInt(selAno?.value) || new Date().getFullYear();

                // Atualiza o texto do período
                const elPeriodo = document.getElementById('periodo-selecionado');
                if (elPeriodo) {
                    const nomesMeses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
                    elPeriodo.innerText = `${nomesMeses[mes - 1]}/${ano}`;
                }

                atualizarCardsResumo(lancamentos, mes, ano);

                // O gráfico Donut deve mostrar os dados do MÊS SELECIONADO para ser útil com o filtro
                let categoriasGastosFiltradas = {};
                lancamentos.forEach(l => {
                    if (!l.data) return;
                    const partes = l.data.split('/');
                    if (partes.length < 3) return;
                    if (parseInt(partes[1]) === mes && parseInt(partes[2]) === ano) {
                        if ((l.tipo || "").toLowerCase() === 'gasto' || (l.tipo || "").toLowerCase() === 'despesa') {
                            const cat = l.categoria || 'Outros';
                            categoriasGastosFiltradas[cat] = (categoriasGastosFiltradas[cat] || 0) + parseFloat(l.valor || 0);
                        }
                    }
                });
                renderizarGraficoDonut(categoriasGastosFiltradas);
            };

            if (selMes) selMes.addEventListener('change', atualizarTudo);
            if (selAno) selAno.addEventListener('change', atualizarTudo);

            // Chamada inicial
            atualizarTudo();
        }
    } catch (error) {
        console.error("Erro ao carregar finanças", error);
    }
}

/**
 * Filtra as transações do mês vigente e atualiza os cards de destaque.
 * @param {Array} lancamentos - Array de transações vindas do backend.
 */
function atualizarCardsResumo(lancamentos, mesFiltro, anoFiltro) {
    const hoje = new Date();
    const mesAlvo = mesFiltro || (hoje.getMonth() + 1);
    const anoAlvo = anoFiltro || hoje.getFullYear();

    let receitasMes = 0;
    let despesasMes = 0;
    let saldoGlobal = 0;

    console.log(`Financas.js: Calculando resumo para ${mesAlvo}/${anoAlvo}...`);

    lancamentos.forEach(l => {
        const tipo = (l.tipo || "").toLowerCase();
        const valor = parseFloat(l.valor) || 0;
        const isReceita = tipo === 'recebimento' || tipo === 'receita';
        const isDespesa = tipo === 'gasto' || tipo === 'despesa';

        // Cálculo do Saldo Global (acumulado)
        if (isReceita) saldoGlobal += valor;
        else if (isDespesa) saldoGlobal -= valor;

        // Cálculo Mensal
        if (!l.data) return;
        const partesData = l.data.split('/');
        if (partesData.length < 3) return;

        const mesLanc = parseInt(partesData[1]);
        const anoLanc = parseInt(partesData[2]);

        if (mesLanc === mesAlvo && anoLanc === anoAlvo) {
            if (isReceita) receitasMes += valor;
            else if (isDespesa) despesasMes += valor;
        }
    });

    console.log(`Financas.js - Resultados: Global=${saldoGlobal}, Rec Mes=${receitasMes}, Desp Mes=${despesasMes}`);

    // Atualiza os elementos HTML
    const elSaldo = document.getElementById('saldo-atual');
    const elReceitas = document.getElementById('receitas-mes');
    const elDespesas = document.getElementById('despesas-mes');

    if (elSaldo) elSaldo.textContent = formatarMoeda(saldoGlobal);
    if (elReceitas) elReceitas.textContent = formatarMoeda(receitasMes);
    if (elDespesas) elDespesas.textContent = formatarMoeda(despesasMes);

    if (!elSaldo || !elReceitas || !elDespesas) {
        console.warn("Financas.js: Alguns elementos não foram encontrados no DOM!");
    }
}

function formatarMoeda(valor) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
}

function renderizarGraficoDonut(dadosCategorias) {
    const ctx = document.getElementById('financasChart').getContext('2d');

    const labels = Object.keys(dadosCategorias);
    const values = Object.values(dadosCategorias);

    // Se não houver dados, não desenha o gráfico
    if (values.length === 0) return;

    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                // Paleta de cores Premium para as categorias
                backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'],
                borderWidth: 4,
                borderColor: '#18181b', // Cor do fundo (Cinza Chumbo)
                hoverOffset: 10
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%', // O buraco maior no meio que você configurou (design elegante)
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        padding: 20,
                        usePointStyle: true,
                        pointStyle: 'circle',
                        color: '#f8fafc',
                        font: { size: 13, family: "'Inter', sans-serif" }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    titleFont: { size: 14, family: "'Inter', sans-serif" },
                    bodyFont: { size: 14, weight: 'bold' },
                    padding: 15,
                    cornerRadius: 10,
                    callbacks: {
                        label: function (context) {
                            return ' R$ ' + context.parsed.toFixed(2).replace('.', ',');
                        }
                    }
                }
            }
        }
    });
}