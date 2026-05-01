import psycopg2

# Nossas credenciais de sempre
DB_CONFIG = {
    "dbname": "TN_INFO_DATABASE", 
    "user": "postgres",           
    "password": "admin123", 
    "host": "127.0.0.1",
    "port": 5433
}

try:
    print("🔌 Conectando ao banco de dados...")
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()

    print("🏗️ Criando a tabela de usuários...")
    # Cria a tabela definindo que o "role" (papel) vai dizer se é revenda ou cliente
    cur.execute("""
        CREATE TABLE IF NOT EXISTS usuarios (
            id SERIAL PRIMARY KEY,
            username VARCHAR(50) UNIQUE NOT NULL,
            password VARCHAR(50) NOT NULL,
            role VARCHAR(20) NOT NULL
        )
    """)

    print("👑 Inserindo conta REVENDA (admin)...")
    cur.execute("""
        INSERT INTO usuarios (username, password, role) 
        VALUES ('admin', 'admin', 'revenda') 
        ON CONFLICT (username) DO NOTHING
    """)

    print("👤 Inserindo conta CLIENTE (cliente1)...")
    cur.execute("""
        INSERT INTO usuarios (username, password, role) 
        VALUES ('cliente1', 'senha123', 'cliente') 
        ON CONFLICT (username) DO NOTHING
    """)

    # Salva as mudanças e fecha a porta
    conn.commit()
    cur.close()
    conn.close()
    print("✅ Operação concluída com sucesso! Os usuários foram criados.")

except Exception as e:
    print(f"❌ Erro de comunicação: {e}")
