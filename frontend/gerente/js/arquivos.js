// gerente/js/arquivos.js - Gerenciador de Arquivos (HDD desativado temporariamente)
let currentPath = "";

document.addEventListener('DOMContentLoaded', () => {
    mostrarMensagemDesativado();
});

function mostrarMensagemDesativado() {
    const listEl = document.getElementById('file-list');
    const bcLinks = document.getElementById('breadcrumb-links');
    if (bcLinks) bcLinks.innerHTML = '<span>Início</span>';
    if (listEl) {
        listEl.innerHTML = `
            <div style="padding: 40px; text-align: center; color: #64748b; grid-column: 1/-1;">
                <span class="material-symbols-rounded" style="font-size: 64px; display: block; margin-bottom: 15px; color: #334155;">hard_drive</span>
                <h3 style="color: #94a3b8; margin-bottom: 10px;">Gerenciador de Arquivos Temporariamente Desativado</h3>
                <p style="font-size: 14px;">Esta função está em manutenção para garantir a estabilidade do sistema.<br>Em breve estará disponível novamente.</p>
            </div>`;
    }
}

function listarArquivos(path) { mostrarMensagemDesativado(); }
function criarPasta() { alert('Função temporariamente desativada.'); }
function executarUpload(input) { alert('Função temporariamente desativada.'); if(input) input.value=''; }
function baixarArquivo(path) { alert('Função temporariamente desativada.'); }
function atualizarBreadcrumb(path) {}
