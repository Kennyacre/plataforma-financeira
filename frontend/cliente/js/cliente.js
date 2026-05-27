// cliente/js/cliente.js
const user = localStorage.getItem('usuarioLogado');

// ==========================================
// 1. UTILITÁRIOS E FORMATAÇÃO
// ==========================================
const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
};

let listaGlobalLancamentos = [];

// ==========================================
// 2. MOTOR DO DASHBOARD (ATUALIZAÇÃO DE UI)
// ==========================================
window.atualizarDashboard = async () => {
    console.log("Atualizando dashboard...");
    const selMes = document.getElementById('filtro-mes');
    const selAno = document.getElementById('filtro-ano');

    const mes = parseInt(selMes?.value) || (new Date().getMonth() + 1);
    const ano = parseInt(selAno?.value) || new Date().getFullYear();

    // 1. Atualizar textos de período
    const nomesMeses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    const periodoTexto = `${nomesMeses[mes - 1]} ${ano}`;
    
    const elTextoPeriodo = document.getElementById('texto-periodo');
    const elPeriodoSelen = document.getElementById('periodo-selecionado');
    const elPickerAno = document.getElementById('picker-ano-atual');

    if (elTextoPeriodo) elTextoPeriodo.innerText = periodoTexto;
    if (elPeriodoSelen) elPeriodoSelen.innerText = periodoTexto.replace(' ', '/');
    if (elPickerAno) elPickerAno.innerText = ano;

    // 2. Marcar mês no seletor (calendário)
    document.querySelectorAll('.month-item').forEach((item, idx) => {
        if (idx + 1 === mes) item.classList.add('current');
        else item.classList.remove('current');
    });

    // 3. Processar dados para os cards e pizzas
    atualizarCardsResumo(listaGlobalLancamentos, mes, ano);
    processarDadosParaPizzas(listaGlobalLancamentos, mes, ano);
    carregarMetasDashboard(listaGlobalLancamentos, mes, ano);
};

function atualizarCardsResumo(lancamentos, mesAlvo, anoAlvo) {
    let receitasMes = 0;
    let despesasMes = 0;
    let saldoGlobal = 0;

    lancamentos.forEach(l => {
        const valor = parseFloat(l.valor) || 0;
        const tipo = (l.tipo || "").toLowerCase();
        const isReceita = tipo === 'recebimento' || tipo === 'receita';
        const isDespesa = tipo === 'gasto' || tipo === 'despesa';

        // Saldo Global Acumulado
        if (isReceita) saldoGlobal += valor;
        else if (isDespesa) saldoGlobal -= valor;

        // Filtro Mensal
        if (!l.data) return;
        const partes = l.data.split('/');
        if (partes.length < 3) return;
        const mesL = parseInt(partes[1]);
        const anoL = parseInt(partes[2]);

        if (mesL === mesAlvo && anoL === anoAlvo) {
            if (isReceita) receitasMes += valor;
            else if (isDespesa) despesasMes += valor;
        }
    });

    const elSaldo = document.getElementById('saldo-atual');
    const elReceitas = document.getElementById('receitas-mes');
    const elDespesas = document.getElementById('despesas-mes');

    if (elSaldo) elSaldo.textContent = formatarMoeda(saldoGlobal);
    if (elReceitas) elReceitas.textContent = formatarMoeda(receitasMes);
    if (elDespesas) elDespesas.textContent = formatarMoeda(despesasMes);
}

