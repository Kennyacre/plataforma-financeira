// gerente/js/todos-clientes.js

// Usamos adminLogado para não dar o erro do "user already declared"
const adminLogado = localStorage.getItem('usuarioLogado');

let allUsersData = []; // Para armazenar os dados e usar no modal

document.addEventListener('DOMContentLoaded', () => {
    if (typeof inicializarSidebar === 'function') inicializarSidebar();

    const elNome = document.getElementById('nome-admin-sidebar');
    if (elNome) elNome.innerText = adminLogado ? adminLogado.toUpperCase() : 'ADMIN';

    carregarUsuariosGlobais();
    
    // Configurar envio do formulário de edição
    const formEdicao = document.getElementById('formEdicaoUsuario');
    if (formEdicao) {
        formEdicao.addEventListener('submit', salvarEdicaoUsuario);
    }
});

async function carregarUsuariosGlobais() {
    try {
        const response = await fetch('/api/admin/todos-usuarios');
        const data = await response.json();

        const tbody = document.getElementById('lista-usuarios');
        if (!tbody) return;
        tbody.innerHTML = '';

        if (!data.usuarios || data.usuarios.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Nenhum cliente no radar.</td></tr>';
            return;
        }

        allUsersData = data.usuarios; // Salva globalmente
        console.log("Carregando", data.usuarios.length, "utilizadores totais.");
        
        data.usuarios.forEach(u => {
            try {
                // Lógica de Bloqueio
                const isBloqueado = u.status === 'bloqueado';
                const iconBloqueio = isBloqueado ? 'lock_open' : 'block';
                const corBloqueio = '#ffffff';
                const labelBloqueio = isBloqueado ? 'Desbloquear' : 'Bloquear';

                let acoes = '';
                if (u.username && u.username.toLowerCase() !== 'admin') {
                    acoes = `
                        <div style="display: flex; gap: 8px; justify-content: flex-end;">
                            <button onclick="abrirModalEdicao(${u.id})" title="Editar Usuário" class="btn-block-small" style="color: #ffffff;">
                                <span class="material-symbols-rounded" style="font-size: 18px;">edit</span>
                            </button>
                            <button onclick="toggleBloqueio(${u.id}, '${u.username}')" title="${labelBloqueio}" class="btn-block-small" style="color: ${corBloqueio};">
                                <span class="material-symbols-rounded" style="font-size: 18px;">${iconBloqueio}</span>
                            </button>
                            <button onclick="resetarSenha(${u.id}, '${u.username}')" title="Resetar Senha" class="btn-block-small" style="color: #ffffff;">
                                <span class="material-symbols-rounded" style="font-size: 18px;">lock_reset</span>
                            </button>
                            <button onclick="excluirUsuario(${u.id}, '${u.username}')" title="Mover para Lixeira" class="btn-reject-small">
                                <span class="material-symbols-rounded" style="font-size: 18px;">delete</span>
                            </button>
                        </div>
                    `;
                }

                const role = u.role ? u.role.toLowerCase() : 'cliente';
                let badgeColor = '#ffffff';
                let badgeBg = role === 'admin' ? 'rgba(255, 255, 255, 0.2)' : (role === 'revenda' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.1)');
                
                // Badge de Premium (Estrela)
                const premiumBadge = u.is_premium ? '<span class="material-symbols-rounded" style="color: #ffffff; font-size: 14px; vertical-align: middle; margin-left: 5px;" title="Cliente Premium">stars</span>' : '';

                tbody.innerHTML += `
                    <tr class="user-row">
                        <td class="hide-mobile" style="color: #ffffff; opacity: 0.7;">#${u.id}</td>
                        <td class="nome-user" style="font-weight: bold; color: #ffffff;">
                            ${u.nome || u.username} ${premiumBadge} <br>
                            <small style="color: #ffffff; opacity: 0.6; font-weight: normal;">@${u.username}</small> ${isBloqueado ? '<small>(Bloqueado)</small>' : ''}
                        </td>
                        <td><span style="background: ${badgeBg}; color: ${badgeColor}; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: bold; text-transform: uppercase;">${u.role}</span></td>
                        <td class="hide-tablet" style="color: #ffffff; opacity: 0.7;">${u.revendedor || 'Sistema'}</td>
                        <td style="color: #ffffff; opacity: 0.7;">${u.vencimento || 'Sem data'}</td>
                        <td class="actions-cell">${acoes}</td>
                    </tr>
                `;
            } catch (err) {
                console.error("Erro ao carregar linha do usuário:", u, err);
            }
        });
    } catch (error) {
        console.error("Erro no radar:", error);
        document.getElementById('lista-usuarios').innerHTML = '<tr><td colspan="6" style="text-align: center; color: #ffffff; opacity: 0.7;">Falha de comunicação com a base de dados.</td></tr>';
    }
}

