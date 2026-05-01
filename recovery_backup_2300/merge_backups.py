import psycopg2
import os
import re
from datetime import datetime

DB_CONFIG = {
    "dbname": os.getenv("POSTGRES_DB", "TN_INFO_DATABASE"),
    "user": os.getenv("POSTGRES_USER", "postgres"),
    "password": os.getenv("POSTGRES_PASSWORD", "admin123"),
    "host": os.getenv("POSTGRES_HOST", "db_postgres"),
    "port": int(os.getenv("POSTGRES_PORT", 5432))
}

def parse_date(d):
    if not d or d == '\\N': return None
    try:
        for fmt in ("%Y-%m-%d", "%d/%m/%Y"):
            try: return datetime.strptime(d, fmt).date()
            except: continue
    except: return None
    return None

def import_legacy(cur, filename):
    print(f"Importando LEGACY de {filename}...")
    # Importar Usuários
    in_block = False
    with open(filename, 'r', encoding='utf-8') as f:
        for line in f:
            if 'COPY public.usuarios' in line:
                in_block = True
                continue
            if in_block and line.startswith('\\.'):
                in_block = False
                continue
            if in_block:
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
                        cur.execute("""
                            INSERT INTO usuarios (username, password, role, vencimento, nome_completo, email, status)
                            VALUES (%s, %s, %s, %s, %s, %s, 'ativo')
                        """, (username, password, role, vencimento, nome, email))

    # Importar Finanças (financeiro no legado)
    in_block = False
    with open(filename, 'r', encoding='utf-8') as f:
        for line in f:
            if 'COPY public.financeiro' in line and 'id, usuario, tipo' in line:
                in_block = True
                continue
            if in_block and line.startswith('\\.'):
                in_block = False
                continue
            if in_block:
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

                    if 'gasto' in tipo or 'despesa' in tipo: tipo = 'gasto'
                    else: tipo = 'recebimento'

                    cur.execute("""
                        INSERT INTO financas (username, tipo, descricao, valor, data, categoria, pagamento, status)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                    """, (username, tipo, descricao, valor, data, categoria, pagamento, status))

def import_new(cur, filename):
    print(f"Importando NEW SCHEMA de {filename}...")
    # Importar Usuários
    in_block = False
    with open(filename, 'r', encoding='utf-8') as f:
        for line in f:
            if 'COPY public.usuarios' in line and 'id, username' in line:
                in_block = True
                continue
            if in_block and line.startswith('\\.'):
                in_block = False
                continue
            if in_block:
                parts = line.strip().split('\t')
                if len(parts) >= 11:
                    # id, username, password, email, role, creditos, revendedor, vencimento, deletado, status, nome_completo
                    username = parts[1].strip()
                    password = parts[2].strip()
                    email = parts[3].strip()
                    role = parts[4].strip()
                    creditos = int(parts[5].strip())
                    revendedor = parts[6].strip() if parts[6] != '\\N' else None
                    vencimento = parse_date(parts[7].strip())
                    deletado = parts[8].strip() == 't'
                    status = parts[9].strip()
                    nome = parts[10].strip()

                    cur.execute("SELECT id FROM usuarios WHERE username = %s", (username,))
                    if not cur.fetchone():
                        cur.execute("""
                            INSERT INTO usuarios (username, password, email, role, creditos, revendedor, vencimento, deletado, status, nome_completo)
                            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                        """, (username, password, email, role, creditos, revendedor, vencimento, deletado, status, nome))

    # Importar Finanças
    in_block = False
    with open(filename, 'r', encoding='utf-8') as f:
        for line in f:
            if 'COPY public.financas' in line:
                in_block = True
                continue
            if in_block and line.startswith('\\.'):
                in_block = False
                continue
            if in_block:
                parts = line.strip().split('\t')
                if len(parts) >= 9:
                    # id, username, tipo, descricao, valor, data, categoria, pagamento, status
                    username = parts[1].strip()
                    tipo = parts[2].strip()
                    descricao = parts[3].strip()
                    valor = float(parts[4].strip())
                    data = parse_date(parts[5].strip())
                    categoria = parts[6].strip()
                    pagamento = parts[7].strip()
                    status = parts[8].strip()

                    cur.execute("""
                        INSERT INTO financas (username, tipo, descricao, valor, data, categoria, pagamento, status)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                    """, (username, tipo, descricao, valor, data, categoria, pagamento, status))

def main():
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()
    
    # Limpar atual
    cur.execute("TRUNCATE TABLE financas; TRUNCATE TABLE usuarios CASCADE;")
    conn.commit()

    import_legacy(cur, "beta_env_backup.sql")
    import_new(cur, "backup_production.sql")

    conn.commit()
    cur.close()
    conn.close()
    print("Merge concluído!")

if __name__ == "__main__":
    main()
