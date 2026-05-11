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
    if (!confirm("Deseja gerar e baixar um backup completo (Offline) de toda a base de dados agora?")) return;

    const btn = document.querySelector('.btn-backup');
    const txtOriginal = btn.innerHTML;
    btn.innerHTML = '<span class="material-symbols-rounded">sync</span> Gerando...';

    try {
        const response = await fetch('/api/admin/backup');
        if (!response.ok) throw new Error("Falha ao puxar os dados do motor.");

        const data = await response.json();

        // Transforma os dados numa string JSON formatada bonita
        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: "application/json" });
        const url = URL.createObjectURL(blob);

        // Cria um link invisível e clica nele para forçar o download
        const link = document.createElement('a');
        const dataHoje = new Date().toISOString().split('T')[0];
        link.href = url;
        link.download = `Backup_TNINFO_${dataHoje}.json`;

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        alert("✅ Backup descarregado com sucesso! Guarde este ficheiro num local seguro.");
    } catch (error) {
        alert("Erro ao realizar o backup.");
        console.error(error);
    } finally {
        btn.innerHTML = txtOriginal;
    }
}