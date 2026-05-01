// revenda/js/lixeira.js
const user = localStorage.getItem('usuarioLogado');

document.addEventListener('DOMContentLoaded', () => {
    // 1. Inicializa o Guarda da Nave e Sidebar
    if (typeof inicializarSidebar === 'function') inicializarSidebar();
    
    document.getElementById('nome-revendedor-sidebar').innerText = user.toUpperCase();

    // 2. Aciona o radar de descarte
    carregarLixeira();
});

async function carregarLixeira() {
    try {
        const response = await fetch(`/api/revenda/lixeira/${user}`);
        const data = await response.json();
        const tbody = document.getElementById('lista-lixeira');
        tbody.innerHTML = '';

        if (data.status === 'sucesso') {
            if (!data.clientes || data.clientes.length === 0) {
                // Estado Vazio Premium usando as classes do seu lixeira.css
                tbody.innerHTML = `
                    <tr>
                        <td colspan="2" class="empty-trash-card" style="border: none;">
                            <div class="empty-state">
                                <span class="material-symbols-rounded">delete_sweep</span>
                                <h3>Lixeira Vazia</h3>
                                <p>Nenhum cliente no setor de descarte no momento.</p>
                            </div>
                        </td>
                    </tr>
                `;
                return;
            }

            data.clientes.forEach(c => {
                tbody.innerHTML += `
                    <tr>
                        <td style="font-weight: bold; color: #f8fafc; font-size: 15px;">${c.username}</td>
                        <td class="actions">
                            <button class="btn-restore" onclick="restaurar('${c.username}')" style="background: rgba(16, 185, 129, 0.1); color: #10b981; border: 1px solid rgba(16,185,129,0.2); padding: 8px 15px; border-radius: 8px; cursor: pointer; transition: 0.3s; font-weight: 600; display: flex; align-items: center; gap: 5px;">
                                <span class="material-symbols-rounded" style="font-size: 18px;">restore_from_trash</span> Restaurar
                            </button>
                            <button class="btn-perm-delete" onclick="apagarPermanente('${c.username}')" title="Apagar Permanente" style="background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid rgba(239,68,68,0.2); padding: 8px; border-radius: 8px; cursor: pointer; transition: 0.3s; display: flex; align-items: center; justify-content: center;">
                                <span class="material-symbols-rounded" style="font-size: 18px;">delete_forever</span>
                            </button>
                        </td>
                    </tr>
                `;
            });
        }
    } catch(e) { 
        console.error("Erro no radar da lixeira", e); 
        document.getElementById('lista-lixeira').innerHTML = '<tr><td colspan="2" style="text-align: center; color: #ef4444;">Falha de comunicação com o servidor.</td></tr>';
    }
}

async function restaurar(cliente) {
    if(!confirm(`Deseja restaurar o cliente '${cliente}' e devolver o seu acesso?`)) return;
    
    try {
        const response = await fetch(`/api/revenda/restaurar-cliente/${user}/${cliente}`, { method: 'POST' });
        if (response.ok) {
            alert(`✅ Cliente '${cliente}' restaurado com sucesso!`);
            carregarLixeira(); // Atualiza a tabela na hora
        } else {
            alert("❌ Erro ao tentar restaurar o utilizador.");
        }
    } catch(e) { alert("Erro de conexão com o servidor."); }
}

async function apagarPermanente(cliente) {
    if(!confirm(`⚠️ ALERTA VERMELHO: Deseja apagar '${cliente}' PERMANENTEMENTE? Esta ação destruirá todos os dados financeiros deste cliente e não tem volta!`)) return;
    
    try {
        const response = await fetch(`/api/revenda/excluir-permanente/${user}/${cliente}`, { method: 'DELETE' });
        if (response.ok) {
            alert(`🔥 Cliente '${cliente}' desintegrado com sucesso.`);
            carregarLixeira(); // Atualiza a tabela na hora
        } else {
            alert("❌ Erro ao tentar excluir permanentemente.");
        }
    } catch(e) { alert("Erro de conexão com o servidor."); }
}