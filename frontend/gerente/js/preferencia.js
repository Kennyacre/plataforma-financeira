function desenharGraficoPrevisao() {
    const ctx = document.getElementById('forecastChart').getContext('2d');
    
    new Chart(ctx, {
        type: 'bar', // Gráfico de colunas como no PDF
        data: {
            labels: ['2026-03', '2026-04', '2026-05', '2026-06'], // [cite: 70]
            datasets: [
                {
                    label: 'Gasto', // 
                    data: [80, 750, 745, 300], // Valores baseados na altura das barras do PDF
                    backgroundColor: '#ef4444', // Vermelho
                    borderRadius: 5,
                    barThickness: 40
                },
                {
                    label: 'Recebimento', // 
                    data: [0, 0, 0, 0], // Atualmente zerado no PDF
                    backgroundColor: '#10b981', // Verde
                    borderRadius: 5,
                    barThickness: 40
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false } // Usamos nossa legenda customizada no HTML
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 800, // Limite conforme escala do PDF 
                    ticks: { color: '#94a3b8', stepSize: 200 },
                    grid: { color: 'rgba(51, 65, 85, 0.5)' },
                    title: { display: true, text: 'Valor (R$)', color: '#94a3b8' } // [cite: 62]
                },
                x: {
                    ticks: { color: '#94a3b8' },
                    grid: { display: false },
                    title: { display: true, text: 'Mês e Ano', color: '#94a3b8' } // [cite: 70]
                }
            }
        }
    });
}

document.addEventListener('DOMContentLoaded', desenharGraficoPrevisao);