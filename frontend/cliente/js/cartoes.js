// cliente/js/cartoes.js - SLEEK EDITION
const user = localStorage.getItem('usuarioLogado');

const formatarMoeda = (valor) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);

document.addEventListener('DOMContentLoaded', () => {
    if (!user) { window.location.href = '../index.html'; return; }
    carregarCartoes();
});

async function carregarCartoes() {
    try {
        const r = await fetch(`/api/cartoes/${user}?refresh=${Date.now()}`);
        const d = await r.json();
        if (d.status === 'sucesso') desenharCartoes(d.cartoes);
    } catch (e) { console.error(e); }
}

function desenharCartoes(cartoes) {
    const grid = document.getElementById('grid-cartoes');
    if (!grid) return;
    grid.innerHTML = '';

    if (!cartoes || cartoes.length === 0) {
        grid.innerHTML = '<div class="no-cards">Sem cartões ativos.</div>';
        return;
    }

    cartoes.forEach(card => {
        const faturaMes = parseFloat(card.fatura) || 0;
        const grad = `linear-gradient(135deg, ${card.cor} -50%, #000000 120%)`;

        grid.innerHTML += `
            <div class="credit-card-item" style="background: ${grad};">
                <button class="btn-table-action btn-delete-action" onclick="excluirCartao('${card.nome}')" style="position: absolute; top: 15px; right: 15px; border-radius: 8px;">
                    <span class="material-symbols-rounded">delete</span>
                </button>

                <div class="cc-top">
                    <div class="cc-chip"></div>
                    <div class="cc-bank-name">${card.nome}</div>
                </div>

                <div class="cc-body">
                    <p class="cc-label">Fatura Atual</p>
                    <p class="cc-value">${formatarMoeda(faturaMes)}</p>
                </div>

                <div class="cc-footer">
                    <div class="cc-extra">
                        <p class="cc-label">Vencimento</p>
                        <p class="cc-sub-info">Dia ${card.vencimento}</p>
                    </div>

                    <button class="btn-primary" onclick="pagarFatura('${card.nome}')" style="${faturaMes <= 0 ? 'display:none;' : ''} padding: 8px 15px; font-size: 13px; border-radius: 8px;">
                        Pagar Fatura
                    </button>
                </div>
            </div>
        `;
    });
}

// Ações
async function pagarFatura(nome) {
    if (!confirm(`Pagar fatura de ${nome}?`)) return;
    const r = await fetch('/api/cartoes/pagar-fatura', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user, nome_cartao: nome })
    });
    if (r.ok) carregarCartoes();
}

async function excluirCartao(nome) {
    if (!confirm(`Excluir ${nome}?`)) return;
    const r = await fetch(`/api/cartoes/${user}/${nome}`, { method: 'DELETE' });
    if (r.ok) carregarCartoes();
}

const form = document.getElementById('form-cartao');
if (form) {
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = {
            username: user,
            nome: document.getElementById('nome').value,
            limite: parseFloat(document.getElementById('limite').value),
            fechamento: parseInt(document.getElementById('fechamento').value),
            vencimento: parseInt(document.getElementById('vencimento').value),
            cor: document.getElementById('cor').value
        };
        const r = await fetch('/api/cartoes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (r.ok) { form.reset(); carregarCartoes(); }
    });
}