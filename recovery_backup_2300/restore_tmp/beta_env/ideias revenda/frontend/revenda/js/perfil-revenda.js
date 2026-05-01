// revenda/js/perfil-revenda.js
const user = localStorage.getItem('usuarioLogado');

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Inicializa o Guarda da Nave e Sidebar
    if (typeof inicializarSidebar === 'function') inicializarSidebar();
    
    document.getElementById('nome-revendedor-sidebar').innerText = user.toUpperCase();

    // 2. Busca as informações atuais do perfil
    try {
        const res = await fetch(`/api/revenda/perfil/${user}`);
        if(res.ok) {
            const data = await res.json();
            document.getElementById('info-user').innerText = data.username || user;
            document.getElementById('info-role').innerText = data.role || 'Revenda';
            
            // Preenche os inputs se ele já tiver um PIX cadastrado
            document.getElementById('pix-chave').value = data.pix_chave || '';
            document.getElementById('pix-titular').value = data.pix_titular || '';
        }
    } catch(e) {
        console.error("Erro ao carregar os dados do quartel-general", e);
    }

    // 3. Interceta a ação de Salvar o PIX
    document.getElementById('form-pix').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const chave = document.getElementById('pix-chave').value;
        const titular = document.getElementById('pix-titular').value;

        const btn = document.querySelector('.btn-rev-pix');
        const txtOriginal = btn.innerHTML;
        btn.innerHTML = '<span class="material-symbols-rounded">sync</span> Guardando...';
        btn.disabled = true;

        try {
            const res = await fetch('/api/revenda/atualizar-pix', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ username: user, pix_chave: chave, pix_titular: titular })
            });
            const result = await res.json();
            
            if(res.ok) {
                alert("✅ Chave PIX atualizada! Os seus clientes já podem vê-la no painel deles.");
            } else {
                alert("❌ Erro: " + (result.detail || "Não foi possível guardar."));
            }
        } catch (error) {
            alert("🚨 Erro de conexão com o banco de dados.");
        } finally {
            btn.innerHTML = txtOriginal;
            btn.disabled = false;
        }
    });
});