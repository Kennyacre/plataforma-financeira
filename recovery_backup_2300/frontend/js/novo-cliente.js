// gerente/js/novo-cliente.js
const user = localStorage.getItem('usuarioLogado');

document.addEventListener('DOMContentLoaded', () => {
    // 1. Inicializa o Guarda da Nave e a Sidebar
    if (typeof inicializarSidebar === 'function') inicializarSidebar();
    
    document.getElementById('nome-admin-sidebar').innerText = user.toUpperCase();

    // 2. Interceta o envio do formulário
    document.getElementById('form-novo-cliente').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const payload = {
            username: document.getElementById('username').value.toLowerCase().trim(),
            password: document.getElementById('password').value,
            dias_acesso: parseInt(document.getElementById('dias_acesso').value)
        };

        // Seleciona o botão usando a nova classe do seu CSS
        const btn = document.querySelector('.btn-activate');
        const originalText = btn.innerHTML;
        
        btn.innerHTML = '<span class="material-symbols-rounded">hourglass_empty</span> Cadastrando...';
        btn.disabled = true;

        try {
            // Comunicação com o Motor Central (API)
            const response = await fetch('/api/admin/novo-cliente', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const resultado = await response.json();

            if (response.ok && resultado.status === 'sucesso') {
                alert('✅ ' + resultado.mensagem);
                document.getElementById('form-novo-cliente').reset();
            } else {
                alert('❌ Erro: ' + (resultado.detail || 'Falha ao processar o registo.'));
            }
        } catch (error) {
            alert('🚨 Erro de conexão com o servidor central!');
            console.error(error);
        } finally {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    });
});