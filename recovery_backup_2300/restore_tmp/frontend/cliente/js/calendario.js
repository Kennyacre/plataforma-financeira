// cliente/js/calendario.js
const user = localStorage.getItem('usuarioLogado');
let dataAtual = new Date();
let lancamentosCalendario = [];

document.addEventListener('DOMContentLoaded', async () => {
    // Inicializa sidebar (usando setupSidebar do security.js)
    if (typeof setupSidebar === 'function') setupSidebar();

    // Info do usuário
    const elNome = document.getElementById('nome-cliente-sidebar');
    const elAvatar = document.getElementById('user-avatar');
    if (elNome) elNome.innerText = user.split('@')[0].toUpperCase();
    if (elAvatar) elAvatar.innerText = user.substring(0, 2).toUpperCase();

    await carregarDadosCalendario();
});

async function carregarDadosCalendario() {
    try {
        const res = await fetch(`/api/lancamentos/${user}`);
        const data = await res.json();
        lancamentosCalendario = data.dados || [];
        renderizarCalendario();
    } catch (e) { console.error("Erro ao carregar dados do calendário", e); }
}

function renderizarCalendario() {
    const mes = dataAtual.getMonth();
    const ano = dataAtual.getFullYear();

    const nomesMeses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    document.getElementById('mes-ano-titulo').innerText = `${nomesMeses[mes]} ${ano}`;

    const primeiroDiaMes = new Date(ano, mes, 1).getDay();
    const ultimoDiaMes = new Date(ano, mes + 1, 0).getDate();

    const body = document.getElementById('calendar-body');
    body.innerHTML = '';

    for (let i = 0; i < primeiroDiaMes; i++) {
        body.innerHTML += `<div class="day-cell empty"></div>`;
    }

    const hoje = new Date();
    for (let dia = 1; dia <= ultimoDiaMes; dia++) {
        const dataFormatada = `${dia.toString().padStart(2, '0')}/${(mes + 1).toString().padStart(2, '0')}/${ano}`;
        const lancsDoDia = lancamentosCalendario.filter(l => l.data === dataFormatada);

        let totalReceita = 0;
        let totalDespesa = 0;
        let eventosHtml = '';

        let temReceita = false;
        let temDespesa = false;
        lancsDoDia.forEach(lanc => {
            if (lanc.tipo === 'recebimento') temReceita = true;
            else temDespesa = true;
        });

        if (temReceita || temDespesa) {
            eventosHtml = `<div class="dots-container" style="display: flex; gap: 4px; justify-content: center; margin-top: 8px;">`;
            if (temReceita) eventosHtml += `<span style="width: 8px; height: 8px; background-color: #10b981; border-radius: 50%;"></span>`;
            if (temDespesa) eventosHtml += `<span style="width: 8px; height: 8px; background-color: #ef4444; border-radius: 50%;"></span>`;
            eventosHtml += `</div>`;
        }

        // Recalcular totais reais (não apenas dos 3 primeiros)
        totalReceita = 0; totalDespesa = 0;
        lancsDoDia.forEach(l => {
            if (l.tipo === 'recebimento') totalReceita += parseFloat(l.valor);
            else totalDespesa += parseFloat(l.valor);
        });

        const isHoje = hoje.getDate() === dia && hoje.getMonth() === mes && hoje.getFullYear() === ano;

        body.innerHTML += `
            <div class="day-cell ${isHoje ? 'today' : ''}" onclick="abrirDetalhesDia('${dataFormatada}')">
                <div class="day-header">
                    <span class="day-number">${dia}</span>
                    ${isHoje ? '<span class="today-tag">Hoje</span>' : ''}
                </div>
                <div class="event-container">
                    ${eventosHtml}
                </div>
                ${(totalReceita > 0 || totalDespesa > 0) ? `
                    <div class="day-footer">
                        ${totalReceita > 0 ? `<span class="val-pos">↑ ${formatarMoedaCurta(totalReceita)}</span>` : ''}
                        ${totalDespesa > 0 ? `<span class="val-neg">↓ ${formatarMoedaCurta(totalDespesa)}</span>` : ''}
                    </div>
                ` : ''}
            </div>
        `;
    }
}

function abrirDetalhesDia(dataBuscada) {
    const lancs = lancamentosCalendario.filter(l => l.data === dataBuscada);
    const painel = document.getElementById('painelDetalhes');
    const overlay = document.getElementById('overlayPainel');

    document.getElementById('data-detalhes-dia').innerText = dataBuscada;

    let totalR = 0; let totalD = 0;
    const lista = document.getElementById('lista-transacoes-dia');
    lista.innerHTML = '';

    if (lancs.length === 0) {
        lista.innerHTML = '<p style="color:#94a3b8; text-align:center; margin-top:50px;">Não há contas ou transações neste dia.</p>';
    } else {
        lancs.forEach(l => {
            const isR = l.tipo === 'recebimento';
            if (isR) totalR += parseFloat(l.valor); else totalD += parseFloat(l.valor);

            lista.innerHTML += `
                <div class="transacao-dia-item ${isR ? 'receita' : 'despesa'}">
                    <div class="t-info">
                        <span class="t-desc">${l.descricao}</span>
                        <span class="t-cat">${l.categoria}</span>
                    </div>
                    <span class="t-valor ${isR ? 'val-pos' : 'val-neg'}">
                        ${isR ? '+' : '-'} ${formatarMoeda(l.valor)}
                    </span>
                </div>
            `;
        });
    }

    document.getElementById('resumo-receita-dia').innerText = formatarMoeda(totalR);
    document.getElementById('resumo-despesa-dia').innerText = formatarMoeda(totalD);

    painel.classList.add('aberto');
    overlay.classList.add('aberto');
}

function fecharDetalhesDia() {
    document.getElementById('painelDetalhes').classList.remove('aberto');
    document.getElementById('overlayPainel').classList.remove('aberto');
}

function formatarMoeda(valor) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
}

function formatarMoedaCurta(valor) {
    return new Intl.NumberFormat('pt-BR', { notation: "compact", maximumFractionDigits: 1 }).format(valor);
}

function mudarMes(direcao) {
    dataAtual.setMonth(dataAtual.getMonth() + direcao);
    renderizarCalendario();
}