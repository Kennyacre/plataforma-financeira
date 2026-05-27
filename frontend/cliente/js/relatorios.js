// cliente/js/relatorios.js
const user = localStorage.getItem('usuarioLogado');

let listaGlobalLancamentos = [];
let mesSelecionado = new Date().getMonth() + 1;
let anoSelecionado = new Date().getFullYear();

const nomesMeses = ["Janeiro", "Fevereiro", "Mar\u00e7o", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
};

document.addEventListener('DOMContentLoaded', async () => {
    if (!user) { window.location.href = '../index.html'; return; }

    // Atualizar cabe??alho e sidebar
    const elNome = document.getElementById('nome-cliente-sidebar');
    const elAvatar = document.getElementById('user-avatar');
    if (elNome) elNome.innerText = user.toUpperCase();
    if (elAvatar) elAvatar.innerText = user.substring(0, 2).toUpperCase();

    // Carregar filtros din??micos
    await Promise.all([
        carregarFiltroCategorias(),
        carregarFiltroPagamentos()
    ]);

    // Buscar lan??amentos e atualizar relat??rios
    await buscarLancamentos();
});

async function buscarLancamentos() {
    try {
        const res = await fetch(`/api/lancamentos/${user}`);
        const data = await res.json();
        listaGlobalLancamentos = data.dados || [];
        atualizarRelatorios();
    } catch (e) {
        console.error("Erro ao buscar lancamentos:", e);
    }
}

async function carregarFiltroCategorias() {
    const select = document.getElementById('filtro-categoria');
    if (!select) return;
    try {
        const res = await fetch(`/api/categorias/${user}`);
        const data = await res.json();

        select.innerHTML = '<option value="">Todas as Categorias</option>';
        const padroes = ["Alimenta????o", "Moradia", "Transporte", "Sa??de", "Lazer e Viagens", "Educa????o", "Sal??rio", "Vestu??rio", "Investimentos", "Impostos / Taxas", "Cuidados Pessoais", "Outros"];
        
        padroes.forEach(p => {
            const opt = new Option(p, p);
            select.add(opt);
        });

        if (data.status === 'sucesso' && data.dados.length > 0) {
            const optGroup = new Option("?????? MINHAS CATEGORIAS ??????", "", false, false);
            optGroup.disabled = true;
            select.add(optGroup);

            data.dados.forEach(cat => {
                select.add(new Option(cat.nome, cat.nome));
            });
        }
    } catch (e) {
        console.error("Erro ao carregar categorias:", e);
    }
}

async function carregarFiltroPagamentos() {
    const select = document.getElementById('filtro-pagamento');
    if (!select) return;
    try {
        const res = await fetch(`/api/formas-pagamento/${user}`);
        const data = await res.json();

        select.innerHTML = '<option value="">Todas as Formas</option>';
        const padroes = ["PIX", "Dinheiro", "Parcelado", "Boleto", "Saldo em Conta", "Cart??o de Cr??dito", "Cart??o de D??bito", "Transfer??ncia", "Outros"];
        
        padroes.forEach(p => {
            select.add(new Option(p, p));
        });

        const resC = await fetch(`/api/cartoes/${user}`);
        const dataC = await resC.json();
        if (dataC.status === 'sucesso' && dataC.cartoes.length > 0) {
            const optGroup = new Option("?????? SEUS CART??ES ??????", "", false, false);
            optGroup.disabled = true;
            select.add(optGroup);

            dataC.cartoes.forEach(cartao => {
                select.add(new Option(`???? ${cartao.nome}`, cartao.nome));
            });
        }

        if (data.status === 'sucesso' && data.dados.length > 0) {
            const optGroup = new Option("?????? MINHAS FORMAS ??????", "", false, false);
            optGroup.disabled = true;
            select.add(optGroup);

            data.dados.forEach(forma => {
                select.add(new Option(forma.nome, forma.nome));
            });
        }
    } catch (e) {
        console.error("Erro ao carregar formas de pagamento:", e);
    }
}

window.alterarMes = async (dir) => {
    mesSelecionado += dir;
    if (mesSelecionado < 1) { mesSelecionado = 12; anoSelecionado--; }
    else if (mesSelecionado > 12) { mesSelecionado = 1; anoSelecionado++; }
    atualizarRelatorios();
};

window.toggleMonthPicker = () => {
    const el = document.getElementById('monthPickerModal');
    if (el) el.classList.toggle('active');
};

