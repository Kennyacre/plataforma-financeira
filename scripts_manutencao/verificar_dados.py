import pg8000
import os
from dotenv import load_dotenv

load_dotenv()

def check():
    user = os.getenv("POSTGRES_USER", "postgres")
    password = os.getenv("POSTGRES_PASSWORD", "451630")
    host = os.getenv("POSTGRES_HOST", "localhost")
    port = int(os.getenv("POSTGRES_PORT", 5432))
    dbname = os.getenv("POSTGRES_DB", "TN_INFO_DATABASE")

    try:
        conn = pg8000.connect(user=user, password=password, host=host, port=port, database=dbname)
        cur = conn.cursor()

        print("\n--- DIAGNÓSTICO DO BANCO ---")
        
        # Total de usuários
        cur.execute("SELECT COUNT(*) FROM usuarios")
        total = cur.fetchone()[0]
        print(f"Total de usuários no banco: {total}")

        # Amostra de usuários
        cur.execute("SELECT id, username, role, deletado FROM usuarios LIMIT 5")
        rows = cur.fetchall()
        print("\nÚltimos 5 usuários encontrados:")
        for r in rows:
            print(f"ID: {r[0]} | User: {r[1]} | Role: {r[2]} | Deletado: {r[3]}")

        # Total de finanças
        cur.execute("SELECT COUNT(*) FROM financas")
        total_f = cur.fetchone()[0]
        print(f"\nTotal de lançamentos financeiros: {total_f}")

        conn.close()
    except Exception as e:
        print(f"Erro ao conectar: {e}")

if __name__ == "__main__":
    check()