function processarDadosParaPizzas(lancamentos, mesAlvo, anoAlvo) {
    let totalDinheiro = 0;
    let totalCartao = 0;
    let categorias = {};

    lancamentos.forEach(l => {
        if (!l.data) return;
        const partes = l.data.split('/');
        if (partes.length < 3) return;
        if (parseInt(partes[1]) !== mesAlvo || parseInt(partes[2]) !== anoAlvo) return;

        const tipo = (l.tipo || "").toLowerCase();
        if (tipo === 'gasto' || tipo === 'despesa') {
            const valor = parseFloat(l.valor) || 0;
            const pag = (l.pagamento || "").toLowerCase();
            
            if (['pix', 'dinheiro', 'boleto', 'saldo em conta'].includes(pag)) {
                totalDinheiro += valor;
            } else {
                totalCartao += valor;
            }
            
            const cat = l.categoria || 'Outros';
            categorias[cat] = (categorias[cat] || 0) + valor;
        }
    });

    const canvasPgto = document.getElementById('paymentPieChart');
    const canvasCat = document.getElementById('categoryPieChart');
    if (!canvasPgto || !canvasCat) return;

    if (window.myPieChartPgto) window.myPieChartPgto.destroy();
    if (window.myPieChartCat) window.myPieChartCat.destroy();

    if (totalDinheiro === 0 && totalCartao === 0) {
        canvasPgto.style.display = 'none';
        canvasCat.style.display = 'none';
    } else {
        canvasPgto.style.display = 'block';
        canvasCat.style.display = 'block';
        
        window.myPieChartPgto = new Chart(canvasPgto.getContext('2d'), {
            type: 'doughnut',
            data: { labels: ['Dinheiro/PIX', 'Cartão'], datasets: [{ data: [totalDinheiro, totalCartao], backgroundColor: ['#10b981', '#8b5cf6'], borderWidth: 0 }] },
            options: { responsive: true, maintainAspectRatio: false, cutout: '75%', plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', font: { size: 11 } } } } }
        });

        const catLabels = Object.keys(categorias);
        const catValues = Object.values(categorias);
        window.myPieChartCat = new Chart(canvasCat.getContext('2d'), {
            type: 'doughnut',
            data: { labels: catLabels, datasets: [{ data: catValues, backgroundColor: ['#3b82f6', '#f59e0b', '#ef4444', '#10b981', '#8b5cf6', '#ec4899'], borderWidth: 0 }] },
            options: { responsive: true, maintainAspectRatio: false, cutout: '75%', plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', font: { size: 11 } } } } }
        });
    }
}

// ==========================================
// 3. CARREGAMENTO INICIAL
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
    if (!user) { window.location.href = '../index.html'; return; }

    // --- INICIALIZAÇÃO NO MÊS/ANO ATUAL ---
    const selMes = document.getElementById('filtro-mes');
    const selAno = document.getElementById('filtro-ano');
    const agora = new Date();
    if (selMes) selMes.value = agora.getMonth() + 1;
    if (selAno) {
        const anoAtual = agora.getFullYear();
        let existe = false;
        for (let i = 0; i < selAno.options.length; i++) {
            if (parseInt(selAno.options[i].value) === anoAtual) { existe = true; break; }
        }
        if (!existe) {
            const opt = new Option(anoAtual, anoAtual);
            selAno.add(opt);
        }
        selAno.value = anoAtual;
    }

    // Sidebar Info
    const elNome = document.getElementById('nome-cliente-sidebar');
    const elAvatar = document.getElementById('user-avatar');
    if (elNome) elNome.innerText = user.split('@')[0].toUpperCase();
    if (elAvatar) elAvatar.innerText = user.substring(0, 2).toUpperCase();

    // Carregar opções (Categorias, Pagamentos, Cartões)
    await Promise.all([
        carregarOpcoesCategorias(),
        carregarOpcoesPagamento()
    ]);

    // Carregar Dados Principais
    try {
        const [resLanc, resCartoes] = await Promise.all([
            fetch(`/api/lancamentos/${user}`),
            fetch(`/api/cartoes/${user}`)
        ]);

        console.log("=== DEBUG SISTEMA FINANCEIRO ===");
        console.log("Usuário logado:", user);
        console.log("Status API lancamentos:", resLanc.status);

        if (resLanc.ok) {
            const data = await resLanc.json();
            console.log("Resposta da API (status):", data.status);
            console.log("Total de lançamentos recebidos:", data.dados ? data.dados.length : 0);
            if (data.dados && data.dados.length > 0) {
                console.log("Primeiro lançamento:", data.dados[0]);
                console.log("Último lançamento:", data.dados[data.dados.length - 1]);
            } else {
                console.warn("ATENÇÃO: API retornou 0 lançamentos! Detalhes:", data);
            }
            listaGlobalLancamentos = data.dados || [];
            window.atualizarDashboard();
        } else {
            const errText = await resLanc.text();
            console.error("❌ API /lancamentos retornou erro:", resLanc.status, errText);
        }

        if (resCartoes.ok) {
            const data = await resCartoes.json();
            console.log("Cartões recebidos:", data.cartoes ? data.cartoes.length : 0);
            renderizarWidgetCartoes(data.cartoes);
        }

        // Gráfico de Evolução (Barras)
        await carregarDadosGrafico(new Date().getFullYear());

        // Verificar Assinatura e Mostrar Alerta se necessário
        await verificarVencimentoAssinatura();

    } catch (e) {
        console.error("Erro ao carregar dashboard:", e);
    }
});

