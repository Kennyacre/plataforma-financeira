document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const btn = e.target.querySelector('button');
    const textoOriginal = btn.innerHTML; 
    btn.innerText = "PROCESSANDO...";
    
    // Pega exatamente o que foi digitado
    const user = document.getElementById('username').value;
    const pass = document.getElementById('password').value;

    // Monta o pacote no formato exato que o Python quer
    const payload = {
        username: user,
        password: pass
    };

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        // Se a resposta for sucesso (Acesso liberado)
        if (response.ok) {
            window.location.href = 'dashboard.html';
        } else {
            // Se a senha estiver errada
            alert("⚠️ Acesso Negado: Usuário ou senha incorretos!");
            btn.innerHTML = textoOriginal;
        }
        
    } catch (error) {
        console.error("Falha no radar:", error);
        alert("❌ Falha na comunicação com o Motor Python.");
        btn.innerHTML = textoOriginal;
    }
});