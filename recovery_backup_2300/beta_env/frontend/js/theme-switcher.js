(function() {
    // 1. Carregar tema salvo ou usar preferência do sistema
    const savedTheme = localStorage.getItem('theme');
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    const themeToApply = savedTheme || systemTheme;

    document.documentElement.setAttribute('data-theme', themeToApply);
})();

document.addEventListener('DOMContentLoaded', () => {
    updateThemeIcon();
});

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);

    updateThemeIcon();
    
    // Opcional: Recarregar gráficos se necessário para ajustar cores de grid
    if (typeof inicializarGraficos === 'function') {
        // Se houver gráficos, podemos destruí-los e recriá-los ou apenas atualizar se as variáveis CSS resolverem
        // Por agora, as variáveis CSS nos canvas cuidam da maior parte
    }
}

function updateThemeIcon() {
    const theme = document.documentElement.getAttribute('data-theme');
    const btn = document.getElementById('theme-toggle-btn');
    if (!btn) return;

    const icon = btn.querySelector('.material-symbols-rounded');
    if (icon) {
        icon.innerText = theme === 'dark' ? 'light_mode' : 'dark_mode';
    }
}
