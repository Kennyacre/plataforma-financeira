import psycopg2
import os
import re
from datetime import datetime

# Configurações do Banco de Dados via Variáveis de Ambiente
DB_CONFIG = {
    "dbname": os.getenv("POSTGRES_DB", "TN_INFO_DATABASE"),
    "user": os.getenv("POSTGRES_USER", "postgres"),
    "password": os.getenv("POSTGRES_PASSWORD", "admin123"),
    "host": os.getenv("POSTGRES_HOST", "db_postgres"),
    "port": int(os.getenv("POSTGRES_PORT", 5432))
}


def clean_val(v):
    return v.strip().replace("'", "") if v else None

def parse_date(d):
    if not d or d == '\\N': return None
    try:
        # Formatos comuns nos backups
        for fmt in ("%Y-%m-%d", "%d/%m/%Y"):
            try: return datetime.strptime(d, fmt).date()
            except: continue
    except: return None
    return None

def import_data():
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()
    
    backup_file = "backup_financeiro_pg.sql"
    if not os.path.exists(backup_file):
        print(f"Erro: Arquivo {backup_file} não encontrado.")
        return

    print(f"Iniciando importação de {backup_file}...")

    with open(backup_file, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Importar Usuários
    in_user_block = False
    with open(backup_file, 'r', encoding='utf-8') as f:
        for line in f:
            if 'COPY public.usuarios' in line:
                in_user_block = True
                continue
            if in_user_block and line.startswith('\\.'):
                in_user_block = False
                continue
            
            if in_user_block:
                parts = line.strip().split('\t')
                if len(parts) >= 10:
                    username = parts[0].strip()
                    password = parts[1].strip()
                    role = 'admin' if parts[2].lower() in ['admin', 'gerente'] else 'cliente'
                    vencimento = parse_date(parts[5].strip())
                    nome = parts[6].strip()
                    email = parts[7].strip()
                    
                    cur.execute("SELECT id FROM usuarios WHERE username = %s", (username,))
                    if not cur.fetchone():
                        print(f"Importando usuário: {username}")
                        cur.execute("""
                            INSERT INTO usuarios (username, password, role, vencimento, nome_completo, email, status)
                            VALUES (%s, %s, %s, %s, %s, %s, 'ativo')
                        """, (username, password, role, vencimento, nome, email))

    # 2. Importar Finanças
    in_fin_block = False
    with open(backup_file, 'r', encoding='utf-8') as f:
        for line in f:
            if 'COPY public.financeiro' in line:
                in_fin_block = True
                continue
            if in_fin_block and line.startswith('\\.'):
                in_fin_block = False
                continue

            if in_fin_block:
                parts = line.strip().split('\t')
                if len(parts) >= 9:
                    username = parts[1].strip()
                    tipo = parts[2].strip().lower()
                    descricao = parts[3].strip()
                    valor = float(parts[4].strip())
                    status = parts[5].strip().lower()
                    data = parse_date(parts[6].strip())
                    categoria = parts[7].strip()
                    pagamento = parts[8].strip()

                    # Normalizar tipo
                    if 'gasto' in tipo or 'despesa' in tipo: tipo = 'gasto'
                    else: tipo = 'recebimento'

                    print(f"Importando lançamento: {descricao} ({username})")
                    cur.execute("""
                        INSERT INTO financas (username, tipo, descricao, valor, data, categoria, pagamento, status)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                    """, (username, tipo, descricao, valor, data, categoria, pagamento, status))



    conn.commit()
    cur.close()
    conn.close()
    print("Importação concluída com sucesso!")

if __name__ == "__main__":
    import_data()
