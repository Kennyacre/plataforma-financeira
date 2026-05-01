// cliente/js/perfil.js
const user = localStorage.getItem('usuarioLogado');

document.addEventListener('DOMContentLoaded', async () => {
    if (typeof inicializarSidebar === 'function') inicializarSidebar();

    const elNomeSidebar = document.getElementById('nome-cliente-sidebar');
    const elAvatarSidebar = document.getElementById('user-avatar');
    if (elNomeSidebar) elNomeSidebar.innerText = user.toUpperCase();
    if (elAvatarSidebar) elAvatarSidebar.innerText = user.substring(0, 2).toUpperCase();

    await carregarDadosPerfil();

    const btnSalvar = document.querySelector('.btn-login');
    if (btnSalvar) {
        btnSalvar.addEventListener('click', salvarPerfil);
    }
});

async function carregarDadosPerfil() {
    try {
        const res = await fetch(`/api/usuarios/perfil/${user}`);
        if (res.ok) {
            const data = await res.json();

            if (document.getElementById('display-id')) {
                document.getElementById('display-id').innerText = `#${data.id || '--'}`;
            }
            if (document.getElementById('perfil-nome')) {
                document.getElementById('perfil-nome').value = data.nome_completo || '';
            }
            if (document.getElementById('perfil-email')) {
                document.getElementById('perfil-email').value = data.email || '';
            }

            if (data.nome_completo && document.getElementById('nome-cliente-sidebar')) {
                document.getElementById('nome-cliente-sidebar').innerText = data.nome_completo.toUpperCase();
            }
        }
    } catch (e) {
        console.error("Erro ao carregar dados do perfil:", e);
    }
}

async function salvarPerfil() {
    const nome = document.getElementById('perfil-nome').value;
    const email = document.getElementById('perfil-email') ? document.getElementById('perfil-email').value : null;
    const btn = document.querySelector('.btn-login');
    const originalText = btn.innerText;

    btn.disabled = true;
    btn.innerText = 'Salvando...';

    try {
        const res = await fetch(`/api/usuarios/perfil/${user}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: user,
                nome_completo: nome,
                email: email
            })
        });

        if (res.ok) {
            alert("✅ Perfil atualizado com sucesso!");
            location.reload();
        } else {
            const err = await res.json();
            alert("❌ Erro ao salvar: " + err.detail);
        }
    } catch (e) {
        alert("Erro ao conectar com o servidor.");
    } finally {
        btn.disabled = false;
        btn.innerText = originalText;
    }
}
