// gerente/js/novo-revendedor.js
const user = localStorage.getItem('usuarioLogado');

document.addEventListener('DOMContentLoaded', () => {
    // 1. Inicializa o Guarda da Nave e Sidebar
    if (typeof inicializarSidebar === 'function') inicializarSidebar();
    
    document.getElementById('nome-admin-sidebar').innerText = user.toUpperCase();

    // 2. Interceta o envio do formulário de criação
    document.getElementById('form-nova-revenda').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const payload = {
            username: document.getElementById('username').value.toLowerCase().trim(),
            password: document.getElementById('password').value,
            creditos_iniciais: parseInt(document.getElementById('creditos').value)
        };

        // Efeito visual no botão usando a classe premium
        const btn = document.querySelector('.btn-activate');
        const originalText = btn.innerHTML;
        
        btn.innerHTML = '<span class="material-symbols-rounded">hourglass_empty</span> Criando Parceiro...';
        btn.disabled = true;

        try {
            // Comunicação com o servidor para criar o revendedor
            const response = await fetch('/api/admin/novo-revendedor', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const resultado = await response.json();

            if (response.ok && resultado.status === 'sucesso') {
                alert('✅ ' + resultado.mensagem);
                document.getElementById('form-nova-revenda').reset();
            } else {
                alert('❌ Erro: ' + (resultado.detail || 'Verifique o servidor.'));
            }
        } catch (error) {
            alert('🚨 Erro crítico de conexão com o motor central!');
            console.error(error);
        } finally {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    });
});