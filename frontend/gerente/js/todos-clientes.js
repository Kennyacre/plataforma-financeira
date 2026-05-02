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
                const corBloqueio = isBloqueado ? '#10b981' : '#f59e0b';
                const labelBloqueio = isBloqueado ? 'Desbloquear' : 'Bloquear';

                let acoes = '';
                if (u.username && u.username.toLowerCase() !== 'admin') {
                    acoes = `
                        <div style="display: flex; gap: 4px; justify-content: flex-end;">
                            <button onclick="abrirModalEdicao(${u.id})" class="btn-table-action" title="Editar">
                                <span class="material-symbols-rounded">edit</span>
                            </button>
                            <button onclick="renovarCliente(${u.id}, '${u.vencimento}')" class="btn-table-action btn-renew-action" title="Renovar +30 Dias">
                                <span class="material-symbols-rounded">event_repeat</span>
                            </button>
                            <button onclick="toggleBloqueio(${u.id}, '${u.username}')" class="btn-table-action" title="${labelBloqueio}" style="color: ${corBloqueio};">
                                <span class="material-symbols-rounded">${iconBloqueio}</span>
                            </button>
                            <button onclick="excluirUsuario(${u.id}, '${u.username}')" class="btn-table-action btn-delete-action" title="Excluir">
                                <span class="material-symbols-rounded">delete</span>
                            </button>
                        </div>
                    `;
                }

                const role = u.role ? u.role.toLowerCase() : 'cliente';
                let badgeColor = role === 'admin' ? '#f59e0b' : (role === 'revenda' ? '#8b5cf6' : '#10b981');
                let badgeBg = role === 'admin' ? 'rgba(245, 158, 11, 0.1)' : (role === 'revenda' ? 'rgba(139, 92, 246, 0.1)' : 'rgba(16, 185, 129, 0.1)');
                
                // Badge de Premium (Estrela)
                const premiumBadge = u.is_premium ? '<span title="Cliente Premium" style="color: #f59e0b; margin-left: 5px;">⭐</span>' : '';

                tbody.innerHTML += `
                    <tr class="user-row">
                        <td class="hide-mobile" style="color: #94a3b8;">#${u.id}</td>
                        <td class="nome-user" style="font-weight: bold; color: ${isBloqueado ? '#64748b' : '#f8fafc'};">
                            ${u.nome || u.username} ${premiumBadge} <br>
                            <small style="color: #64748b; font-weight: normal;">@${u.username}</small> ${isBloqueado ? '<small>(Bloqueado)</small>' : ''}
                        </td>
                        <td class="hide-mobile" style="color: #94a3b8; font-size: 13px;">${u.email || '-'}</td>
                        <td class="hide-mobile" style="color: #94a3b8; font-size: 13px;">${u.whatsapp || '-'}</td>
                        <td style="color: #94a3b8;">${u.vencimento || 'Sem data'}</td>
                        <td style="font-weight: bold; color: #ffffff;">R$ ${u.valor_venda ? u.valor_venda.toFixed(2).replace('.', ',') : '0,00'}</td>
                        <td class="actions-cell">${acoes}</td>
                    </tr>
                `;
            } catch (err) {
                console.error("Erro ao carregar linha do usuário:", u, err);
            }
        });
    } catch (error) {
        console.error("Erro no radar:", error);
        document.getElementById('lista-usuarios').innerHTML = '<tr><td colspan="6" style="text-align: center; color: #ef4444;">Falha de comunicação com a base de dados.</td></tr>';
    }
}

// === LÓGICA DO MODAL DE EDIÇÃO ===

