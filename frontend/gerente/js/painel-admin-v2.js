// gerente/js/painel-admin.js
const user = localStorage.getItem('usuarioLogado');

document.addEventListener('DOMContentLoaded', () => {
    if (typeof inicializarSidebar === 'function') inicializarSidebar();
    const elNome = document.getElementById('nome-admin-sidebar');
    if (elNome) elNome.innerText = user ? user.toUpperCase() : "ADMIN";
    carregarDadosDashboard();
    carregarConfiguracao();
    const formEdicao = document.getElementById('formEdicaoUsuario');
    if (formEdicao) formEdicao.addEventListener('submit', salvarEdicaoUsuario);
});

async function carregarDadosDashboard() {
    try {
        const response = await fetch('/api/admin/dashboard');
        const data = await response.json();

        if (data.status === 'sucesso') {
            const h2s = document.querySelectorAll('.stat-card h2');
            if (h2s.length >= 4) {
                h2s[0].innerText = data.total_clientes;
                h2s[1].innerText = `R$ ${data.total_receitas.toFixed(2).replace('.', ',')}`;
                h2s[2].innerText = data.total_transacoes;
                h2s[3].innerText = data.total_recuperacoes;
                const elRen = document.getElementById('total-renovacoes');
                if (elRen) elRen.innerText = data.total_renovacoes || 0;
            }

            const tbody = document.querySelector('.premium-table tbody');
            if (tbody) {
                tbody.innerHTML = '';
                console.log("Processando", data.ultimos_usuarios.length, "usuários no sumário.");

                data.ultimos_usuarios.forEach(u => {
                    try {
                        let acoes = '';
                        // Protege o Admin Supremo
                        
                        const isBloqueado = u.status === 'bloqueado';
                        const iconBloqueio = isBloqueado ? 'lock_open' : 'block';
                        const corBloqueio = isBloqueado ? '#10b981' : '#f59e0b';
                        const labelBloqueio = isBloqueado ? 'Desbloquear' : 'Bloquear';

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
                        } else {
                            acoes = `<span class="material-symbols-rounded" style="color: #ffffff;" title="Admin Supremo">security</span>`;
                        }


                        const role = u.role ? u.role.toLowerCase() : 'cliente';
                        let badgeColor = role === 'admin' ? '#ffffff' : (role === 'revenda' ? '#a1a1aa' : '#e2e8f0');
                        let badgeBg = role === 'admin' ? 'rgba(255, 255, 255, 0.15)' : (role === 'revenda' ? 'rgba(161, 161, 170, 0.1)' : 'rgba(255, 255, 255, 0.05)');

                        tbody.innerHTML += `
                            <tr>
                                <td class="hide-mobile" style="color: #94a3b8;">#${u.id}</td>
                                <td style="font-weight: bold; color: #f8fafc;">${u.username}</td>
                                <td class="hide-tablet"><span style="background: ${badgeBg}; color: ${badgeColor}; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: bold; text-transform: uppercase;">${u.role}</span></td>
                                <td style="text-align: right;">${acoes}</td>
                            </tr>
                        `;
                    } catch (err) {
                        console.error("Erro ao renderizar linha de usuário:", u, err);
                    }
                });
            }
        }
    } catch (error) { console.error("Erro ao carregar dashboard:", error); }
}

// === FUNÇÕES DE AÇÃO ===
async function excluirUsuario(id, username) {
    if (!confirm(`⚠️ Deseja mover '${username}' para a lixeira?`)) return;
    try {
        const response = await fetch(`/api/admin/usuarios/${id}`, { method: 'DELETE' });
        if (response.ok) {
            carregarDadosDashboard(); // Recarrega os dados instantaneamente
        } else {
            alert("Erro ao excluir. Verifique o servidor.");
        }
    } catch (error) { alert("Erro de conexão."); }
}

