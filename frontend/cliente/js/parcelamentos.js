// cliente/js/parcelamentos.js
const user = localStorage.getItem('usuarioLogado');

document.addEventListener('DOMContentLoaded', async () => {
    if (typeof inicializarSidebar === 'function') inicializarSidebar();
    await carregarParcelamentos();
});

async function carregarParcelamentos() {
    const container = document.getElementById('lista-parcelamentos');
    try {
        const res = await fetch(`/api/lancamentos/${user}`);
        if (!res.ok) throw new Error("Erro ao buscar dados");
        
        const data = await res.json();
        const lancamentos = data.dados || [];

        // Agrupar parcelamentos por nome base ou nome idêntico
        const grupos = {};
        
        lancamentos.forEach(l => {
            if (l.tipo !== 'gasto' && l.tipo !== 'despesa') return;
            
            // 1. Tenta encontrar o padrão (1/10)
            const match = l.descricao.match(/(.*?)\s*\(\d+\/\d+\)/);
            let nomeBase = match ? match[1].trim() : l.descricao.trim();
            
            if (!grupos[nomeBase]) {
                grupos[nomeBase] = {
                    nome: nomeBase,
                    totalGeral: 0,
                    totalPago: 0,
                    totalRestante: 0,
                    parcelas: [],
                    ultimoPagamento: l.pagamento,
                    eParcelamentoReal: !!match // Marca se tem o (1/10)
                };
            }
            
            const valor = parseFloat(l.valor) || 0;
            grupos[nomeBase].totalGeral += valor;
            grupos[nomeBase].parcelas.push(l);
            
            if ((l.status || "").toLowerCase() === 'pago') {
                grupos[nomeBase].totalPago += valor;
            } else {
                grupos[nomeBase].totalRestante += valor;
            }
        });

        // Filtrar apenas grupos que têm mais de 1 ocorrência (para ser considerado parcelamento/recorrência)
        const chaves = Object.keys(grupos).filter(nome => grupos[nome].parcelas.length > 1);
        
        if (chaves.length === 0) {
            container.innerHTML = '<p class="no-pending-msg">Você não possui parcelamentos ou contas recorrentes registradas.</p>';
            return;
        }

        let somaTotalParcelado = 0;
        let somaTotalAVencer = 0;

        container.innerHTML = chaves.map(nome => {
            const g = grupos[nome];
            const qtdTotal = g.parcelas.length;
            const qtdPagas = g.parcelas.filter(p => (p.status || "").toLowerCase() === 'pago').length;
            const perc = (qtdPagas / qtdTotal) * 100;
            const tipoDesc = g.eParcelamentoReal ? 'Parcelamento' : 'Recorrência';
            
            somaTotalParcelado += g.totalGeral;
            somaTotalAVencer += g.totalRestante;

            return `
                <div class="installment-card">
                    <div class="inst-header">
                        <div class="inst-title">
                            <h3>${g.nome}</h3>
                            <p>Via ${g.ultimoPagamento || 'Não informado'}</p>
                        </div>
                        <div class="inst-badge">${qtdPagas}/${qtdTotal} Parcelas</div>
                    </div>

                    <div class="inst-progress-container">
                        <div class="inst-progress-text">
                            <span>Progresso do Pagamento</span>
                            <span>${Math.round(perc)}%</span>
                        </div>
                        <div class="inst-progress-bar">
                            <div class="inst-progress-fill" style="width: ${perc}%"></div>
                        </div>
                    </div>

                    <div class="inst-footer">
                        <div class="inst-value-total">
                            Faltam: <span>${formatarMoeda(g.totalRestante)}</span>
                        </div>
                        <button class="btn-view-details" onclick='abrirDetalhes("${nome}", ${JSON.stringify(g.parcelas.map(p => ({id: p.id, desc: p.descricao, valor: p.valor, data: p.data, status: p.status}))).replace(/'/g, "&apos;")})'>
                            Ver Parcelas
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        document.getElementById('total-parcelado').innerText = formatarMoeda(somaTotalParcelado);
        document.getElementById('total-a-vencer').innerText = formatarMoeda(somaTotalAVencer);

    } catch (error) {
        console.error(error);
        container.innerHTML = '<p class="no-pending-msg">Erro ao carregar parcelamentos.</p>';
    }
}

function abrirDetalhes(nome, parcelas) {
    const modal = document.getElementById('modalParc');
    const titulo = document.getElementById('modal-titulo');
    const corpo = document.getElementById('detalhes-parcelas');
    
    titulo.innerText = nome;
    
    // Ordenar parcelas por data
    parcelas.sort((a, b) => {
        const dateA = a.data.includes('/') ? a.data.split('/').reverse().join('-') : a.data;
        const dateB = b.data.includes('/') ? b.data.split('/').reverse().join('-') : b.data;
        return new Date(dateA) - new Date(dateB);
    });

    corpo.innerHTML = parcelas.map(p => `
        <div class="parc-list-item ${p.status === 'pago' ? 'pago' : ''}">
            <div style="display:flex; flex-direction:column;">
                <span style="color:white; font-weight:600; font-size:14px;">${p.desc}</span>
                <span style="color:#71717a; font-size:11px;">Vencimento: ${p.data}</span>
            </div>
            <div style="text-align:right;">
                <div style="color:white; font-weight:700; margin-bottom:5px;">${formatarMoeda(p.valor)}</div>
                ${p.status === 'pago' 
                    ? '<span class="status-pago">PAGO</span>' 
                    : `<button class="btn-confirm-pay" style="padding: 4px 8px; font-size: 10px;" onclick="confirmarPagamentoParcela(${p.id})">Confirmar</button>`
                }
            </div>
        </div>
    `).join('');
    
    modal.style.display = 'flex';
}

function fecharModal() {
    document.getElementById('modalParc').style.display = 'none';
}

async function confirmarPagamentoParcela(id) {
    if(!confirm("Confirmar pagamento desta parcela?")) return;
    try {
        const res = await fetch(`/api/confirmar-pagamento/${id}`, { method: 'PUT' });
        if(res.ok) {
            fecharModal();
            await carregarParcelamentos();
        }
    } catch(e) { console.error(e); }
}

function formatarMoeda(v) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
}
