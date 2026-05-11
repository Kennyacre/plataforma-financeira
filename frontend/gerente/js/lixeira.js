// gerente/js/lixeira.js
const user = localStorage.getItem('usuarioLogado');

document.addEventListener('DOMContentLoaded', () => {
    // 1. Inicializa o Guarda da Nave e Sidebar
    if (typeof inicializarSidebar === 'function') inicializarSidebar();

    const elNome = document.getElementById('nome-admin-sidebar');
    if (elNome) elNome.innerText = user ? user.toUpperCase() : "ADMIN";

    // 2. Aciona o radar para varrer a lixeira
    carregarLixeira();
});

async function carregarLixeira() {
    try {
        // Rota da API para buscar utilizadores desativados/excluídos
        const response = await fetch('/api/admin/lixeira');
        const data = await response.json();
        const tbody = document.getElementById('lista-lixeira');
        tbody.innerHTML = '';

        if (!data || data.length === 0) {
            // Usa as classes premium do seu lixeira-admin.css para o estado vazio
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="empty-state-card" style="border: none;">
                        <div class="empty-content">
                            <span class="material-symbols-rounded">delete_sweep</span>
                            <h3 style="color: #f8fafc; margin-bottom: 5px;">Lixeira Vazia</h3>
                            <p style="color: #94a3b8; font-size: 14px;">Nenhum utilizador no setor de descarte no momento.</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        data.forEach(u => {
            let badgeClass = 'role-cliente';
            if (u.role === 'admin') badgeClass = 'role-admin';
            if (u.role === 'revenda') badgeClass = 'role-revenda';

            tbody.innerHTML += `
                <tr class="user-row">
                    <td class="hide-mobile" style="color: #64748b;">#${u.id}</td>
                    <td style="font-weight: bold; color: #f8fafc;">${u.username}</td>
                    <td class="hide-tablet"><span class="role-badge ${badgeClass}">${u.role}</span></td>
                    <td class="hide-mobile" style="color: #94a3b8;">${u.revendedor || 'Sistema'}</td>
                    <td class="actions-cell">
                        <button class="btn-backup" onclick="restaurarUsuario(${u.id})" title="Restaurar" style="padding: 6px 15px; font-size: 13px;">
                            <span class="material-symbols-rounded" style="font-size: 16px;">restore</span>
                        </button>
                        <button class="btn-reject" onclick="apagarPermanente(${u.id}, '${u.username}')" title="Excluir">
                            <span class="material-symbols-rounded" style="font-size: 18px;">delete_forever</span>
                        </button>
                    </td>
                </tr>
            `;
        });
    } catch (error) {
        console.error("Erro ao carregar lixeira:", error);
    }
}

async function restaurarUsuario(id) {
    if (!confirm("Deseja restaurar este utilizador e devolver o seu acesso ao sistema?")) return;

    try {
        const response = await fetch(`/api/admin/restaurar-usuario/${id}`, { method: 'POST' });
        if (response.ok) {
            alert("✅ Utilizador restaurado com sucesso! Ele já pode fazer login novamente.");
            carregarLixeira();
        } else {
            alert("❌ Erro ao tentar restaurar o utilizador.");
        }
    } catch (e) {
        alert("Erro de conexão com o servidor.");
    }
}

async function apagarPermanente(id, username) {
    if (!confirm(`⚠️ ALERTA VERMELHO: Deseja apagar '${username}' PERMANENTEMENTE? Esta ação destruirá todos os registos na base de dados e não tem volta!`)) return;

    try {
        const response = await fetch(`/api/admin/excluir-permanente/${id}`, { method: 'DELETE' });
        if (response.ok) {
            alert("🔥 Alvo desintegrado com sucesso.");
            carregarLixeira();
        } else {
            alert("❌ Erro ao tentar excluir permanentemente.");
        }
    } catch (e) {
        alert("Erro de conexão com o servidor.");
    }
}