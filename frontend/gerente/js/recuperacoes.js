// frontend/gerente/js/recuperacoes.js

document.addEventListener('DOMContentLoaded', () => {
    carregarRecuperacoes();
    
    const adminNome = localStorage.getItem('usuarioLogado');
    if (adminNome && document.getElementById('nome-admin-sidebar')) {
        document.getElementById('nome-admin-sidebar').innerText = adminNome;
    }
});

async function carregarRecuperacoes() {
    const lista = document.getElementById('lista-recuperacoes');
    try {
        const response = await fetch('/api/admin/recuperacoes-pendentes');
        const data = await response.json();
        
        if (data.recuperacoes && data.recuperacoes.length > 0) {
            lista.innerHTML = '';
            data.recuperacoes.forEach(rec => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td class="user-row-cell">
                        <div style="font-weight: 700; color: #ffffff;">${rec.username}</div>
                    </td>
                    <td style="color: #94a3b8;">${rec.data}</td>
                    <td style="text-align: right; display: flex; gap: 8px; justify-content: flex-end;">
                        <button onclick="gerarSenha(${rec.id})" class="btn-backup" title="Gerar Senha Temporária" style="padding: 6px 12px;">
                            <span class="material-symbols-rounded" style="font-size: 18px;">key</span>
                        </button>
                        <button onclick="excluirSolicitacao(${rec.id})" class="btn-reject" title="Remover" style="padding: 6px 12px;">
                            <span class="material-symbols-rounded" style="font-size: 18px;">delete</span>
                        </button>
                    </td>
                `;
                lista.appendChild(tr);
            });
        } else {
            lista.innerHTML = '<tr><td colspan="3" style="text-align: center; padding: 40px; color: #64748b;">Nenhuma solicitação pendente no momento.</td></tr>';
        }
    } catch (err) {
        lista.innerHTML = '<tr><td colspan="3" style="text-align: center; color: #ef4444;">Erro ao carregar dados.</td></tr>';
    }
}

async function gerarSenha(id) {
    if (!confirm('Deseja gerar uma senha temporária para este utilizador?')) return;
    
    try {
        const response = await fetch(`/api/admin/recuperacoes/gerar/${id}`, { method: 'POST' });
        const data = await response.json();
        
        if (response.ok) {
            document.getElementById('target-user').innerText = data.username;
            document.getElementById('temp-pass-display').innerText = data.senha_temporaria;
            document.getElementById('modal-senha').style.display = 'flex';
            carregarRecuperacoes();
        } else {
            alert(data.detail || 'Erro ao gerar senha.');
        }
    } catch (err) {
        alert('Erro de conexão.');
    }
}

async function excluirSolicitacao(id) {
    if (!confirm('Deseja remover esta solicitação sem gerar uma nova senha?')) return;
    
    try {
        const response = await fetch(`/api/admin/recuperacoes/${id}`, { method: 'DELETE' });
        if (response.ok) {
            carregarRecuperacoes();
        } else {
            const data = await response.json();
            alert(data.detail || 'Erro ao remover.');
        }
    } catch (err) {
        alert('Erro de conexão.');
    }
}

// Lógica de Sidebar (Mobile)
document.getElementById('btn-toggle-sidebar')?.addEventListener('click', () => {
    document.getElementById('minha-sidebar').classList.toggle('active');
});