// ==========================================
// 4. FUNÇÕES AUXILIARES (CARTÕES, GRÁFICOS, MODAL, VENCIMENTO)
async function verificarVencimentoAssinatura() {
    try {
        const resPerfil = await fetch(`/api/usuarios/perfil/${user}`);
        if (resPerfil.ok) {
            const dataUser = await resPerfil.json();
            if (dataUser.vencimento) {
                const dataVenc = new Date(dataUser.vencimento + 'T00:00:00');
                const hoje = new Date();
                hoje.setHours(0,0,0,0);
                
                const diffTime = dataVenc - hoje;
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                
                // Se faltar 5 dias ou menos, ou já estiver vencida
                if (diffDays <= 5) {
                    const mainContent = document.querySelector('.main-content');
                    if (mainContent) {
                        if (document.querySelector('.subscription-alert-banner')) return;

                        const alertDiv = document.createElement('div');
                        alertDiv.className = 'subscription-alert-banner';
                        
                        if (!document.getElementById('sub-alert-styles')) {
                            const styles = document.createElement('style');
                            styles.id = 'sub-alert-styles';
                            styles.innerHTML = `
                                .subscription-alert-banner {
                                    width: 100%;
                                    margin-bottom: 20px;
                                    font-family: inherit;
                                    font-size: 14px;
                                    animation: fadeInDown 0.3s ease-out;
                                }
                                .subscription-alert-banner .alert-content {
                                    display: flex;
                                    align-items: center;
                                    gap: 12px;
                                    padding: 14px 18px;
                                    border-radius: 12px;
                                    color: #ffffff;
                                    box-shadow: 0 4px 15px rgba(0,0,0,0.15);
                                }
                                .subscription-alert-banner .alert-content.warning {
                                    background: linear-gradient(135deg, #b45309 0%, #d97706 100%);
                                    border: 1px solid rgba(245, 158, 11, 0.4);
                                }
                                .subscription-alert-banner .alert-content.error {
                                    background: linear-gradient(135deg, #b91c1c 0%, #dc2626 100%);
                                    border: 1px solid rgba(239, 68, 68, 0.4);
                                }
                                .subscription-alert-banner .btn-renovar-banner {
                                    margin-left: auto;
                                    background-color: #ffffff;
                                    color: #1e293b;
                                    padding: 8px 16px;
                                    border-radius: 8px;
                                    font-weight: bold;
                                    text-decoration: none;
                                    transition: all 0.2s ease;
                                    white-space: nowrap;
                                    font-size: 13px;
                                    box-shadow: 0 2px 6px rgba(0,0,0,0.1);
                                }
                                .subscription-alert-banner .btn-renovar-banner:hover {
                                    background-color: #f1f5f9;
                                    transform: translateY(-1px);
                                }
                                @keyframes fadeInDown {
                                    from { opacity: 0; transform: translateY(-10px); }
                                    to { opacity: 1; transform: translateY(0); }
                                }
                                @media (max-width: 768px) {
                                    .subscription-alert-banner .alert-content {
                                        flex-direction: column;
                                        align-items: flex-start;
                                        gap: 10px;
                                    }
                                    .subscription-alert-banner .btn-renovar-banner {
                                        margin-left: 0;
                                        width: 100%;
                                        text-align: center;
                                    }
                                }
                            `;
                            document.head.appendChild(styles);
                        }
                        
                        const partes = dataUser.vencimento.split('-');
                        const dataVencBR = `${partes[2]}/${partes[1]}/${partes[0]}`;
                        
                        if (diffDays < 0) {
                            alertDiv.innerHTML = `
                                <div class="alert-content error">
                                    <span class="material-symbols-rounded" style="font-size: 24px;">gpp_maybe</span>
                                    <span><strong>Atenção! Sua assinatura premium venceu em ${dataVencBR}!</strong> Os seus serviços de gestão financeira podem ser suspensos a qualquer momento.</span>
                                    <a href="minha-assinatura.html" class="btn-renovar-banner">Renovar Acesso</a>
                                </div>
                            `;
                        } else {
                            alertDiv.innerHTML = `
                                <div class="alert-content warning">
                                    <span class="material-symbols-rounded" style="font-size: 24px;">warning</span>
                                    <span><strong>Sua assinatura premium está próxima do vencimento (${dataVencBR})!</strong> Faltam apenas ${diffDays} dia(s). Faça sua renovação para evitar interrupções.</span>
                                    <a href="minha-assinatura.html" class="btn-renovar-banner">Renovar Agora</a>
                                </div>
                            `;
                        }
                        
                        mainContent.insertBefore(alertDiv, mainContent.firstChild);
                    }
                }
            }
        }
    } catch (e) {
        console.error("Erro ao verificar vencimento da assinatura:", e);
    }
}