async function abrirModalRenovacoes() {
    document.getElementById('modal-renovacoes').style.display = 'flex';
    const tbody = document.getElementById('lista-renovacoes');
    tbody.innerHTML = '<tr><td colspan="3" style="text-align: center;">Buscando solicitações...</td></tr>';

    try {
        const res = await fetch('/api/admin/solicitacoes-renovacao');
        const data = await res.json();
        tbody.innerHTML = '';

        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" style="text-align: center; color: #64748b; padding: 20px;">Nenhuma solicitação pendente no radar.</td></tr>';
            return;
        }

        data.forEach(s => {
            tbody.innerHTML += `
                <tr>
                    <td style="font-weight: bold; color: white;">${s.username}</td>
                    <td style="color: #94a3b8;">${s.vencimento}</td>
                    <td style="text-align: right;">
                        <button onclick="confirmarRenovacao(${s.id}, '${s.username}')" class="btn-block" style="background: white; color: black; border: none; padding: 8px 15px; border-radius: 8px; font-weight: bold; cursor: pointer; display: inline-flex; align-items: center; gap: 5px;">
                            <span class="material-symbols-rounded" style="font-size: 18px;">task_alt</span>
                            Confirmar
                        </button>
                    </td>
                </tr>
            `;
        });
    } catch (e) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align: center; color: #ef4444;">Erro ao carregar solicitações.</td></tr>';
    }
}

async function confirmarRenovacao(id, username) {
    if (!confirm(`Confirmar recebimento do PIX de '${username}' e renovar acesso?`)) return;
    
    try {
        const res = await fetch(`/api/admin/confirmar-renovacao/${id}`, { method: 'POST' });
        if (res.ok) {
            alert(`✅ Acesso de '${username}' renovado com sucesso!`);
            abrirModalRenovacoes(); // Recarrega a lista
            carregarDadosDashboard(); // Atualiza contador no fundo
        } else {
            alert("Erro ao confirmar renovação.");
        }
    } catch (e) { alert("Erro de conexão."); }
}

async function carregarConfiguracao() {
    try {
        const response = await fetch('/api/admin/config');
        const config = await response.json();
        if (config) {
            document.getElementById('config-api-url').value = config.api_url || "";
            document.getElementById('config-system-name').value = config.system_name || "";
        }
    } catch (e) { console.error("Erro ao carregar config:", e); }
}

async function salvarConfiguracao() {
    const api_url = document.getElementById('config-api-url').value;
    const system_name = document.getElementById('config-system-name').value;
    
    try {
        const response = await fetch('/api/admin/config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ api_url, system_name })
        });
        if (response.ok) {
            alert("✅ Configurações de endereçamento salvas!");
        }
    } catch (e) { alert("Erro ao salvar config."); }
}

function abrirModalRestaurar() {
    document.getElementById('modal-restaurar').style.display = 'flex';
}

async function executarRestauro() {
    const btn = document.getElementById('btn-confirmar-restauro');
    const status = document.getElementById('status-restauro');
    
    btn.disabled = true;
    btn.innerText = "Restaurando...";
    status.style.display = 'block';
    
    try {
        const response = await fetch('/api/admin/restaurar-backup', { method: 'POST' });
        const result = await response.json();
        
        if (response.ok && result.status === 'sucesso') {
            alert("✅ " + result.mensagem);
            location.reload(); // Recarrega para ver os dados novos
        } else {
            alert("⚠️ " + (result.mensagem || result.detail || "Erro no restauro."));
            if (result.aviso) console.warn(result.aviso);
        }
    } catch (e) {
        alert("Erro crítico ao tentar restaurar. Verifique o console.");
        console.error(e);
    } finally {
        btn.disabled = false;
        btn.innerText = "Iniciar Restauração";
        status.style.display = 'none';
        document.getElementById('modal-restaurar').style.display = 'none';
    }
}

async function bloquearUsuario(id, username) {
    if (!confirm(`⚠️ Deseja alterar o status de bloqueio de '${username}'?`)) return;
    try {
        const response = await fetch(`/api/admin/bloquear/${id}`, { method: 'POST' });
        if (response.ok) {
            alert(`✅ Status de '${username}' alterado com sucesso!`);
            carregarDadosDashboard();
        } else {
            alert("Erro: A rota de bloqueio não foi encontrada no motor Python.");
        }
    } catch (error) { alert("Erro de conexão."); }
}
atualizarMonitoramento();


async function fazerBackupManual() {
    if(!confirm("Deseja iniciar o backup manual para o Google Drive agora?")) return;
    try {
        const res = await fetch('/api/admin/backup-manual', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'}
        });
        const data = await res.json();
        if(res.ok) {
            alert("✅ " + data.mensagem);
        } else {
            alert("❌ Erro: " + data.detail);
        }
    } catch(err) {
        alert("Erro ao conectar com o servidor.");
    }
}


