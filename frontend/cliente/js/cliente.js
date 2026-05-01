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

    } catch (e) {
        console.error("Erro ao carregar dashboard:", e);
    }
});

// ==========================================
// 4. FUNÇÕES AUXILIARES (CARTÕES, GRÁFICOS, MODAL)
// ==========================================
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
        const padroes = ["PIX", "Dinheiro", "Boleto", "Saldo em Conta", "Cartão de Crédito", "Cartão de Débito", "Transferência", "Outros"];
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
        const percUso = card.limite > 0 ? (card.fatura / card.limite) * 100 : 0;
        container.innerHTML += `
            <div class="card-mini-stat">
                <div class="card-mini-top">
                    <div class="card-mini-name"><span class="material-symbols-rounded" style="color:${card.cor};">credit_card</span> ${card.nome}</div>
                    <h3 class="card-mini-fatura">${formatarMoeda(card.fatura)}</h3>
                </div>
                <div class="card-mini-details">
                    <p><span class="limit-label">Disponível:</span> ${formatarMoeda(card.limite - card.fatura)}</p>
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
    let m = parseInt(elMes.value); let y = parseInt(elAno.value);
    m += direcao;
    if (m > 12) { m = 1; y++; } else if (m < 1) { m = 12; y--; }
    elMes.value = m; elAno.value = y;
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