async function carregarOpcoesCategorias() {
    const sel = document.getElementById('catLancamento');
    if (!sel) return;
    try {
        const res = await fetch(`/api/categorias/${user}`);
        const data = await res.json();
        sel.innerHTML = '<option value="" disabled selected>Selecione...</option>';
        const padroes = ["Alimentação", "Moradia", "Transporte", "Saúde", "Lazer e Viagens", "Educação", "Salário", "Vestuário", "Investimentos", "Impostos / Taxas", "Cuidados Pessoais", "Outros"];
        padroes.forEach(p => sel.add(new Option(p, p)));
        if (data.status === 'sucesso' && data.dados.length > 0) {
            const opt = new Option("── MINHAS CATEGORIAS ──", "", false, false);
            opt.disabled = true; sel.add(opt);
            data.dados.forEach(c => sel.add(new Option(c.nome, c.nome)));
        }
    } catch (e) { console.error(e); }
}

async function carregarOpcoesPagamento() {
    const sel = document.getElementById('pagLancamento');
    if (!sel) return;
    try {
        const res = await fetch(`/api/formas-pagamento/${user}`);
        const data = await res.json();
        sel.innerHTML = '<option value="" disabled selected>Selecione...</option>';
        const padroes = ["PIX", "Dinheiro", "Parcelado", "Boleto", "Saldo em Conta", "Cartão de Crédito", "Cartão de Débito", "Transferência", "Outros"];
        padroes.forEach(p => sel.add(new Option(p, p)));

        const resC = await fetch(`/api/cartoes/${user}`);
        const dataC = await resC.json();
        if (dataC.status === 'sucesso' && dataC.cartoes.length > 0) {
            const opt = new Option("── SEUS CARTÕES ──", "", false, false);
            opt.disabled = true; sel.add(opt);
            dataC.cartoes.forEach(c => sel.add(new Option(`💳 ${c.nome}`, c.nome)));
        }

        if (data.status === 'sucesso' && data.dados.length > 0) {
            const opt = new Option("── MINHAS FORMAS ──", "", false, false);
            opt.disabled = true; sel.add(opt);
            data.dados.forEach(f => sel.add(new Option(f.nome, f.nome)));
        }
    } catch (e) { console.error(e); }
}

