// revenda/js/solicitar-creditos.js
const user = localStorage.getItem('usuarioLogado');
let pacoteSelecionado = null; // Guarda em memória o pacote que o parceiro quer comprar

document.addEventListener('DOMContentLoaded', () => {
    // 1. Inicializa o Guarda da Nave e a Sidebar
    if (typeof inicializarSidebar === 'function') inicializarSidebar();
    
    document.getElementById('nome-revendedor-sidebar').innerText = user.toUpperCase();

    // 2. Carrega o histórico de pedidos
    carregarPedidos();
});

// Acionada quando o parceiro clica num pacote
function comprarPacote(qtdCreditos, valor, nomePacote) {
    pacoteSelecionado = { qtdCreditos, valor, nomePacote };

    // Revela a caixa-forte do PIX
    const pixBox = document.getElementById('pix-box');
    pixBox.style.display = 'block';

    // Injeta os dados do pacote escolhido no painel de pagamento
    document.getElementById('pix-valor-display').innerText = `R$ ${valor.toFixed(2).replace('.', ',')}`;
    document.getElementById('pix-pacote-display').innerText = nomePacote;

    // Desliza a página suavemente até à zona de pagamento
    pixBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// Acionada quando o parceiro confirma que já pagou
async function enviarComprovativo() {
    if (!pacoteSelecionado) return;

    const btn = document.getElementById('btn-confirmar-pagamento');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<span class="material-symbols-rounded">sync</span> A enviar pedido...';
    btn.disabled = true;

    try {
        const response = await fetch('/api/revenda/solicitar-creditos', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ 
                username: user, 
                quantidade: pacoteSelecionado.qtdCreditos,
                valor: pacoteSelecionado.valor 
            })
        });

        const data = await response.json();

        if (response.ok) { 
            alert("✅ " + data.mensagem); 
            document.getElementById('pix-box').style.display = 'none'; // Esconde o PIX
            pacoteSelecionado = null;
            carregarPedidos(); // Atualiza a tabela imediatamente
        } else {
            alert("❌ Erro: " + (data.detail || "Falha ao registar o pedido."));
        }
    } catch (e) { 
        alert("🚨 Erro crítico de comunicação com a Torre de Controlo."); 
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

// Carrega a tabela com os pedidos antigos e pendentes
async function carregarPedidos() {
    try {
        const res = await fetch(`/api/revenda/minhas-solicitacoes/${user}`);
        const data = await res.json();
        const tbody = document.getElementById('lista-pedidos');
        tbody.innerHTML = '';

        if (!data.pedidos || data.pedidos.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; color:#94a3b8; padding:30px;">Ainda não efetuou nenhum pedido de créditos.</td></tr>';
            return;
        }

        data.pedidos.forEach(p => {
            let badgeColor = p.status === 'Aprovado' ? '#10b981' : (p.status === 'Recusado' ? '#ef4444' : '#f59e0b');
            let badgeBg = p.status === 'Aprovado' ? 'rgba(16, 185, 129, 0.1)' : (p.status === 'Recusado' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)');
            
            tbody.innerHTML += `
                <tr>
                    <td style="color: #94a3b8;">${p.data}</td>
                    <td style="font-weight: bold; color: #f8fafc;">${p.quantidade} Créditos</td>
                    <td>
                        <span style="background: ${badgeBg}; color: ${badgeColor}; padding: 6px 12px; border-radius: 8px; font-size: 11px; font-weight: bold; text-transform: uppercase;">
                            ${p.status}
                        </span>
                    </td>
                </tr>`;
        });
    } catch (error) { 
        console.error("Erro ao carregar histórico:", error); 
    }
}