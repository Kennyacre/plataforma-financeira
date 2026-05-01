import os
import re

security_tag = '<script src="../js/security.js?v=2"></script>'

def update_html_files():
    count = 0
    for root, dirs, files in os.walk('frontend'):
        for file in files:
            if file.endswith('.html') and file != 'index.html':
                filepath = os.path.join(root, file)
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # Check if security.js is already there
                if 'security.js' not in content:
                    # Insert before </head>
                    new_content = content.replace('</head>', f'    {security_tag}\n</head>')
                    with open(filepath, 'w', encoding='utf-8') as f:
                        f.write(new_content)
                    print(f"Adicionado security.js em: {filepath}")
                    count += 1
    print(f"Total de arquivos atualizados: {count}")

if __name__ == "__main__":
    update_html_files()
 Riverside login, que carrega e trava o sistema.
 Riverside login, que carrega e trava o sistema.
 Riverside login, que carrega e trava o sistema.
 Riverside login, que carrega e trava o sistema.
 Riverside login, que carrega e trava o sistema.
 Riverside login, que carrega e trava o sistema.
 Riverside login, que carrega e trava o sistema.
 Riverside login, que carrega e trava o sistema.
