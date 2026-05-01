import psycopg2

DB_CONFIG = {
    "dbname": "TN_INFO_DATABASE", 
    "user": "postgres",           
    "password": "admin123", 
    "host": "127.0.0.1",
    "port": 5432
}

def inicializar_banco():
    try:
        # Tenta conectar. Se o banco não existir, avise no terminal!
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()
        
        # 1. Tabela de Financeiro (Com a coluna de dono)
        cur.execute("""
            CREATE TABLE IF NOT EXISTS financeiro (
                id SERIAL PRIMARY KEY,
                descricao VARCHAR(255),
                valor NUMERIC(10, 2),
                tipo VARCHAR(50),
                usuario_login VARCHAR(255)
            )
        """)

        # 2. Tabela de Faturas (Com a coluna de dono)
        cur.execute("""
            CREATE TABLE IF NOT EXISTS faturas (
                id SERIAL PRIMARY KEY,
                usuario_login VARCHAR(255),
                descricao VARCHAR(255),
                valor NUMERIC(10, 2),
                vencimento DATE,
                status VARCHAR(50) DEFAULT 'Pendente'
            )
        """)
        
        # Garantia: Se a tabela já existia sem a coluna, adicionamos agora
        cur.execute("ALTER TABLE financeiro ADD COLUMN IF NOT EXISTS usuario_login VARCHAR(255)")
        cur.execute("ALTER TABLE faturas ADD COLUMN IF NOT EXISTS usuario_login VARCHAR(255)")
        
        conn.commit()
        cur.close()
        conn.close()
        print("✅ Tabelas isoladas com sucesso!")
    except Exception as e:
        print(f"❌ ERRO: O Banco TN_INFO_DATABASE existe? Erro: {e}")