import psycopg2

# Suas configurações de conexão
DB_CONFIG = {
    "dbname": "TN_INFO_DATABASE", 
    "user": "postgres",           
    "password": "admin123", 
    "host": "127.0.0.1",
    "port": 5433
}

def resetar_tabela():
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()
        
        # O comando que deleta a tabela antiga para limpar os erros
        cur.execute("DROP TABLE IF EXISTS cartoes;")
        
        conn.commit()
        print("✅ SUCESSO: Tabela 'cartoes' removida com sucesso!")
        print("🚀 Agora você pode rodar o 'main.py' para criar a nova estrutura.")
        
        cur.close()
        conn.close()
    except Exception as e:
        print(f"❌ ERRO: Não consegui conectar ao banco: {e}")

if __name__ == "__main__":
    resetar_tabela()