async function abrirModalEdicao(id) {
    try {
        // Busca os dados REAIS e ATUAIS do banco de dados (com cache bust)
        const response = await fetch(`/api/admin/usuarios/${id}?v=${Date.now()}`);
        if (!response.ok) throw new Error("Não foi possível carregar os dados do usuário.");
        
        const user = await response.json();
        
        // Preenche os campos do modal com o que está no banco
        document.getElementById('editUserId').value = user.id;
        document.getElementById('editNome').value = user.nome || '';
        document.getElementById('editEmail').value = user.email || '';
        document.getElementById('editWhatsapp').value = user.whatsapp || '';
        document.getElementById('editValorVenda').value = user.valor_venda || 0;
        
        if (user.vencimento && user.vencimento !== 'Sem data' && user.vencimento !== 'None') {
            document.getElementById('editVencimento').value = user.vencimento;
        } else {
            document.getElementById('editVencimento').value = '';
        }
        
        document.getElementById('editStatus').value = user.status === 'bloqueado' ? 'bloqueado' : 'ativo';
        document.getElementById('editPremium').checked = user.is_premium === true;
        
        // Exibe o modal
        document.getElementById('overlayEdicaoUsuario').style.display = 'block';
        document.getElementById('modalEdicaoUsuario').style.display = 'block';
        
        setTimeout(() => {
            document.getElementById('overlayEdicaoUsuario').style.opacity = '1';
            document.getElementById('modalEdicaoUsuario').classList.add('aberto');
        }, 10);
    } catch (err) {
        alert("🚨 Erro ao buscar dados: " + err.message);
    }
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
    
    // Captura os elementos com IDs exatos
    const id = document.getElementById('editUserId').value;
    const nome = document.getElementById('editNome').value.trim();
    const email = document.getElementById('editEmail').value.trim();
    const whatsapp = document.getElementById('editWhatsapp').value.trim();
    const vencimento = document.getElementById('editVencimento').value;
    const status = document.getElementById('editStatus').value;
    const isPremium = document.getElementById('editPremium').checked;
    const valorVendaRaw = document.getElementById('editValorVenda').value;
    
    // Tratamento robusto para o valor (converte vírgula em ponto)
    let valorVendaFinal = 0;
    if (valorVendaRaw) {
        valorVendaFinal = parseFloat(String(valorVendaRaw).replace(',', '.'));
    }

    const payload = {
        nome_completo: nome || null,
        email: email || null,
        whatsapp: whatsapp || null,
        vencimento: vencimento || null,
        status: status,
        is_premium: isPremium,
        valor_venda: isNaN(valorVendaFinal) ? 0 : valorVendaFinal
    };
    
    console.log("🚀 Enviando atualização para ID:", id, payload);
    
    try {
        const response = await fetch(`/api/admin/usuarios/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        const resData = await response.json();
        console.log("📥 Resposta do Servidor:", resData);
        
        if (response.ok) {
            alert("✅ Perfeito! Alterações salvas com sucesso.");
            fecharModalEdicao();
            carregarUsuariosGlobais(); 
        } else {
            alert("❌ O servidor recusou a alteração: " + (resData.detail || "Verifique os dados."));
        }
    } catch (e) {
        console.error("Erro fatal no salvamento:", e);
        alert("🚨 Erro crítico: O motor do sistema não respondeu.");
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

async function renovarCliente(id, vencimentoAtual) {
    try {
        let dataBase = new Date();
        
        // Se já tem vencimento e ele é no futuro, soma a partir dele
        if (vencimentoAtual && vencimentoAtual !== 'Sem data' && vencimentoAtual !== 'None') {
            const dataVenc = new Date(vencimentoAtual + 'T12:00:00'); // Evita erro de fuso
            if (dataVenc > dataBase) {
                dataBase = dataVenc;
            }
        }
        
        // Adiciona 30 dias
        dataBase.setDate(dataBase.getDate() + 30);
        const novaData = dataBase.toISOString().split('T')[0];
        
        if (!confirm(`Deseja renovar o acesso por mais 30 dias?\nNova data: ${novaData}`)) return;

        const response = await fetch(`/api/admin/usuarios/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ vencimento: novaData })
        });

        if (response.ok) {
            // Pequeno efeito visual de sucesso antes de recarregar
            alert(`✅ Renovado com sucesso até ${novaData}!`);
            carregarUsuariosGlobais();
        } else {
            alert("Erro ao renovar cliente.");
        }
    } catch (err) {
        console.error("Erro na renovação:", err);
        alert("Erro ao processar renovação.");
    }
}

function filtrarTabela() {
    const filter = document.getElementById('filtro-users').value.toLowerCase();
    const rows = document.querySelectorAll('.user-row');
    rows.forEach(row => {
        const nome = row.querySelector('.nome-user').innerText.toLowerCase();
        row.style.display = nome.includes(filter) ? "" : "none";
    });
}