window.mudarAnoPicker = (dir) => {
    const el = document.getElementById('picker-ano-atual');
    let ano = parseInt(el.innerText) + dir;
    el.innerText = ano;
};

window.selecionarMesPicker = (mes) => {
    const elAno = document.getElementById('picker-ano-atual');
    anoSelecionado = parseInt(elAno.innerText);
    mesSelecionado = mes;
    toggleMonthPicker();
    atualizarRelatorios();
};

window.aplicarFiltrosRelatorios = () => {
    atualizarRelatorios();
};

function atualizarRelatorios() {
    // 1. Atualizar textos de data
    const periodoTexto = `${nomesMeses[mesSelecionado - 1]} ${anoSelecionado}`;
    const elTextoPeriodo = document.getElementById('texto-periodo');
    const elPeriodoSelen = document.getElementById('periodo-selecionado');
    const elPickerAno = document.getElementById('picker-ano-atual');

    if (elTextoPeriodo) elTextoPeriodo.innerText = periodoTexto;
    if (elPeriodoSelen) elPeriodoSelen.innerText = periodoTexto.replace(' ', '/');
    if (elPickerAno) elPickerAno.innerText = anoSelecionado;

    // Marcar m??s no calend??rio modal
    document.querySelectorAll('.month-item').forEach((item, idx) => {
        if (idx + 1 === mesSelecionado) item.classList.add('current');
        else item.classList.remove('current');
    });

    // 2. Aplicar filtragem de transa????es para o m??s selecionado
    const filtroCat = document.getElementById('filtro-categoria')?.value || "";
    const filtroPag = document.getElementById('filtro-pagamento')?.value || "";

    const lancamentosMes = listaGlobalLancamentos.filter(l => {
        if (!l.data) return false;
        const partes = l.data.split('/');
        if (partes.length < 3) return false;
        const m = parseInt(partes[1]);
        const a = parseInt(partes[2]);
        if (m !== mesSelecionado || a !== anoSelecionado) return false;

        // Filtro Categoria
        if (filtroCat !== "" && l.categoria !== filtroCat) return false;
        // Filtro Pagamento
        if (filtroPag !== "" && l.pagamento !== filtroPag) return false;

        return true;
    });

    // 3. Renderizar listas de Despesas e Receitas
    const listaReceitas = document.getElementById('lista-receitas');
    const listaDespesas = document.getElementById('lista-despesas');
    const elTotalReceitas = document.getElementById('total-receitas-relatorio');
    const elTotalDespesas = document.getElementById('total-despesas-relatorio');

    let totalReceitas = 0;
    let totalDespesas = 0;

    const receitas = lancamentosMes.filter(l => (l.tipo || "").toLowerCase() === 'receita' || (l.tipo || "").toLowerCase() === 'recebimento');
    const despesas = lancamentosMes.filter(l => (l.tipo || "").toLowerCase() === 'gasto' || (l.tipo || "").toLowerCase() === 'despesa');

    if (receitas.length === 0) {
        listaReceitas.innerHTML = '<p class="no-data-msg">Nenhum recebimento encontrado.</p>';
    } else {
        listaReceitas.innerHTML = receitas.map(r => {
            totalReceitas += parseFloat(r.valor || 0);
            return `
                <div class="report-item">
                    <div class="item-main">
                        <span class="item-desc">${r.descricao}</span>
                        <div class="item-meta">
                            <span>???? ${r.data}</span>
                            <span>??????? ${r.categoria}</span>
                            <span>???? ${r.pagamento}</span>
                        </div>
                    </div>
                    <span class="item-val pos">+ ${formatarMoeda(r.valor)}</span>
                </div>
            `;
        }).join('');
    }

    if (despesas.length === 0) {
        listaDespesas.innerHTML = '<p class="no-data-msg">Nenhum gasto encontrado.</p>';
    } else {
        listaDespesas.innerHTML = despesas.map(d => {
            totalDespesas += parseFloat(d.valor || 0);
            return `
                <div class="report-item">
                    <div class="item-main">
                        <span class="item-desc">${d.descricao}</span>
                        <div class="item-meta">
                            <span>???? ${d.data}</span>
                            <span>??????? ${d.categoria}</span>
                            <span>???? ${d.pagamento}</span>
                        </div>
                    </div>
                    <span class="item-val neg">- ${formatarMoeda(d.valor)}</span>
                </div>
            `;
        }).join('');
    }

    if (elTotalReceitas) elTotalReceitas.innerText = formatarMoeda(totalReceitas);
    if (elTotalDespesas) elTotalDespesas.innerText = formatarMoeda(totalDespesas);

    // 4. Computar Comparativo de Categorias (M??s Atual vs M??s Anterior)
    atualizarComparativos(filtroCat, filtroPag);
}

