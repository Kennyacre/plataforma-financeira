// cliente/js/cartoes.js
const user = localStorage.getItem('usuarioLogado');

const formatarMoeda = (valor) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);

document.addEventListener('DOMContentLoaded', () => {
    if (!user) {
        window.location.href = '../index.html';
        return;
    }

    // Inicializa sidebar (do security.js)
    if (typeof inicializarSidebar === 'function') {
        inicializarSidebar();
    }

    const elNome = document.getElementById('nome-cliente-sidebar');
    if (elNome) elNome.innerText = user.toUpperCase();

    const elAvatar = document.getElementById('user-avatar');
    if (elAvatar) elAvatar.innerText = user.substring(0, 2).toUpperCase();

    carregarCartoes();
});

async function carregarCartoes() {
    try {
        const response = await fetch(`/api/cartoes/${user}`);
        if (!response.ok) throw new Error("Falha ao carregar cartões");

        const dados = await response.json();
        if (dados.status === 'sucesso') {
            desenharCartoes(dados.cartoes);
        }
    } catch (error) {
        console.error("Erro no motor de cartões:", error);
    }
}

function desenharCartoes(cartoes) {
    const grid = document.getElementById('grid-cartoes');
    if (!grid) return;
    grid.innerHTML = '';

    if (!cartoes || cartoes.length === 0) {
        grid.innerHTML = `
            <div class="no-cards" style="grid-column: 1/-1; text-align: center; padding: 40px; background: rgba(255,255,255,0.02); border-radius: 15px; border: 1px dashed rgba(255,255,255,0.1);">
                <span class="material-symbols-rounded" style="font-size: 48px; color: #64748b; margin-bottom: 10px;">credit_card_off</span>
                <h3 style="color: #f8fafc;">Nenhum cartão registrado</h3>
                <p style="color: #94a3b8; font-size: 14px;">Adicione o seu primeiro cartão no formulário ao lado.</p>
            </div>`;
        return;
    }

    cartoes.forEach(card => {
        const limite = parseFloat(card.limite) || 0;
        const fatura = parseFloat(card.fatura) || 0;
        const porcentagem = (fatura / limite) * 100 || 0;

        grid.innerHTML += `
            <div class="credit-card-item" style="background: linear-gradient(135deg, ${card.cor} 0%, #1e293b 150%);">
                <button class="btn-delete-card" onclick="excluirCartao('${card.nome}')" title="Excluir">
                    <span class="material-symbols-rounded">delete</span>
                </button>
                
                <button class="btn-pay-fatura" onclick="pagarFatura('${card.nome}')" ${fatura <= 0 ? 'style="opacity: 0.5; cursor: not-allowed;" disabled' : ''}>
                    Pagar Fatura
                </button>

                <div class="cc-bg-pattern"></div>
                <div class="cc-top">
                    <div class="cc-chip"></div>
                    <div class="cc-brand">${card.nome}</div>
                </div>
                <div class="cc-middle">
                    <p class="cc-limit-title">Fatura Atual</p>
                    <p class="cc-limit-value">${formatarMoeda(fatura)}</p>
                    <div style="width: 100%; height: 4px; background: rgba(255,255,255,0.1); border-radius: 2px; margin-top: 5px;">
                        <div style="width: ${Math.min(porcentagem, 100)}%; height: 100%; background: ${porcentagem > 90 ? '#ef4444' : '#10b981'}; border-radius: 2px;"></div>
                    </div>
                </div>
                <div class="cc-bottom">
                    <div class="cc-date"><span>Fechamento/Venc.</span>Dia ${card.fechamento} / ${card.vencimento || '--'}</div>
                    <div class="cc-date" style="text-align: right;"><span>Limite Total</span>${formatarMoeda(limite)}</div>
                </div>
            </div>`;
    });
}

async function pagarFatura(nomeCartao) {
    if (!confirm(`Deseja pagar a fatura do cartão "${nomeCartao}"? O valor será debitado do seu saldo geral.`)) return;

    try {
        const response = await fetch('/api/cartoes/pagar-fatura', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: user, nome_cartao: nomeCartao })
        });

        const result = await response.json();
        if (result.status === 'sucesso') {
            alert('✅ Fatura paga com sucesso!');
            carregarCartoes();
        } else {
            alert('❌ Erro: ' + (result.detalhe || 'Falha ao pagar fatura.'));
        }
    } catch (error) {
        console.error(error);
        alert('Erro de conexão com o servidor.');
    }
}

async function excluirCartao(nomeCartao) {
    if (!confirm(`⚠️ Deseja remover o cartão "${nomeCartao}"?`)) return;

    try {
        const response = await fetch(`/api/cartoes/${user}/${nomeCartao}`, { method: 'DELETE' });
        const result = await response.json();
        if (result.status === 'sucesso') {
            alert('✅ Cartão removido!');
            carregarCartoes();
        } else {
            alert('❌ Erro ao excluir.');
        }
    } catch (error) {
        console.error(error);
    }
}

const formCartao = document.getElementById('form-cartao');
if (formCartao) {
    formCartao.addEventListener('submit', async (e) => {
        e.preventDefault();

        const payload = {
            username: user,
            nome: document.getElementById('nome').value,
            limite: parseFloat(document.getElementById('limite').value),
            fechamento: parseInt(document.getElementById('fechamento').value),
            vencimento: parseInt(document.getElementById('vencimento').value),
            cor: document.getElementById('cor').value
        };

        try {
            const response = await fetch('/api/cartoes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await response.json();
            if (result.status === 'sucesso') {
                formCartao.reset();
                carregarCartoes();
            } else {
                alert('❌ Erro ao salvar: ' + (result.detalhe || 'Erro desconhecido.'));
            }
        } catch (error) {
            console.error(error);
            alert('Erro de conexão ao salvar cartão.');
        }
    });
}