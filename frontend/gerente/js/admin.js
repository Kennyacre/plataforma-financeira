// gerente/js/painel-admin.js
const user = localStorage.getItem('usuarioLogado');

document.addEventListener('DOMContentLoaded', () => {
    // 1. Inicia sidebar e validações visuais
    if (typeof inicializarSidebar === 'function') inicializarSidebar();

    const elNome = document.getElementById('nome-admin-sidebar');
    if (elNome) elNome.innerText = user.toUpperCase();

    // 2. Dispara o carregamento dos dados do painel
    carregarDashboardAdmin();
});

async function carregarDashboardAdmin() {
    try {
        const response = await fetch('/api/admin/dashboard');
        const data = await response.json();

        if (data.status === 'sucesso') {
            document.getElementById('total-clientes').innerText = data.total_clientes;
            document.getElementById('total-receitas').innerText = `R$ ${data.total_receitas.toFixed(2).replace('.', ',')}`;
            document.getElementById('total-transacoes').innerText = data.total_transacoes;

            const tbody = document.getElementById('lista-ultimos');
            tbody.innerHTML = '';

            data.ultimos_usuarios.forEach(u => {
                let badgeClass = 'role-cliente';
                if (u.role === 'admin') badgeClass = 'role-admin';
                if (u.role === 'revenda') badgeClass = 'role-revenda';

                // Proteção: Esconder botão de excluir do admin principal (você)
                let btnDelete = '';
                if (u.username !== 'admin') {
                    btnDelete = `
                        <button class="btn-reject" onclick="excluirUsuario(${u.id}, '${u.username}')" title="Excluir Definitivamente">
                            <span class="material-symbols-rounded" style="font-size: 18px;">delete_forever</span>
                        </button>
                    `;
                }

                tbody.innerHTML += `
                    <tr>
                        <td style="color: #64748b;">#${u.id}</td>
                        <td style="font-weight: bold;">${u.username}</td>
                        <td><span class="role-badge ${badgeClass}">${u.role}</span></td>
                        <td class="actions-cell">${btnDelete}</td>
                    </tr>
                `;
            });
        }
    } catch (error) {
        console.error("Erro ao carregar dados da torre:", error);
    }
}

async function excluirUsuario(id, username) {
    if (!confirm(`⚠️ ATENÇÃO EXTREMA: Deseja apagar permanentemente o utilizador '${username}' e todos os seus dados financeiros? Esta ação não tem volta!`)) return;

    try {
        const response = await fetch(`/api/admin/usuarios/${id}`, { method: 'DELETE' });
        const result = await response.json();

        if (response.ok && result.status === 'sucesso') {
            alert("✅ " + result.mensagem);
            carregarDashboardAdmin(); // Recarrega os dados na hora
        } else {
            alert("Erro: " + (result.detail || "Falha na exclusão."));
        }
    } catch (error) {
        alert("Erro ao conectar com o botão de autodestruição.");
    }
}

async function fazerBackup() {
    if (!confirm("📦 Deseja gerar um backup completo do banco de dados e enviar para o Telegram agora?")) return;

    // Tenta encontrar o botão de backup em ambos os padrões de HTML
    const btn = document.querySelector('[onclick*="fazerBackup"]') || document.querySelector('.btn-backup');
    const txtOriginal = btn ? btn.innerHTML : '';
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<span class="material-symbols-rounded" style="animation: spin 1s linear infinite;">sync</span> Enviando...';
    }

    try {
        const response = await fetch('/api/admin/backup-telegram', { method: 'POST' });
        const result = await response.json();

        if (response.ok && result.status === 'sucesso') {
            alert("✅ Backup gerado e enviado para o Telegram com sucesso!\n\nVerifique o chat do bot 'Backup TN Info'.");
        } else {
            alert("⚠️ Erro ao enviar backup: " + (result.detail || result.mensagem || "Erro desconhecido."));
        }
    } catch (error) {
        alert("❌ Erro de conexão ao tentar gerar o backup.");
        console.error(error);
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = txtOriginal;
        }
    }
}