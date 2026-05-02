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

let meuGraficoDonut = null;

// FUNÇÃO DE NAVEGAÇÃO PADRONIZADA (Igual ao Painel Cliente)
function alterarMes(direcao) {
    const elMes = document.getElementById('filtro-mes');
    const elAno = document.getElementById('filtro-ano');
    if (!elMes || !elAno) return;

    let m = parseInt(elMes.value);
    let y = parseInt(elAno.value);

    m += direcao;

    if (m > 12) {
        m = 1;
        y++;
    } else if (m < 1) {
        m = 12;
        y--;
    }

    // Atualiza os valores nos selects escondidos
    elMes.value = m;
    
    // Garante que o ano exista no select
    let anoExiste = false;
    for(let i=0; i<elAno.options.length; i++) {
        if(parseInt(elAno.options[i].value) === y) {
            anoExiste = true;
            break;
        }
    }
    if(!anoExiste) {
        const option = document.createElement('option');
        option.value = y;
        option.text = y;
        elAno.add(option);
    }
    elAno.value = y;

    // Dispara a atualização global da página
    if (typeof window.atualizarTudoFinancas === 'function') {
        window.atualizarTudoFinancas();
    }
}

function toggleMonthPicker() {
    // Implementação futura do modal de calendário se necessário
    console.log("Abrindo seletor de meses...");
}

async function carregarDadosFinancas() {
    try {
        const resLancamentos = await fetch(`/api/lancamentos/${user}`);
        if (resLancamentos.ok) {
            const dataLanc = await resLancamentos.json();
            const lancamentos = dataLanc.dados || [];

            const selMes = document.getElementById('filtro-mes');
            const selAno = document.getElementById('filtro-ano');
            const elTextoPeriodo = document.getElementById('texto-periodo');

            // --- INICIALIZAÇÃO NO MÊS/ANO ATUAL ---
            const agora = new Date();
            if (selMes) selMes.value = agora.getMonth() + 1;
            if (selAno) {
                const anoAtual = agora.getFullYear();
                // Verifica se o ano atual existe nas opções, se não, adiciona
                let existe = false;
                for(let i=0; i<selAno.options.length; i++) {
                    if(parseInt(selAno.options[i].value) === anoAtual) { existe = true; break; }
                }
                if(!existe) {
                    const opt = new Option(anoAtual, anoAtual);
                    selAno.add(opt);
                }
                selAno.value = anoAtual;
            }

            window.atualizarTudoFinancas = () => {
                const mes = parseInt(selMes?.value) || (new Date().getMonth() + 1);
                const ano = parseInt(selAno?.value) || new Date().getFullYear();

                const nomesMeses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
                const periodoTexto = `${nomesMeses[mes - 1]} ${ano}`;

                // Atualiza o texto na pílula premium
                if (elTextoPeriodo) {
                    elTextoPeriodo.innerText = periodoTexto;
                }

                // Atualiza o breadcrumb/subtítulo
                const elPeriodo = document.getElementById('periodo-selecionado');
                if (elPeriodo) {
                    elPeriodo.innerText = periodoTexto.replace(' ', '/');
                }

                // --- NOVO: FILTRAR E RENDERIZAR PENDÊNCIAS COM DETECÇÃO DE DATA INTELIGENTE ---
                const elListaPendentes = document.getElementById('lista-pendentes');
                if (elListaPendentes) {
                    const pendentes = lancamentos.filter(l => {
                        if (!l.data) return false;
                        
                        // Garante que a data seja tratada corretamente independente de ser ISO ou BR
                        const partes = l.data.includes('-') ? l.data.split('-') : l.data.split('/');
                        const isISO = l.data.includes('-');

                        const diaL = isISO ? parseInt(partes[2]) : parseInt(partes[0]);
                        const mesL = isISO ? parseInt(partes[1]) : parseInt(partes[1]);
                        const anoL = isISO ? parseInt(partes[0]) : parseInt(partes[2]);

                        const tipo = (l.tipo || "").toLowerCase();
                        const status = (l.status || "").toLowerCase();

                        return (mesL === mes && 
                                anoL === ano && 
                                (tipo === 'gasto' || tipo === 'despesa') && 
                                status === 'pendente');
                    });

                    console.log(`Financas.js: Filtrados ${pendentes.length} pendentes para ${mes}/${ano}`);

                    if (pendentes.length === 0) {
                        elListaPendentes.innerHTML = '<p class="no-pending-msg">Nenhuma conta pendente para este mês. Tudo em dia! 🎉</p>';
                    } else {
                        elListaPendentes.innerHTML = pendentes.map(p => `
                            <div class="pending-item">
                                <div class="pending-info">
                                    <span class="pending-desc">${p.descricao}</span>
                                    <span class="pending-meta">${p.data} • ${p.pagamento || 'Não definido'}</span>
                                </div>
                                <div style="display: flex; align-items: center;">
                                    <span class="pending-value">${formatarMoeda(p.valor)}</span>
                                    <button class="btn-confirm-pay" onclick="confirmarPagamentoRapido(${p.id})">
                                        Pagar Agora
                                    </button>
                                </div>
                            </div>
                        `).join('');
                    }
                }

                // --- ATUALIZAR RESUMO E GRÁFICO ---
                try {
                    atualizarCardsResumo(lancamentos, mes, ano);
                    
                    let categoriasGastosFiltradas = {};
                    lancamentos.forEach(l => {
                        if (!l.data) return;
                        const partes = l.data.includes('-') ? l.data.split('-') : l.data.split('/');
                        const isISO = l.data.includes('-');
                        const mesL = parseInt(partes[1]);
                        const anoL = isISO ? parseInt(partes[0]) : parseInt(partes[2]);

                        if (mesL === mes && anoL === ano) {
                            if ((l.tipo || "").toLowerCase() === 'gasto' || (l.tipo || "").toLowerCase() === 'despesa') {
                                const cat = l.categoria || 'Outros';
                                categoriasGastosFiltradas[cat] = (categoriasGastosFiltradas[cat] || 0) + parseFloat(l.valor || 0);
                            }
                        }
                    });
                    renderizarGraficoDonut(categoriasGastosFiltradas);
                } catch (err) {
                    console.error("Erro ao renderizar componentes visuais:", err);
                }
            };

            if (selMes) selMes.addEventListener('change', window.atualizarTudoFinancas);
            if (selAno) selAno.addEventListener('change', window.atualizarTudoFinancas);

            window.atualizarTudoFinancas();
        }
    } catch (error) {
        console.error("Erro ao carregar finanças", error);
    }
}

