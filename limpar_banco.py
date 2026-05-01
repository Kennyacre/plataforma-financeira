import pg8000
import os
from dotenv import load_dotenv

load_dotenv()

def limpar_e_preparar():
    user = os.getenv("POSTGRES_USER", "postgres")
    password = os.getenv("POSTGRES_PASSWORD", "451630")
    host = os.getenv("POSTGRES_HOST", "localhost")
    port = int(os.getenv("POSTGRES_PORT", 5432))
    dbname = os.getenv("POSTGRES_DB", "TN_INFO_DATABASE")

    try:
        conn = pg8000.connect(user=user, password=password, host=host, port=port, database=dbname)
        conn.autocommit = True
        cur = conn.cursor()

        print("🗑️  Limpando tabelas atuais para evitar conflitos...")
        # Remove as tabelas para que o PSQL possa criá-las do zero com os dados
        cur.execute("DROP TABLE IF EXISTS usuarios CASCADE")
        cur.execute("DROP TABLE IF EXISTS financas CASCADE")
        cur.execute("DROP TABLE IF EXISTS cartoes CASCADE")
        cur.execute("DROP TABLE IF EXISTS categorias CASCADE")
        cur.execute("DROP TABLE IF EXISTS formas_pagamento CASCADE")
        cur.execute("DROP TABLE IF EXISTS metas_gastos CASCADE")
        cur.execute("DROP TABLE IF EXISTS solicitacoes_credito CASCADE")
        
        print("✅ Tabelas limpas! Agora o banco está pronto para receber o backup completo.")
        conn.close()
    except Exception as e:
        print(f"❌ Erro ao limpar: {e}")

if __name__ == "__main__":
    limpar_e_preparar()