// === LÓGICA DO MODAL DE EDIÇÃO ===

function abrirModalEdicao(id) {
    const user = allUsersData.find(u => u.id === id);
    if (!user) return;
    
    // Preenche os campos
    document.getElementById('editUserId').value = user.id;
    document.getElementById('editNome').value = user.nome || '';
    
    if (user.vencimento && user.vencimento !== 'Sem data') {
        document.getElementById('editVencimento').value = user.vencimento;
    } else {
        document.getElementById('editVencimento').value = '';
    }
    
    document.getElementById('editStatus').value = user.status === 'bloqueado' ? 'bloqueado' : 'ativo';
    document.getElementById('editPremium').checked = user.is_premium === true;
    
    // Exibe o modal
    document.getElementById('overlayEdicaoUsuario').style.display = 'block';
    document.getElementById('modalEdicaoUsuario').style.display = 'block'; // Necessário para a transição inicial
    
    setTimeout(() => {
        document.getElementById('overlayEdicaoUsuario').style.opacity = '1';
        document.getElementById('modalEdicaoUsuario').classList.add('aberto');
    }, 10);
}

function fecharModalEdicao() {
    document.getElementById('overlayEdicaoUsuario').style.opacity = '0';
    document.getElementById('modalEdicaoUsuario').classList.remove('aberto');
    
    setTimeout(() => {
        document.getElementById('overlayEdicaoUsuario').style.display = 'none';
        document.getElementById('modalEdicaoUsuario').style.display = 'none'; // Previne cliques
    }, 300);
}

async function salvarEdicaoUsuario(event) {
    event.preventDefault();
    
    const id = document.getElementById('editUserId').value;
    const nome = document.getElementById('editNome').value;
    const vencimento = document.getElementById('editVencimento').value;
    const status = document.getElementById('editStatus').value;
    const isPremium = document.getElementById('editPremium').checked;
    
    const payload = {
        nome_completo: nome || null,
        vencimento: vencimento || null,
        status: status,
        is_premium: isPremium
    };
    
    try {
        const response = await fetch(`/api/admin/usuarios/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        if (response.ok) {
            fecharModalEdicao();
            carregarUsuariosGlobais(); // Recarrega a tabela atualizada
        } else {
            const err = await response.json();
            alert("Erro ao salvar: " + (err.detail || "Tente novamente."));
        }
    } catch (e) {
        alert("Erro de conexão.");
    }
}

// ===================================

async function toggleBloqueio(id, username) {
    try {
        const response = await fetch(`/api/admin/bloquear/${id}`, { method: 'POST' });
        if (response.ok) {
            carregarUsuariosGlobais(); // Atualiza a tela
        } else {
            const result = await response.json();
            alert("Erro: " + (result.detail || "Falha ao mudar status."));
        }
    } catch (error) { alert("Erro de conexão."); }
}

async function excluirUsuario(id, username) {
    if (!confirm(`⚠️ Deseja mover '${username}' para a lixeira?`)) return;
    try {
        const response = await fetch(`/api/admin/usuarios/${id}`, { method: 'DELETE' });
        if (response.ok) {
            carregarUsuariosGlobais();
        } else {
            alert("Erro ao excluir.");
        }
    } catch (error) { alert("Erro de conexão."); }
}

async function resetarSenha(id, username) {
    if (!confirm(`Deseja resetar a senha de '${username}'? O sistema gerará uma senha temporária.`)) return;
    try {
        const response = await fetch(`/api/admin/reset-senha-usuario/${id}`, { method: 'POST' });
        const data = await response.json();
        if (response.ok && data.status === 'sucesso') {
            alert(`✅ Senha de '${username}' resetada!\n\nNOVA SENHA: ${data.nova_senha}\n\nCopie esta senha e envie ao cliente. Ele deverá trocá-la no próximo acesso.`);
        } else {
            alert("Erro ao resetar senha.");
        }
    } catch (error) { alert("Erro de conexão."); }
}

function filtrarTabela() {
    const filter = document.getElementById('filtro-users').value.toLowerCase();
    const rows = document.querySelectorAll('.user-row');
    rows.forEach(row => {
        const nome = row.querySelector('.nome-user').innerText.toLowerCase();
        row.style.display = nome.includes(filter) ? "" : "none";
    });
}