// FUNÇÃO PARA CONFIRMAR PAGAMENTO RÁPIDO
async function confirmarPagamentoRapido(id) {
    if (!confirm("Confirmar o pagamento desta conta?")) return;

    try {
        const res = await fetch(`/api/confirmar-pagamento/${id}`, {
            method: 'PUT'
        });

        if (res.ok) {
            // Em vez de recarregar a página, recarrega os dados e atualiza a UI
            await carregarDadosFinancas();
        } else {
            alert("Erro ao confirmar pagamento.");
        }
    } catch (error) {
        console.error("Erro:", error);
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
        const partesData = l.data.includes('-') ? l.data.split('-') : l.data.split('/');
        const isISO = l.data.includes('-');

        const mesLanc = parseInt(partesData[1]);
        const anoLanc = isISO ? parseInt(partesData[0]) : parseInt(partesData[2]);

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
    const elCanvas = document.getElementById('financasChart');
    if (!elCanvas) return;
    const ctx = elCanvas.getContext('2d');

    // Destrói o gráfico anterior se ele existir para não dar bug visual ao mudar de mês
    if (meuGraficoDonut) {
        meuGraficoDonut.destroy();
    }

    const labels = Object.keys(dadosCategorias);
    const values = Object.values(dadosCategorias);

    // Se não houver dados, não desenha o gráfico
    if (values.length === 0) return;

    meuGraficoDonut = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                // Paleta de cores Premium para as categorias
                backgroundColor: ['#ffffff', '#a1a1aa', '#71717a', '#52525b', '#3f3f46', '#27272a', '#18181b'],
                borderWidth: 2,
                borderColor: '#000000', 
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