function renderizarWidgetCartoes(cartoes) {
    const container = document.getElementById('cards-widget-container');
    if (!container) return;
    container.innerHTML = '';
    if (!cartoes || cartoes.length === 0) {
        container.innerHTML = '<p class="no-cards-msg">Nenhum cartão registrado.</p>';
        return;
    }
    cartoes.forEach(card => {
        const percUso = card.limite > 0 ? (card.fatura_total / card.limite) * 100 : 0;
        container.innerHTML += `
            <div class="card-mini-stat">
                <div class="card-mini-top">
                    <div class="card-mini-name"><span class="material-symbols-rounded" style="color:${card.cor};">credit_card</span> ${card.nome}</div>
                    <h3 class="card-mini-fatura">${formatarMoeda(card.fatura_total)}</h3>
                </div>
                <div class="card-mini-details">
                    <p><span class="limit-label">Disponível:</span> ${formatarMoeda(card.limite - card.fatura_total)}</p>
                </div>
                <div class="progress-mini-bar"><div class="progress-fill" style="width:${percUso}%; background-color:${card.cor};"></div></div>
            </div>
        `;
    });
}

let instanceFinanceChart = null;
async function carregarDadosGrafico(ano) {
    try {
        const res = await fetch(`/api/chart-data/${user}?year=${ano}`);
        if (res.ok) {
            const dados = await res.json();
            const ctx = document.getElementById('financeChart').getContext('2d');
            if (instanceFinanceChart) instanceFinanceChart.destroy();
            instanceFinanceChart = new Chart(ctx, {
                type: 'bar',
                data: { labels: dados.labels, datasets: [{ label: 'Receitas', data: dados.receitas, backgroundColor: '#ffffff', borderRadius: 4 }, { label: 'Despesas', data: dados.despesas, backgroundColor: '#52525b', borderRadius: 4 }] },
                options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } }, x: { grid: { display: false }, ticks: { color: '#94a3b8' } } }, plugins: { legend: { labels: { color: '#f8fafc' } } } }
            });
        }
    } catch (e) { console.error(e); }
}

// ==========================================
// 5. NAVEGAÇÃO E MODAL
// ==========================================
function alterarMes(direcao) {
    const elMes = document.getElementById('filtro-mes');
    const elAno = document.getElementById('filtro-ano');
    if (!elMes || !elAno) return;

    let m = parseInt(elMes.value); 
    let y = parseInt(elAno.value);
    
    m += direcao;
    
    if (m > 12) { m = 1; y++; } 
    else if (m < 1) { m = 12; y--; }

    // Garante que o ano exista no seletor
    let existe = false;
    for(let i=0; i<elAno.options.length; i++) {
        if(parseInt(elAno.options[i].value) === y) { existe = true; break; }
    }
    if(!existe) {
        const opt = new Option(y, y);
        elAno.add(opt);
    }

    elMes.value = m; 
    elAno.value = y;
    window.atualizarDashboard();
}

function toggleMonthPicker() {
    const modal = document.getElementById('monthPickerModal');
    if (!modal) return;
    modal.classList.toggle('show');
    if (modal.classList.contains('show')) modal.style.display = 'flex';
    else setTimeout(() => modal.style.display = 'none', 300);
}

function mudarAnoPicker(direcao) {
    const elPickerAno = document.getElementById('picker-ano-atual');
    const elAno = document.getElementById('filtro-ano');
    let ano = parseInt(elPickerAno.innerText) + direcao;
    elPickerAno.innerText = ano; elAno.value = ano;
    window.atualizarDashboard();
}

function selecionarMesPicker(mes) {
    document.getElementById('filtro-mes').value = mes;
    window.atualizarDashboard();
    toggleMonthPicker();
}

function abrirPainelTransacao(modo) {
    const painel = document.getElementById('painelTransacao');
    const overlay = document.getElementById('overlayPainel');
    if (modo === 'nova') {
        document.getElementById('formLancamento').reset();
        document.getElementById('idTransacaoEditar').value = '';
        document.getElementById('dataLancamento').valueAsDate = new Date();
    }
    painel.classList.add('aberto');
    overlay.style.display = 'block';
    setTimeout(() => overlay.classList.add('aberto'), 10);
}

function fecharPainelTransacao() {
    document.getElementById('painelTransacao').classList.remove('aberto');
    document.getElementById('overlayPainel').classList.remove('aberto');
    setTimeout(() => document.getElementById('overlayPainel').style.display = 'none', 300);
}

