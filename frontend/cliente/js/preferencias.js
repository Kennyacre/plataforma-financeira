// cliente/js/preferencias.js
const user = localStorage.getItem('usuarioLogado');

document.addEventListener('DOMContentLoaded', () => {
    // 1. Sidebar e Infos
    const elNome = document.getElementById('nome-cliente-sidebar');
    const elAvatar = document.getElementById('user-avatar');
    if (elNome) elNome.innerText = user.toUpperCase();
    if (elAvatar) elAvatar.innerText = user.substring(0, 2).toUpperCase();

    // 2. Carregar dados
    carregarCategorias();
    carregarFormasPagamento();
});

// --- CATEGORIAS ---

async function carregarCategorias() {
    const list = document.getElementById('lista-categorias');
    list.innerHTML = '<p style="color: #94a3b8;">Carregando...</p>';

    try {
        const res = await fetch(`/api/categorias/${user}`);
        const data = await res.json();

        if (data.status === 'sucesso') {
            if (data.dados.length === 0) {
                list.innerHTML = '<p style="color: #94a3b8; font-size: 13px;">Nenhuma categoria personalizada.</p>';
                return;
            }

            list.innerHTML = data.dados.map(cat => `
                <div class="item-card">
                    <div class="item-info">
                        <span class="item-name">${cat.nome}</span>
                        <span class="item-badge badge-${cat.tipo}">${cat.tipo === 'gasto' ? 'Despesa' : 'Receita'}</span>
                    </div>
                    <button class="btn-delete-item" onclick="deletarCategoria(${cat.id})">
                        <span class="material-symbols-rounded">delete</span>
                    </button>
                </div>
            `).join('');
        }
    } catch (err) {
        list.innerHTML = '<p style="color: #ef4444;">Erro ao carregar categorias.</p>';
    }
}

async function adicionarCategoria() {
    const nome = document.getElementById('nova-cat-nome').value.trim();
    const tipo = document.getElementById('nova-cat-tipo').value;

    if (!nome) return alert("Digite o nome da categoria!");

    try {
        const res = await fetch('/api/categorias', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: user, nome, tipo, cor: '#3b82f6' })
        });
        const data = await res.json();

        if (data.status === 'sucesso') {
            document.getElementById('nova-cat-nome').value = '';
            carregarCategorias();
        }
    } catch (err) {
        alert("Erro ao salvar categoria.");
    }
}

async function deletarCategoria(id) {
    if (!confirm("Tem certeza que deseja excluir esta categoria?")) return;

    try {
        await fetch(`/api/categorias/${id}`, { method: 'DELETE' });
        carregarCategorias();
    } catch (err) {
        alert("Erro ao excluir.");
    }
}

// --- FORMAS DE PAGAMENTO ---

async function carregarFormasPagamento() {
    const list = document.getElementById('lista-formas-pagamento');
    list.innerHTML = '<p style="color: #94a3b8;">Carregando...</p>';

    try {
        const res = await fetch(`/api/formas-pagamento/${user}`);
        const data = await res.json();

        if (data.status === 'sucesso') {
            if (data.dados.length === 0) {
                list.innerHTML = '<p style="color: #94a3b8; font-size: 13px;">Nenhuma forma de pagamento personalizada.</p>';
                return;
            }

            list.innerHTML = data.dados.map(forma => `
                <div class="item-card">
                    <div class="item-info">
                        <span class="item-name">${forma.nome}</span>
                    </div>
                    <button class="btn-delete-item" onclick="deletarFormaPagamento(${forma.id})">
                        <span class="material-symbols-rounded">delete</span>
                    </button>
                </div>
            `).join('');
        }
    } catch (err) {
        list.innerHTML = '<p style="color: #ef4444;">Erro ao carregar formas de pagamento.</p>';
    }
}

async function adicionarFormaPagamento() {
    const nome = document.getElementById('nova-forma-nome').value.trim();

    if (!nome) return alert("Digite o nome da forma de pagamento!");

    try {
        const res = await fetch('/api/formas-pagamento', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: user, nome })
        });
        const data = await res.json();

        if (data.status === 'sucesso') {
            document.getElementById('nova-forma-nome').value = '';
            carregarFormasPagamento();
        }
    } catch (err) {
        alert("Erro ao salvar.");
    }
}

async function deletarFormaPagamento(id) {
    if (!confirm("Excluir esta forma de pagamento?")) return;

    try {
        await fetch(`/api/formas-pagamento/${id}`, { method: 'DELETE' });
        carregarFormasPagamento();
    } catch (err) {
        alert("Erro ao excluir.");
    }
}