function atualizarComparativos(filtroCat, filtroPag) {
    const container = document.getElementById('comparativo-categorias-container');
    if (!container) return;

    // Calcular m??s anterior
    let mesAnterior = mesSelecionado - 1;
    let anoAnterior = anoSelecionado;
    if (mesAnterior < 1) { mesAnterior = 12; anoAnterior--; }

    // Filtrar despesas do m??s anterior
    const despesasMesAnterior = listaGlobalLancamentos.filter(l => {
        const tipo = (l.tipo || "").toLowerCase();
        const isDespesa = tipo === 'gasto' || tipo === 'despesa';
        if (!isDespesa || !l.data) return false;
        const partes = l.data.split('/');
        if (partes.length < 3) return false;
        const m = parseInt(partes[1]);
        const a = parseInt(partes[2]);
        if (m !== mesAnterior || a !== anoAnterior) return false;
        if (filtroCat !== "" && l.categoria !== filtroCat) return false;
        if (filtroPag !== "" && l.pagamento !== filtroPag) return false;
        return true;
    });

    // Filtrar despesas do m??s atual
    const despesasMesAtual = listaGlobalLancamentos.filter(l => {
        const tipo = (l.tipo || "").toLowerCase();
        const isDespesa = tipo === 'gasto' || tipo === 'despesa';
        if (!isDespesa || !l.data) return false;
        const partes = l.data.split('/');
        if (partes.length < 3) return false;
        const m = parseInt(partes[1]);
        const a = parseInt(partes[2]);
        if (m !== mesSelecionado || a !== anoSelecionado) return false;
        if (filtroCat !== "" && l.categoria !== filtroCat) return false;
        if (filtroPag !== "" && l.pagamento !== filtroPag) return false;
        return true;
    });

    // Agrupar por categorias
    const categoriasSet = new Set();
    const somaAnterior = {};
    const somaAtual = {};

    despesasMesAnterior.forEach(d => {
        categoriasSet.add(d.categoria);
        somaAnterior[d.categoria] = (somaAnterior[d.categoria] || 0) + parseFloat(d.valor || 0);
    });

    despesasMesAtual.forEach(d => {
        categoriasSet.add(d.categoria);
        somaAtual[d.categoria] = (somaAtual[d.categoria] || 0) + parseFloat(d.valor || 0);
    });

    const listaCategorias = Array.from(categoriasSet).sort();

    if (listaCategorias.length === 0) {
        container.innerHTML = '<p class="no-data-msg">Nenhum dado comparativo para despesas nesta sele????o.</p>';
        return;
    }

    container.innerHTML = listaCategorias.map(cat => {
        const valAnterior = somaAnterior[cat] || 0;
        const valAtual = somaAtual[cat] || 0;
        
        let deltaHtml = '';
        if (valAnterior === 0 && valAtual === 0) {
            deltaHtml = '<span class="badge-delta equal">Sem Gastos</span>';
        } else if (valAnterior === 0) {
            deltaHtml = '<span class="badge-delta up">\u21e7 Novo Gasto</span>';
        } else {
            const diffPct = ((valAtual - valAnterior) / valAnterior) * 100;
            if (diffPct < 0) {
                deltaHtml = `<span class="badge-delta down">\u21e9 ${Math.abs(diffPct).toFixed(1)}% Economia</span>`;
            } else if (diffPct > 0) {
                deltaHtml = `<span class="badge-delta up">\u21e7 ${diffPct.toFixed(1)}% Aumento</span>`;
            } else {
                deltaHtml = '<span class="badge-delta equal">Igual</span>';
            }
        }

        return `
            <div class="comp-item-row">
                <span style="font-weight: 600; color: #ffffff;">${cat}</span>
                <span style="text-align: right; color: #a1a1aa;">${formatarMoeda(valAnterior)}</span>
                <span style="text-align: right; color: #ffffff; font-weight: 600;">${formatarMoeda(valAtual)}</span>
                <div style="display: flex; justify-content: flex-end; padding-right: 12px;">
                    ${deltaHtml}
                </div>
            </div>
        `;
    }).join('');
}

