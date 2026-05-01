// Carrega os dados salvos quando abre a página
document.addEventListener("DOMContentLoaded", () => {
    const nomeSalvo = localStorage.getItem("tn_nome_usuario") || "Comandante";
    const avatarSalvo = localStorage.getItem("tn_avatar_iniciais") || "AD";

    document.getElementById("nomeUsuario").value = nomeSalvo;
    document.getElementById("iniciaisAvatar").value = avatarSalvo;
});

// Salva os dados quando envia o formulário
document.getElementById('configForm').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const novoNome = document.getElementById('nomeUsuario').value;
    const novoAvatar = document.getElementById('iniciaisAvatar').value.toUpperCase();

    // Salva na "memória" do navegador
    localStorage.setItem("tn_nome_usuario", novoNome);
    localStorage.setItem("tn_avatar_iniciais", novoAvatar);

    alert("✅ Configurações salvas com sucesso! As alterações já estão aplicadas.");
});