const formL = document.getElementById('formLancamento');
if (formL) {
    formL.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('btn-salvar-transacao');
        const original = btn.innerText; btn.innerText = "Salvando..."; btn.disabled = true;
        const payload = {
            username: user, tipo: document.getElementById('tipoLancamento').value,
            descricao: document.getElementById('descLancamento').value,
            valor: parseFloat(document.getElementById('valorLancamento').value),
            data: document.getElementById('dataLancamento').value,
            categoria: document.getElementById('catLancamento').value,
            pagamento: document.getElementById('pagLancamento').value,
            repetir: "nao", quantidade: 1,
            status: document.getElementById('statusLancamento').value
        };
        try {
            const res = await fetch('/api/lancamentos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            if (res.ok) { alert("Transação salva!"); window.location.reload(); }
        } catch (err) { console.error(err); }
        finally { btn.innerText = original; btn.disabled = false; }
    });
}

async function carregarMetasDashboard(lancamentos, mesAlvo, anoAlvo) {
    const container = document.getElementById('dashboard-metas-container');
    if (!container) return;

    try {
        const res = await fetch(`/api/metas/${user}`);
        const metas = await res.json();

        if (!metas || metas.length === 0) {
            container.innerHTML = '<p class="no-cards-msg" style="color: #71717a; text-align: center; padding: 20px;">Nenhuma meta de gastos definida.</p>';
            return;
        }

        container.innerHTML = '';
        const mesCorrente = new Date().getMonth() + 1;
        const anoCorrente = new Date().getFullYear();

        metas.forEach(meta => {
            const isPeriodo = (meta.tipo_periodo || 'mes') === 'periodo';
            const mAlvo = isPeriodo ? mesAlvo : mesCorrente;
            const aAlvo = isPeriodo ? anoAlvo : anoCorrente;

            const gastoAtual = lancamentos.filter(l => {
                const tipo = (l.tipo || "").toLowerCase();
                const isDespesa = tipo === 'gasto' || tipo === 'despesa';
                if (!isDespesa || l.categoria !== meta.categoria || !l.data) return false;
                const partes = l.data.split('/');
                if (partes.length < 3) return false;
                return parseInt(partes[1]) === mAlvo && parseInt(partes[2]) === aAlvo;
            }).reduce((acc, curr) => acc + parseFloat(curr.valor || 0), 0);

            const porcentagem = (gastoAtual / meta.limite) * 100;
            let statusClass = 'fill-good';
            if (porcentagem > 75) statusClass = 'fill-warning';
            if (porcentagem > 100) statusClass = 'fill-danger';

            const barraLargura = Math.min(porcentagem, 100);

            container.innerHTML += `
                <div style="background: rgba(255,255,255,0.02); padding: 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.05); margin-bottom: 10px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 6px; align-items: center;">
                        <span style="font-weight: 600; font-size: 13px; color: #ffffff;">${meta.categoria}</span>
                        <span style="font-size: 10px; color: #a1a1aa; font-weight: 600; background: rgba(255,255,255,0.05); padding: 2px 6px; border-radius: 4px;">
                            ${isPeriodo ? 'Per\u00edodo' : 'Fixo'}
                        </span>
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 8px; color: #a1a1aa;">
                        <span>Gasto: ${formatarMoeda(gastoAtual)}</span>
                        <span>Meta: ${formatarMoeda(meta.limite)}</span>
                    </div>
                    <div class="progress-track" style="background: rgba(255,255,255,0.05); height: 6px; border-radius: 4px; overflow: hidden; width: 100%;">
                        <div class="progress-fill ${statusClass}" style="width: ${barraLargura}%; height: 100%; border-radius: 4px; transition: width 0.5s ease;"></div>
                    </div>
                    ${porcentagem > 100 ? `<div style="color: #ef4444; font-size: 10px; margin-top: 5px; font-weight: 600; text-align: right;">\u26a0\ufe0f Or\u00e7amento estourado!</div>` : ''}
                </div>
            `;
        });
    } catch (e) {
        console.error("Erro ao processar metas no dashboard:", e);
        container.innerHTML = '<p class="no-cards-msg" style="color: #ef4444;">Erro ao carregar metas.</p>';
    }
}
