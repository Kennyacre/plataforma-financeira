const loginAtivo = localStorage.getItem('usuario_login');

async function carregarFaturas() {
    if (!loginAtivo) {
        window.location.href = 'index.html';
        return;
    }

    try {
        const response = await fetch(`/api/faturas/${loginAtivo}`); 
        const faturas = await response.json();
        const tbody = document.getElementById('tabela-faturas');
        tbody.innerHTML = ''; 

        faturas.forEach(f => {
            const isPago = f.status.toLowerCase() === 'pago';
            tbody.innerHTML += `
                <tr>
                    <td>${f.descricao}</td>
                    <td>${new Date(f.vencimento).toLocaleDateString('pt-BR')}</td>
                    <td>R$ ${f.valor.toFixed(2).replace('.', ',')}</td>
                    <td><span class="${isPago ? 'badge-pago' : 'badge-pendente'}">${f.status}</span></td>
                    <td>
                        ${isPago 
                            ? `<button class="btn-recibo" onclick="alert('Gerando PDF...')">Ver Recibo</button>` 
                            : `<button class="btn-pay" onclick="abrirModalPix(${f.id}, ${f.valor})">Pagar Agora</button>`
                        }
                    </td>
                </tr>
            `;
        });
    } catch (error) {
        console.error("Erro ao carregar faturas:", error);
    }
}