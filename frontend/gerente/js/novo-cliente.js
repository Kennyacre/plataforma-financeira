// gerente/js/novo-cliente.js
const user = localStorage.getItem('usuarioLogado');

document.addEventListener('DOMContentLoaded', () => {
    // 1. Inicia o Guarda da Nave e Sidebar
    if (typeof inicializarSidebar === 'function') inicializarSidebar();

    const elNome = document.getElementById('nome-admin-sidebar');
    if (elNome) elNome.innerText = user ? user.toUpperCase() : "ADMIN";

    // 2. Interceta o envio do formulário
    document.getElementById('form-novo-cliente').addEventListener('submit', async (e) => {
        e.preventDefault();

        const payload = {
            username: document.getElementById('username').value.toLowerCase().trim(),
            password: document.getElementById('password').value,
            dias_acesso: parseInt(document.getElementById('dias_acesso').value)
        };

        const btn = document.querySelector('.btn-activate');
        const originalText = btn.innerHTML;

        btn.innerHTML = '<span class="material-symbols-rounded">hourglass_empty</span> Criando Cliente...';
        btn.disabled = true;

        try {
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
                alert('❌ Erro: ' + (resultado.detail || 'Verifique o servidor.'));
            }
        } catch (error) {
            console.error("Erro na rota:", error);
            alert('🚨 Erro crítico de conexão com o motor central!');
        } finally {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    });
});
