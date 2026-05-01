async function excluirCliente(clienteAlvo) {
            if(!confirm(`⚠️ ATENÇÃO: Deseja realmente excluir o cliente ${clienteAlvo}? Todos os dados financeiros dele serão apagados permanentemente.`)) return;

            try {
                const response = await fetch(`/api/revenda/excluir-cliente/${user}/${clienteAlvo}`, {
                    method: 'DELETE'
                });
                const result = await response.json();

                if (response.ok) {
                    alert("✅ " + result.mensagem);
                    carregarClientes(); // Recarrega a tabela na hora!
                } else {
                    alert("Erro: " + result.detail);
                }
            } catch (error) {
                alert("Erro ao conectar com o motor de exclusão.");
            }
        }
// revenda/js/novo-cliente.js
const user = localStorage.getItem('usuarioLogado');

document.addEventListener('DOMContentLoaded', () => {
    // 1. Inicia o Guarda da Nave e Sidebar
    if (typeof inicializarSidebar === 'function') inicializarSidebar();
    
    document.getElementById('nome-revendedor-sidebar').innerText = user.toUpperCase();

    // 2. Interceta o envio do formulário
    document.getElementById('form-novo-cliente').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const payload = {
            username: document.getElementById('username').value.toLowerCase().trim(),
            password: document.getElementById('password').value,
            dias_acesso: parseInt(document.getElementById('dias_acesso').value),
            revendedor: user, // Identifica de qual parceiro é o cliente
            tipo_conta: document.getElementById('tipo_conta').value // 'teste' ou 'oficial'
        };

        const btn = document.querySelector('.btn-primary');
        const originalText = btn.innerHTML;
        
        btn.innerHTML = '<span class="material-symbols-rounded">hourglass_empty</span> Criando Conta...';
        btn.disabled = true;

        try {
            const response = await fetch('/api/revenda/novo-cliente', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const resultado = await response.json();

            if (response.ok && resultado.status === 'sucesso') {
                // O servidor responderá se descontou crédito ou não!
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