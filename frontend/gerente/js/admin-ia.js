/* 
   admin-ia.js - Assistente Gemini com HITL (Human-in-the-Loop)
   Lógica para o botão flutuante e modal de chat do Admin
*/

document.addEventListener('DOMContentLoaded', () => {
    criarUIStatusIA();
});

function criarUIStatusIA() {
    // 1. Criar o Botão Flutuante
    const btn = document.createElement('div');
    btn.id = 'ia-floating-btn';
    btn.innerHTML = '<span class="material-symbols-rounded">psychology</span>';
    btn.onclick = toggleModalIA;
    document.body.appendChild(btn);

    // 2. Criar o Modal de Chat
    const modal = document.createElement('div');
    modal.id = 'ia-chat-modal';
    modal.innerHTML = `
        <div class="ia-header">
            <div style="display: flex; align-items: center; gap: 10px;">
                <span class="material-symbols-rounded">monitoring</span>
                <strong>Assistente TN INFO</strong>
            </div>
            <button onclick="toggleModalIA()" style="background:none; border:none; color:white; cursor:pointer;">
                <span class="material-symbols-rounded">close</span>
            </button>
        </div>
        <div id="ia-messages" class="ia-messages">
            <div class="msg system">Olá Comandante! Sou o seu Assistente Gemini. Como posso ajudar na gestão da torre hoje?</div>
        </div>
        <div class="ia-input-area">
            <input type="text" id="ia-input" placeholder="Digite sua ordem..." onkeypress="if(event.key==='Enter') enviarIA()">
            <button onclick="enviarIA()"><span class="material-symbols-rounded">send</span></button>
        </div>
    `;
    document.body.appendChild(modal);

    // 3. Estilos Rápidos (Injetados se não houver no CSS)
    const style = document.createElement('style');
    style.innerHTML = `
        #ia-floating-btn {
            position: fixed; bottom: 30px; right: 30px;
            width: 60px; height: 60px; border-radius: 50%;
            background: linear-gradient(135deg, #6366f1, #a855f7);
            color: white; display: flex; align-items: center; justify-content: center;
            cursor: pointer; box-shadow: 0 4px 20px rgba(0,0,0,0.4);
            z-index: 1000; transition: transform 0.3s;
        }
        #ia-floating-btn:hover { transform: scale(1.1) rotate(10deg); }
        #ia-chat-modal {
            position: fixed; bottom: 100px; right: 30px;
            width: 350px; height: 500px; background: #0f172a;
            border-radius: 16px; border: 1px solid rgba(255,255,255,0.1);
            display: none; flex-direction: column; overflow: hidden;
            z-index: 1000; box-shadow: 0 10px 40px rgba(0,0,0,0.5);
        }
        .ia-header { background: #1e293b; padding: 15px; display: flex; justify-content: space-between; align-items: center; color: white; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .ia-messages { flex: 1; padding: 15px; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; color: #cbd5e1; font-size: 14px; }
        .msg { padding: 10px 14px; border-radius: 12px; max-width: 85%; line-height: 1.4; }
        .msg.system { background: #334155; align-self: flex-start; }
        .msg.user { background: #6366f1; color: white; align-self: flex-end; }
        .msg.waiting { background: #475569; border: 1px dashed #94a3b8; align-self: center; text-align: center; width: 100%; cursor: pointer; }
        .msg.waiting:hover { background: #6366f1; }
        .ia-input-area { padding: 10px; background: #1e293b; display: flex; gap: 8px; }
        .ia-input-area input { flex: 1; background: #0f172a; border: 1px solid #334155; border-radius: 8px; padding: 8px 12px; color: white; outline: none; }
        .ia-input-area button { background: #6366f1; border: none; color: white; border-radius: 8px; padding: 8px; cursor: pointer; display: flex; align-items: center; }
    `;
    document.head.appendChild(style);
}

function toggleModalIA() {
    const modal = document.getElementById('ia-chat-modal');
    modal.style.display = modal.style.display === 'flex' ? 'none' : 'flex';
}

async function enviarIA() {
    const input = document.getElementById('ia-input');
    const msg = input.value.trim();
    if (!msg) return;

    addMessage(msg, 'user');
    input.value = '';

    try {
        const res = await fetch('/api/admin/ia-assistente', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mensagem: msg })
        });
        const data = await res.json();

        if (data.status === 'aguardando_autorizacao') {
            addWaitingAction(data);
        } else {
            addMessage(data.resposta, 'system');
        }
    } catch (e) {
        addMessage("Erro ao contactar o comando central Gemini.", 'system');
    }
}

function addMessage(text, type) {
    const box = document.getElementById('ia-messages');
    const div = document.createElement('div');
    div.className = `msg ${type}`;
    div.innerText = text;
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
}

function addWaitingAction(data) {
    const box = document.getElementById('ia-messages');
    const div = document.createElement('div');
    div.className = 'msg waiting';
    div.innerHTML = `
        <p><strong>⚠️ Ação sugerida:</strong> ${data.mensagem_ia}</p>
        <button onclick="confirmarAcaoIA('${data.funcao}', ${JSON.stringify(data.parametros).replace(/"/g, '&quot;')})" style="background: #10b981; color: white; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer; margin-top: 5px;">
            AUTORIZAR AGORA
        </button>
    `;
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
}

async function confirmarAcaoIA(funcao, parametros) {
    addMessage(`Autorizando execução de ${funcao}...`, 'system');

    try {
        const res = await fetch('/api/admin/ia-assistente/confirmar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ funcao, parametros })
        });
        const data = await res.json();

        if (data.status === 'sucesso') {
            addMessage(`✅ Executado: ${data.mensagem}`, 'system');
            // Recarrega a página ou a lista se for necessário ver o efeito (ex: bloqueio)
            if (typeof carregarDashboardAdmin === 'function') carregarDashboardAdmin();
            if (typeof listarUsuarios === 'function') listarUsuarios();
        } else {
            addMessage(`❌ Erro na execução: ${data.detail}`, 'system');
        }
    } catch (e) {
        addMessage("Erro ao confirmar ordem com o satélite.", 'system');
    }
}
