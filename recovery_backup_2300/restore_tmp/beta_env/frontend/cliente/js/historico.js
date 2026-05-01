const user = localStorage.getItem('usuarioLogado');
let listaGlobalDeLancamentos = [];

const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
};

document.addEventListener('DOMContentLoaded', async () => {
    if (!user) { window.location.href = '../index.html'; return; }

    const elNome = document.getElementById('nome-cliente-sidebar');
    const elAvatar = document.getElementById('user-avatar');
    if (elNome) elNome.innerText = user.split('@')[0].toUpperCase();
    if (elAvatar) elAvatar.innerText = user.substring(0, 2).toUpperCase();

    if (typeof inicializarSidebar === 'function') inicializarSidebar();

    await carregarHistorico();

    // Carregar opções dos selectors (Categorias e Pagamentos)
    await Promise.all([
        carregarOpcoesCategorias(),
        carregarOpcoesPagamento()
    ]);

    const buscaDesc = document.getElementById('busca-desc');
    const btnFiltrar = document.getElementById('btn-filtrar');

    // Mantemos a busca por descrição em tempo real por ser intuitivo
    if (buscaDesc) buscaDesc.addEventListener('input', aplicarFiltros);

    // Filtros de seleção agora são aplicados ao clicar no botão
    if (btnFiltrar) btnFiltrar.addEventListener('click', (e) => {
        e.preventDefault();
        aplicarFiltros();
    });
});

async function carregarHistorico() {
    try {
        const response = await fetch(`/api/lancamentos/${user}`);
        if (response.ok) {
            const data = await response.json();
            listaGlobalDeLancamentos = data.dados || [];

            listaGlobalDeLancamentos.sort((a, b) => {
                try {
                    const [dA, mA, yA] = a.data.split('/');
                    const [dB, mB, yB] = b.data.split('/');
                    return new Date(yB, mB - 1, dB) - new Date(yA, mA - 1, dA);
                } catch (e) { return 0; }
            });

            aplicarFiltros();
        } else {
            desenharTabela([]);
        }
    } catch (error) {
        console.error("Erro ao carregar histórico:", error);
        desenharTabela([]);
    }
}

function aplicarFiltros() {
    const termoBusca = document.getElementById('busca-desc').value.toLowerCase();
    const tipoFiltro = document.getElementById('filtro-tipo').value;
    const mesFiltro = document.getElementById('filtro-mes').value;
    const anoFiltro = document.getElementById('filtro-ano').value;

    const dadosFiltrados = listaGlobalDeLancamentos.filter(lanc => {
        const desc = lanc.descricao ? String(lanc.descricao).toLowerCase() : "";
        const bateuDescricao = desc.includes(termoBusca);
        const bateuTipo = tipoFiltro === 'todos' || lanc.tipo === tipoFiltro;

        // Filtro de Período
        let bateuPeriodo = true;
        if (mesFiltro !== 'todos' || anoFiltro !== 'todos') {
            if (!lanc.data) {
                bateuPeriodo = false;
            } else {
                const partesData = lanc.data.split('/');
                if (partesData.length < 3) {
                    bateuPeriodo = false;
                } else {
                    const mesLanc = parseInt(partesData[1]);
                    const anoLanc = parseInt(partesData[2]);

                    const bateuMes = mesFiltro === 'todos' || mesLanc === parseInt(mesFiltro);
                    const bateuAno = anoFiltro === 'todos' || anoLanc === parseInt(anoFiltro);

                    bateuPeriodo = bateuMes && bateuAno;
                }
            }
        }

        return bateuDescricao && bateuTipo && bateuPeriodo;
    });

    desenharTabela(dadosFiltrados);
}

