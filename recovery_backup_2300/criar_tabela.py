import psycopg2

DB_CONFIG = {
    "dbname": "TN_INFO_DATABASE", 
    "user": "postgres",           
    "password": "admin123", 
    "host": "127.0.0.1",
    "port": 5433  # <--- ADICIONE ESTA LINHA AQUI!
}

try:
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()
    
    # O comando que vai criar a tabela de verdade
    cur.execute("""
        CREATE TABLE IF NOT EXISTS financeiro (
            id SERIAL PRIMARY KEY,
            descricao TEXT NOT NULL,
            valor NUMERIC(10,2) NOT NULL,
            tipo TEXT NOT NULL
        );
    """)
    
    conn.commit()
    print("✅ SUCESSO: A tabela 'financeiro' foi criada no PostgreSQL!")
    cur.close()
    conn.close()
except Exception as e:
    print(f"❌ ERRO: {e}")
