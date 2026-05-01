// js/cadastro.js

document.getElementById('formCadastro').addEventListener('submit', async (e) => {
    e.preventDefault();

    const btn = document.getElementById('btn-submit-cadastro');
    const msg = document.getElementById('mensagemStatus');

    const dados = {
        nome_completo: document.getElementById('nome_completo').value.trim(),
        username: document.getElementById('username').value.toLowerCase().trim(),
        email: document.getElementById('email').value.toLowerCase().trim(),
        password: document.getElementById('password').value,
        id_indicacao: document.getElementById('id_indicacao').value ? parseInt(document.getElementById('id_indicacao').value) : null
    };

    btn.disabled = true;
    btn.innerHTML = 'Processando...';
    msg.style.display = 'none';

    try {
        const response = await fetch('/api/cadastro-manual', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        });

        const result = await response.json();

        if (response.ok) {
            msg.className = 'success-msg';
            msg.style.color = '#10b981';
            msg.innerText = "🚀 Registo concluído! Redirecionando...";
            msg.style.display = 'block';

            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);
        } else {
            console.error("Erro no cadastro:", result);
            msg.className = 'error-msg';
            msg.style.color = '#ef4444';

            let erroTexto = "Erro ao realizar registo.";
            if (result.detail) {
                if (Array.isArray(result.detail)) {
                    erroTexto = result.detail.map(d => `${d.loc[d.loc.length - 1]}: ${d.msg}`).join(" | ");
                } else if (typeof result.detail === 'string') {
                    erroTexto = result.detail;
                }
            }

            msg.innerText = "❌ " + erroTexto;
            msg.style.display = 'block';
            btn.disabled = false;
            btn.innerHTML = 'Concluir Registo <span class="material-symbols-rounded">app_registration</span>';
        }
    } catch (error) {
        msg.innerText = "❌ Erro de conexão com o servidor.";
        msg.style.display = 'block';
        btn.disabled = false;
        btn.innerHTML = 'Concluir Registo <span class="material-symbols-rounded">app_registration</span>';
    }
});