function desenharTabela(dados) {
    const tbody = document.getElementById('tabela-corpo');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (dados.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8"><div class="empty-state"><h3>Nenhuma transação encontrada</h3></div></td></tr>`;
        return;
    }

    dados.forEach((lanc) => {
        const isReceita = lanc.tipo === 'recebimento';
        const badgeHtml = isReceita ? `<span class="badge success">Receita</span>` : `<span class="badge danger">Despesa</span>`;
        const classeValor = isReceita ? 'valor-positivo' : 'valor-negativo';
        const sinal = isReceita ? '+ ' : '- ';
        
        // Badge de Status
        const isPago = (lanc.status || 'pago') === 'pago';
        const statusHtml = isPago 
            ? `<span class="badge success" style="background: rgba(255, 255, 255, 0.1); color: #ffffff;">Pago</span>`
            : `<span class="badge warning" style="background: rgba(255, 255, 255, 0.05); color: #cccccc;">Pendente</span>`;

        const btnConfirmar = !isPago ? `
            <button class="btn-confirmar" title="Confirmar Pagamento" onclick="confirmarPagamento(${lanc.id})" style="background: rgba(255, 255, 255, 0.1); color: #ffffff; border: 1px solid rgba(255, 255, 255, 0.2); padding: 5px; border-radius: 8px; cursor: pointer; margin-right: 5px;">
                <span class="material-symbols-rounded" style="font-size: 18px;">check_circle</span>
            </button>
        ` : '';

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${lanc.data || '-'}</td>
            <td style="font-weight: 600;">${lanc.descricao || '-'}</td>
            <td><span class="badge neutral">${lanc.categoria || '-'}</span></td>
            <td>${lanc.pagamento || '-'}</td>
            <td>${badgeHtml}</td>
            <td class="${classeValor}">${sinal}${formatarMoeda(lanc.valor || 0)}</td>
            <td>${statusHtml}</td>
            <td style="text-align: center; white-space: nowrap;">
                ${btnConfirmar}
                <button class="btn-editar" title="Editar" onclick="abrirPainelEdicao(${lanc.id}, '${lanc.tipo}', '${lanc.descricao}', ${lanc.valor}, '${lanc.data}', '${lanc.categoria}', '${lanc.pagamento}', '${lanc.status || 'pago'}')">
                    <span class="material-symbols-rounded" style="font-size: 18px;">edit</span>
                </button>
                <button class="btn-action" title="Excluir" onclick="deletarLancamento(${lanc.id})">
                    <span class="material-symbols-rounded" style="font-size: 18px;">delete</span>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

async function confirmarPagamento(id) {
    if (!confirm("Confirmar que esta conta foi paga/recebida?")) return;
    try {
        const response = await fetch(`/api/confirmar-pagamento/${id}`, { method: 'PUT' });
        if (response.ok) {
            alert("Pagamento confirmado com sucesso!");
            await carregarHistorico();
        }
    } catch (error) { console.error("Erro na confirmação:", error); }
}

async function deletarLancamento(id) {
    if (!confirm("Tem a certeza que deseja excluir esta transação?")) return;
    try {
        const response = await fetch(`/api/lancamentos/${id}`, { method: 'DELETE' });
        if (response.ok) await carregarHistorico();
    } catch (error) { console.error("Erro na exclusão:", error); }
}

// === INFRAESTRUTURA DE SELECTORS DINÂMICOS ===
async function carregarOpcoesCategorias() {
    const sel = document.getElementById('catLancamento');
    try {
        const res = await fetch(`/api/categorias/${user}`);
        const data = await res.json();
        sel.innerHTML = '<option value="" disabled selected>Selecione...</option>';
        const padroes = ["Alimentação", "Moradia", "Transporte", "Saúde", "Lazer e Viagens", "Educação", "Salário", "Vestuário", "Investimentos", "Impostos / Taxas", "Cuidados Pessoais", "Outros"];
        padroes.forEach(p => sel.add(new Option(p, p)));
        if (data.status === 'sucesso' && data.dados.length > 0) {
            const opt = new Option("── MINHAS CATEGORIAS ──", "", false, false);
            opt.disabled = true;
            sel.add(opt);
            data.dados.forEach(c => sel.add(new Option(c.nome, c.nome)));
        }
    } catch (e) { console.error(e); }
}

async function carregarOpcoesPagamento() {
    const sel = document.getElementById('pagLancamento');
    try {
        const res = await fetch(`/api/formas-pagamento/${user}`);
        const data = await res.json();
        sel.innerHTML = '<option value="" disabled selected>Selecione...</option>';
        const padroes = ["PIX", "Dinheiro", "Boleto", "Saldo em Conta", "Cartão de Crédito", "Cartão de Débito", "Transferência", "Outros"];
        padroes.forEach(p => sel.add(new Option(p, p)));

        // Buscar Cartões também
        const resC = await fetch(`/api/cartoes/${user}`);
        const dataC = await resC.json();
        if (dataC.status === 'sucesso' && dataC.cartoes.length > 0) {
            const opt = new Option("── CARTÕES ──", "", false, false);
            opt.disabled = true;
            sel.add(opt);
            dataC.cartoes.forEach(c => sel.add(new Option(`💳 ${c.nome}`, c.nome)));
        }

        if (data.status === 'sucesso' && data.dados.length > 0) {
            const opt = new Option("── MINHAS FORMAS ──", "", false, false);
            opt.disabled = true;
            sel.add(opt);
            data.dados.forEach(f => sel.add(new Option(f.nome, f.nome)));
        }
    } catch (e) { console.error(e); }
}

// === PAINEL LATERAL DE EDIÇÃO ===
function abrirPainelEdicao(id, tipo, descricao, valor, data, categoria, pagamento, status) {
    const painel = document.getElementById('painelTransacao');
    const overlay = document.getElementById('overlayPainel');

    document.getElementById('idTransacaoEditar').value = id;
    document.getElementById('tipoLancamento').value = tipo;
    document.getElementById('descLancamento').value = descricao;
    document.getElementById('valorLancamento').value = valor;

    // Setar valores nos selectores dinâmicos
    const selCat = document.getElementById('catLancamento');
    const selPag = document.getElementById('pagLancamento');
    const selStatus = document.getElementById('statusLancamento');

    selCat.value = categoria;
    selPag.value = pagamento;
    if (selStatus) selStatus.value = status || 'pago';

    try {
        const partesData = data.split('/');
        document.getElementById('dataLancamento').value = `${partesData[2]}-${partesData[1]}-${partesData[0]}`;
    } catch (e) { }

    painel.classList.add('aberto');
    setTimeout(() => overlay.classList.add('aberto'), 10);
}

function fecharPainelTransacao() {
    document.getElementById('painelTransacao').classList.remove('aberto');
    document.getElementById('overlayPainel').classList.remove('aberto');
    setTimeout(() => document.getElementById('overlayPainel').style.display = 'none', 300);
}

const formEdicao = document.getElementById('formLancamento');
if (formEdicao) {
    formEdicao.addEventListener('submit', async function (e) {
        e.preventDefault();
        const id = document.getElementById('idTransacaoEditar').value;
        const btn = document.getElementById('btn-salvar-transacao');
        const textoOriginal = btn.innerText;
        btn.innerText = "Salvando..."; btn.disabled = true;

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
            const response = await fetch(`/api/lancamentos/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            if (response.ok) { fecharPainelTransacao(); await carregarHistorico(); }
        } catch (error) { console.error(error); }
        finally { btn.innerText = textoOriginal; btn.disabled = false; }
    });
}