// cliente/js/previsao.js
const user = localStorage.getItem('usuarioLogado');

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Iniciar Segurança e Sidebar
    if (typeof inicializarSidebar === 'function') inicializarSidebar();

    // 2. Preencher dados do crachá
    const elNome = document.getElementById('nome-cliente-sidebar');
    const elAvatar = document.getElementById('user-avatar');
    if(elNome) elNome.innerText = user.toUpperCase();
    if(elAvatar) elAvatar.innerText = user.substring(0,2).toUpperCase();

    // 3. Ligar o Radar
    await carregarPrevisao();
});

async function carregarPrevisao() {
    try {
        const res = await fetch(`/api/chart-data/${user}`);
        const data = await res.json();

        if (data.status === "sucesso") {
            renderizarGrafico(data);
        } else {
            console.warn("Nenhum dado de previsão encontrado.");
        }
    } catch (e) { 
        console.error("Erro ao carregar radar de previsão", e); 
    }
}

function renderizarGrafico(data) {
    const ctx = document.getElementById('forecastChart').getContext('2d');
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.labels,
            datasets: [
                { 
                    label: 'Receitas Previstas', 
                    data: data.receitas, 
                    borderColor: '#10b981', 
                    backgroundColor: 'rgba(16, 185, 129, 0.1)', // Efeito Premium de brilho abaixo da linha
                    borderWidth: 3,
                    tension: 0.4, 
                    fill: true 
                },
                { 
                    label: 'Despesas Previstas', 
                    data: data.despesas, 
                    borderColor: '#ef4444', 
                    backgroundColor: 'rgba(239, 68, 68, 0.1)', 
                    borderWidth: 3,
                    tension: 0.4, 
                    fill: true 
                }
            ]
        },
        options: { 
            responsive: true,
            maintainAspectRatio: false, // Permite que o gráfico ocupe os 400px de altura
            plugins: { 
                legend: { 
                    labels: { color: '#f8fafc', font: { family: "'Inter', sans-serif", size: 13 } } 
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    titleFont: { size: 14, family: "'Inter', sans-serif" },
                    padding: 12,
                    cornerRadius: 8
                }
            },
            interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false
            },
            scales: { 
                y: { 
                    ticks: { color: '#94a3b8' },
                    grid: { color: 'rgba(255,255,255,0.05)' }
                }, 
                x: { 
                    ticks: { color: '#94a3b8' },
                    grid: { display: false }
                } 
            }
        }
    });
}