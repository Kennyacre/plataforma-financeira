// gerente/js/pacotes.js
const user = localStorage.getItem('usuarioLogado');

document.addEventListener('DOMContentLoaded', () => {
    // 1. Inicializa o Guarda da Nave e Sidebar
    if (typeof inicializarSidebar === 'function') inicializarSidebar();
    
    document.getElementById('nome-admin-sidebar').innerText = user.toUpperCase();

    // 2. Carrega os pacotes ativos no sistema
    carregarPacotes();

    // 3. Motor do Formulário (Adicionar / Editar)
    const form = document.getElementById('form-pacotes');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const payload = {
            nome: document.getElementById('nome_pacote').value,
            creditos: parseInt(document.getElementById('creditos_pacote').value),
            valor: parseFloat(document.getElementById('valor_pacote').value)
        };

        const btn = document.querySelector('.btn-add-shop');
        const txtOriginal = btn.innerHTML;
        btn.innerHTML = '<span class="material-symbols-rounded">sync</span> Processando...';
        btn.disabled = true;

        try {
            const response = await fetch('/api/admin/pacotes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                alert("✅ Pacote atualizado na vitrine!");
                form.reset();
                carregarPacotes();
            }
        } catch (error) {
            alert("❌ Erro ao comunicar com o servidor.");
        } finally {
            btn.innerHTML = txtOriginal;
            btn.disabled = false;
        }
    });
});

async function carregarPacotes() {
    try {
        const response = await fetch('/api/admin/pacotes');
        const pacotes = await response.json();
        
        const grid = document.getElementById('pkg-grid');
        grid.innerHTML = '';

        pacotes.forEach(p => {
            grid.innerHTML += `
                <div class="pkg-item-card">
                    <div class="pkg-info">
                        <h4>PACOTE OFICIAL</h4>
                        <h3 style="color: #f8fafc; margin-bottom: 15px;">${p.nome}</h3>
                    </div>
                    <div class="pkg-credits">
                        <span class="material-symbols-rounded">database</span>
                        <strong>${p.creditos}</strong> Créditos
                    </div>
                    <div class="pkg-price">
                        R$ ${p.valor.toFixed(2).replace('.', ',')}
                    </div>
                    <div class="pkg-actions" style="margin-top: 20px; display: flex; gap: 10px; justify-content: center;">
                        <button onclick="prepararEdicao(${p.id}, '${p.nome}', ${p.creditos}, ${p.valor})" class="btn-edit-pkg" style="background: rgba(59, 130, 246, 0.1); color: #3b82f6; border: none; padding: 8px; border-radius: 8px; cursor: pointer;">
                            <span class="material-symbols-rounded">edit</span>
                        </button>
                        <button onclick="excluirPacote(${p.id})" class="btn-delete-pkg" style="background: rgba(239, 68, 68, 0.1); color: #ef4444; border: none; padding: 8px; border-radius: 8px; cursor: pointer;">
                            <span class="material-symbols-rounded">delete</span>
                        </button>
                    </div>
                </div>
            `;
        });
    } catch (error) {
        console.error("Erro ao carregar vitrine:", error);
    }
}

function prepararEdicao(id, nome, creditos, valor) {
    document.getElementById('nome_pacote').value = nome;
    document.getElementById('creditos_pacote').value = creditos;
    document.getElementById('valor_pacote').value = valor;
    document.getElementById('nome_pacote').focus();
    // No futuro, podemos adicionar um ID oculto para dar UPDATE em vez de POST
}

async function excluirPacote(id) {
    if (!confirm("⚠️ Comandante, deseja remover este pacote da vitrine?")) return;
    try {
        const res = await fetch(`/api/admin/pacotes/${id}`, { method: 'DELETE' });
        if (res.ok) carregarPacotes();
    } catch (e) { alert("Erro ao excluir."); }
}