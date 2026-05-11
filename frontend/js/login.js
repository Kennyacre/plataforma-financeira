// js/login.js

// ==========================================
// 1. MOTOR DE LOGIN NORMAL (Utilizador e Senha)
// ==========================================
document.getElementById('formLogin').addEventListener('submit', async function (e) {
    e.preventDefault();

    const emailDigitado = document.getElementById('email').value;
    const passDigitada = document.getElementById('password').value;
    const msgErro = document.getElementById('mensagemErro');
    const errorText = document.getElementById('error-text');
    const btn = document.getElementById('btn-submit-login');

    const textoOriginal = btn.innerHTML;
    btn.innerHTML = '<span class="material-symbols-rounded">hourglass_empty</span> <span>Autenticando...</span>';
    btn.disabled = true;
    msgErro.style.display = 'none';

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: emailDigitado.toLowerCase().trim(), password: passDigitada })
        });

        const result = await response.json();

        if (response.ok && result.status === "sucesso") {
            // GRAVA O CRACHÁ COMPLETO NO NAVEGADOR
            localStorage.setItem('usuarioLogado', result.username);
            localStorage.setItem('funcaoUsuario', result.role);

            if (result.must_change_password) {
                window.location.href = 'redefinir-senha.html';
                return;
            }

            const role = result.role.toLowerCase();
            redirecionarPorRole(role);
        } else {
            msgErro.style.display = 'flex';
            if (errorText) {
                errorText.innerText = result.detail || "Utilizador ou senha incorretos!";
            } else {
                msgErro.innerText = result.detail || "Utilizador ou senha incorretos!";
            }
            btn.innerHTML = textoOriginal;
            btn.disabled = false;
        }
    } catch (error) {
        console.error("Erro no motor:", error);
        msgErro.style.display = 'flex';
        if (errorText) {
            errorText.innerText = "Erro ao conectar com o servidor.";
        } else {
            msgErro.innerText = "Erro ao conectar com o servidor.";
        }
        btn.innerHTML = textoOriginal;
        btn.disabled = false;
    }
});

function redirecionarPorRole(role) {
    role = role.toLowerCase();
    if (role === 'admin' || role === 'gerente') {
        window.location.href = 'gerente/painel-admin.html';
    } else if (role === 'revenda') {
        alert("⚠️ O acesso de Revendedor está em manutenção.");
        window.location.reload();
    } else {
        window.location.href = 'cliente/painel-cliente.html';
    }
}
