const API_URL = '/api/clientes';

async function carregarClientes() {
    const res = await fetch(API_URL);
    const dados = await res.json();
    const corpo = document.getElementById('listaClientes');
    corpo.innerHTML = '';

    dados.forEach(c => {
        corpo.innerHTML += `
            <tr>
                <td>${c.nome}</td>
                <td>${c.email || '-'}</td>
                <td>${c.telefone || '-'}</td>
                <td>${c.empresa || '-'}</td>
                <td style="text-align: center;">
                    <button onclick="deletarCliente(${c.id})" style="background:none; border:none; cursor:pointer;">🗑️</button>
                </td>
            </tr>
        `;
    });
}

async function deletarCliente(id) {
    if(confirm("Excluir este cliente permanentemente?")) {
        await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
        carregarClientes();
    }
}

document.getElementById('clienteForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
        nome: document.getElementById('nome').value,
        email: document.getElementById('email').value,
        telefone: document.getElementById('telefone').value,
        empresa: document.getElementById('empresa').value
    };

    const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (res.ok) {
        document.getElementById('clienteForm').reset();
        carregarClientes();
    }
});

carregarClientes();