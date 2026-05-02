// gerente/js/perfil-admin.js
const user = localStorage.getItem('usuarioLogado');

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Inicializa o Guarda da Nave e Sidebar
    if (typeof inicializarSidebar === 'function') inicializarSidebar();

    const elNome = document.getElementById('nome-admin-sidebar');
    if (elNome) elNome.innerText = user ? user.toUpperCase() : "ADMIN";

    // 2. Carrega os dados atuais do seu Perfil / PIX
    try {
        const res = await fetch(`/api/revenda/perfil/${user}`);
        if (res.ok) {
            const data = await res.json();
            document.getElementById('pix_chave').value = data.pix_chave || "";
            document.getElementById('pix_titular').value = data.pix_titular || "";
        }
    } catch (e) {
        console.error("Erro ao carregar os dados de perfil.", e);
    }

    // 3. Interceta a ação de Salvar
    document.getElementById('form-perfil-admin').addEventListener('submit', async (e) => {
        e.preventDefault();

        const payload = {
            username: user,
            pix_chave: document.getElementById('pix_chave').value,
            pix_titular: document.getElementById('pix_titular').value
        };

        const btn = document.querySelector('.btn-save-pix');
        const txtOriginal = btn.innerHTML;

        btn.innerHTML = '<span class="material-symbols-rounded">sync</span> Atualizando cofre...';
        btn.disabled = true;

        try {
            const res = await fetch('/api/revenda/atualizar-pix', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                alert("✅ Chave PIX e Titular atualizados com sucesso! Os seus revendedores já verão a nova chave.");
            } else {
                alert("❌ Erro ao atualizar o PIX na base de dados.");
            }
        } catch (e) {
            alert("🚨 Erro de comunicação com o servidor.");
        } finally {
            btn.innerHTML = txtOriginal;
            btn.disabled = false;
        }
    });
});

async function alterarSenhaAdmin() {
    const user = localStorage.getItem('usuarioLogado');
    const novaSenha = document.getElementById('admin-nova-senha').value;
    const confirmarSenha = document.getElementById('admin-confirmar-senha').value;

    if (!novaSenha || novaSenha.length < 6) {
        alert("A senha deve ter pelo menos 6 caracteres.");
        return;
    }

    if (novaSenha !== confirmarSenha) {
        alert("As senhas não coincidem.");
        return;
    }

    if (!confirm("Deseja realmente alterar sua senha? Você será desconectado.")) return;

    try {
        const res = await fetch('/api/recuperar-senha/redefinir', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: user,
                nova_senha: novaSenha
            })
        });

        if (res.ok) {
            alert("✅ Senha alterada com sucesso! Faça login novamente.");
            localStorage.clear();
            window.location.href = '../index.html';
        } else {
            const err = await res.json();
            alert("❌ Erro ao alterar senha: " + err.detail);
        }
    } catch (e) {
        alert("Erro de conexão.");
    }
}