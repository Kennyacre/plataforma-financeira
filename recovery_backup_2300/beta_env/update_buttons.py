import os
import re

frontend_dir = '/DATA/AppData/MTConnect_V2/frontend/cliente'

html_files = [f for f in os.listdir(frontend_dir) if f.endswith('.html')]

top_actions_html = """<div class="top-actions" style="display: flex; gap: 10px; align-items: center; margin-left: auto;">
    <button class="btn-top-action" onclick="forcarAtualizacao()" title="Atualizar App" style="background: rgba(59, 130, 246, 0.1); color: #3b82f6; border: 1px solid rgba(59, 130, 246, 0.2); padding: 8px 12px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 5px; transition: 0.3s; font-weight: 600;">
        <span class="material-symbols-rounded" style="font-size: 20px;">sync</span>
        <span class="action-text">Atualizar</span>
    </button>
    <button class="btn-top-action" onclick="location.href='../index.html'" title="Sair" style="background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.2); padding: 8px 12px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 5px; transition: 0.3s; font-weight: 600;">
        <span class="material-symbols-rounded" style="font-size: 20px;">logout</span>
        <span class="action-text">Sair</span>
    </button>
</div>
"""

# Regex to find sidebar-footer and remove it
sidebar_footer_regex = re.compile(r'<div class="sidebar-footer".*?</div>\s*</div>', re.DOTALL)
# Regex to find </header> and inject before it
top_bar_regex = re.compile(r'(</header>)', re.IGNORECASE)

def update_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    modified = False

    if 'sidebar-footer' in content:
        content = sidebar_footer_regex.sub('</div>', content)
        modified = True

    if 'top-actions' not in content and 'class="top-bar"' in content:
        content = top_bar_regex.sub(top_actions_html + r'\1', content)
        modified = True

    if modified:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {filepath}")

for f in html_files:
    update_file(os.path.join(frontend_dir, f))
