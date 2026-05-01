import psycopg2

# Nossas credenciais de banco de dados
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

    # 1. DELETA A TABELA ANTIGA PARA LIMPAR TUDO
    print("🧹 Apagando registros antigos...")
    cur.execute("DROP TABLE IF EXISTS usuarios;")

    # 2. RECRIANDO A TABELA DO ZERO
    print("🏗️ Recriando a tabela...")
    cur.execute("""
        CREATE TABLE usuarios (
            id SERIAL PRIMARY KEY,
            username VARCHAR(50) UNIQUE NOT NULL,
            password VARCHAR(50) NOT NULL,
            role VARCHAR(20) NOT NULL
        )
    """)

    # 3. INSERINDO OS 3 USUÁRIOS DE TESTE
    print("👤 Criando 1 Cliente...")
    cur.execute("INSERT INTO usuarios (username, password, role) VALUES ('cliente', '123', 'cliente')")

    print("🤝 Criando 1 Revenda...")
    cur.execute("INSERT INTO usuarios (username, password, role) VALUES ('revenda', '123', 'revenda')")

    print("👑 Criando 1 Gerente...")
    cur.execute("INSERT INTO usuarios (username, password, role) VALUES ('gerente', '123', 'gerente')")

    # Salva e fecha as portas
    conn.commit()
    cur.close()
    conn.close()
    
    print("\n✅ SUCESSO! O Banco de Dados foi resetado.")
    print("🔑 Você já pode testar no site usando as contas abaixo (Senha de todos é '123'):")
    print(" - Usuário: cliente   -> Vai para Painel Cliente")
    print(" - Usuário: revenda   -> Vai para Painel Revenda")
    print(" - Usuário: gerente   -> Vai para Painel Admin")

except Exception as e:
    print(f"❌ Erro ao resetar o banco: {e}")