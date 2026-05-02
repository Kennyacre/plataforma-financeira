// cliente/js/metas.js
const user = localStorage.getItem('usuarioLogado');

document.addEventListener('DOMContentLoaded', async () => {
    if (typeof inicializarSidebar === 'function') inicializarSidebar();

    const elNome = document.getElementById('nome-cliente-sidebar');
    const elAvatar = document.getElementById('user-avatar');
    if (elNome) elNome.innerText = user.toUpperCase();
    if (elAvatar) elAvatar.innerText = user.substring(0,2).toUpperCase();

    await Promise.all([
        carregarMetas(),
        carregarCategoriasNaLista()
    ]);

    // Evento de criar nova meta
    document.getElementById('form-meta').addEventListener('submit', async (e) => {
        e.preventDefault();
        const categoria = document.getElementById('categoria').value;
        const limite = document.getElementById('limite').value;
        
        try {
            const res = await fetch('/api/metas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: user, categoria, limite: parseFloat(limite) })
            });
            if(res.ok) {
                document.getElementById('form-meta').reset();
                carregarMetas();
            }
        } catch (error) { console.error("Erro ao salvar meta"); }
    });
});

async function carregarMetas() {
    try {
        const [resMetas, resLancs] = await Promise.all([
            fetch(`/api/metas/${user}`),
            fetch(`/api/lancamentos/${user}`)
        ]);

        const metas = await resMetas.json();
        const dadosLancs = await resLancs.json();
        const lancamentos = dadosLancs.dados || [];

        const container = document.getElementById('lista-metas');
        container.innerHTML = '';

        if (metas.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <span class="material-symbols-rounded">track_changes</span>
                    <h3>Nenhuma meta definida</h3>
                    <p>Defina limites de gastos por categoria para controlar seu orçamento.</p>
                </div>`;
            return;
        }

        // Pega o mês atual para filtrar os gastos
        const mesAtual = (new Date().getMonth() + 1).toString().padStart(2, '0');

        metas.forEach(meta => {
            // Soma os gastos reais do usuário nessa categoria neste mês
            const gastoAtual = lancamentos
                .filter(l => l.tipo === 'gasto' && l.categoria === meta.categoria && l.data.split('/')[1] === mesAtual)
                .reduce((acc, curr) => acc + parseFloat(curr.valor), 0);

            const porcentagem = (gastoAtual / meta.limite) * 100;
            let statusClass = 'fill-good';
            if (porcentagem > 75) statusClass = 'fill-warning';
            if (porcentagem > 100) statusClass = 'fill-danger';

            const barraLargura = Math.min(porcentagem, 100);

            container.innerHTML += `
                <div class="goal-card">
                    <div class="goal-header">
                        <div class="goal-title">
                            <div class="goal-icon"><span class="material-symbols-rounded">category</span></div>
                            ${meta.categoria}
                        </div>
                        <button class="btn-delete" onclick="deletarMeta('${meta.categoria}')">
                            <span class="material-symbols-rounded">delete</span>
                        </button>
                    </div>
                    <div class="goal-stats">
                        <span class="g-spent">Gasto: ${formatarMoeda(gastoAtual)}</span>
                        <span class="g-limit">Meta: ${formatarMoeda(meta.limite)}</span>
                    </div>
                    <div class="progress-track">
                        <div class="progress-fill ${statusClass}" style="width: ${barraLargura}%;"></div>
                    </div>
                    ${porcentagem > 100 ? `<div style="color: #ef4444; font-size: 11px; margin-top: 8px; font-weight: 600; text-align: right;">⚠️ Orçamento estourado!</div>` : ''}
                </div>
            `;
        });
    } catch (error) { console.error("Erro ao processar metas", error); }
}

function formatarMoeda(valor) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
}

async function deletarMeta(categoria) {
    if(!confirm(`Remover a meta de ${categoria}?`)) return;
    await fetch(`/api/metas/${user}/${categoria}`, { method: 'DELETE' });
    carregarMetas();
}

async function carregarCategoriasNaLista() {
    const select = document.getElementById('categoria');
    try {
        const res = await fetch(`/api/categorias/${user}`);
        const data = await res.json();

        select.innerHTML = '<option value="" disabled selected>Selecione a categoria...</option>';

        const padroes = ["Alimentação", "Moradia", "Transporte", "Saúde", "Lazer e Viagens", "Educação", "Salário", "Vestuário", "Investimentos", "Impostos / Taxas", "Cuidados Pessoais", "Outros"];

        padroes.forEach(p => {
            const opt = document.createElement('option');
            opt.value = p; opt.innerText = p;
            select.appendChild(opt);
        });

        if (data.status === 'sucesso' && data.dados.length > 0) {
            const sep = document.createElement('option');
            sep.disabled = true; sep.innerText = "── MINHAS CATEGORIAS ──";
            select.appendChild(sep);

            data.dados.forEach(cat => {
                const opt = document.createElement('option');
                opt.value = cat.nome; opt.innerText = cat.nome;
                select.appendChild(opt);
            });
        }
    } catch (err) {
        console.error("Erro categorias:", err);
    }
}