// === LÓGICA DO MODAL DE EDIÇÃO ===

async function abrirModalEdicao(id) {
    try {
        const response = await fetch(`/api/admin/usuarios/${id}?v=${Date.now()}`);
        if (!response.ok) throw new Error("Não foi possível carregar os dados do usuário.");
        
        const user = await response.json();
        
        document.getElementById('editUserId').value = user.id;
        document.getElementById('editNome').value = user.nome || '';
        document.getElementById('editEmail').value = user.email || '';
        document.getElementById('editWhatsapp').value = user.whatsapp || '';
        document.getElementById('editObservacoes').value = user.observacoes || '';
        document.getElementById('editValorVenda').value = user.valor_venda || 0;
        
        if (user.vencimento && user.vencimento !== 'Sem data' && user.vencimento !== 'None') {
            document.getElementById('editVencimento').value = user.vencimento;
        } else {
            document.getElementById('editVencimento').value = '';
        }
        
        document.getElementById('editStatus').value = user.status === 'bloqueado' ? 'bloqueado' : 'ativo';
        document.getElementById('editPremium').checked = user.is_premium === true;
        
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
        document.getElementById('modalEdicaoUsuario').style.display = 'none';
    }, 300);
}

async function salvarEdicaoUsuario(event) {
    event.preventDefault();
    const id = document.getElementById('editUserId').value;
    const nome = document.getElementById('editNome').value.trim();
    const email = document.getElementById('editEmail').value.trim();
    const whatsapp = document.getElementById('editWhatsapp').value.trim();
    const observacoes = document.getElementById('editObservacoes').value.trim();
    const vencimento = document.getElementById('editVencimento').value;
    const status = document.getElementById('editStatus').value;
    const isPremium = document.getElementById('editPremium').checked;
    const valorVendaRaw = document.getElementById('editValorVenda').value;
    
    let valorVendaFinal = 0;
    if (valorVendaRaw) {
        valorVendaFinal = parseFloat(String(valorVendaRaw).replace(',', '.'));
    }

    const payload = {
        nome_completo: nome || null,
        email: email || null,
        whatsapp: whatsapp || null,
        observacoes: observacoes || null,
        vencimento: vencimento || null,
        status: status,
        is_premium: isPremium,
        valor_venda: isNaN(valorVendaFinal) ? 0 : valorVendaFinal
    };
    
    try {
        const response = await fetch(`/api/admin/usuarios/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        if (response.ok) {
            alert("✅ Perfeito! Alterações salvas com sucesso.");
            fecharModalEdicao();
            carregarDadosDashboard(); 
        } else {
            const resData = await response.json();
            alert("❌ O servidor recusou a alteração: " + (resData.detail || "Verifique os dados."));
        }
    } catch (e) {
        alert("🚨 Erro crítico: O motor do sistema não respondeu.");
    }
}

async function toggleBloqueio(id, username) {
    try {
        const response = await fetch(`/api/admin/bloquear/${id}`, { method: 'POST' });
        if (response.ok) {
            carregarDadosDashboard();
        } else {
            const result = await response.json();
            alert("Erro: " + (result.detail || "Falha ao mudar status."));
        }
    } catch (error) { alert("Erro de conexão."); }
}

async function renovarCliente(id, vencimentoAtual) {
    try {
        let dataBase = new Date();
        if (vencimentoAtual && vencimentoAtual !== 'Sem data' && vencimentoAtual !== 'None') {
            const dataVenc = new Date(vencimentoAtual + 'T12:00:00');
            if (dataVenc > dataBase) {
                dataBase = dataVenc;
            }
        }
        dataBase.setDate(dataBase.getDate() + 30);
        const novaData = dataBase.toISOString().split('T')[0];
        
        if (!confirm(`Deseja renovar o acesso por mais 30 dias?\nNova data: ${novaData}`)) return;

        const response = await fetch(`/api/admin/usuarios/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ vencimento: novaData })
        });

        if (response.ok) {
            alert(`✅ Renovado com sucesso até ${novaData}!`);
            carregarDadosDashboard();
        } else {
            alert("Erro ao renovar cliente.");
        }
    } catch (err) {
        alert("Erro ao processar renovação.");
    }
}
