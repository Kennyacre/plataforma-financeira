import pg8000
import os
from dotenv import load_dotenv

load_dotenv()

def fix_users():
    user = os.getenv("POSTGRES_USER", "postgres")
    password = os.getenv("POSTGRES_PASSWORD", "451630")
    host = os.getenv("POSTGRES_HOST", "localhost")
    port = int(os.getenv("POSTGRES_PORT", 5432))
    dbname = os.getenv("POSTGRES_DB", "TN_INFO_DATABASE")

    try:
        conn = pg8000.connect(user=user, password=password, host=host, port=port, database=dbname)
        conn.autocommit = True
        cur = conn.cursor()

        print("🔧 Corrigindo status dos usuários...")
        
        # 1. Garante que ninguém está marcado como deletado injustamente
        cur.execute("UPDATE usuarios SET deletado = FALSE WHERE deletado IS NULL")
        
        # 2. Garante que todos tenham um cargo (role) válido para o painel contar
        cur.execute("UPDATE usuarios SET role = 'cliente' WHERE role IS NULL OR role = ''")
        
        # 3. Garante que o status esteja 'ativo'
        cur.execute("UPDATE usuarios SET status = 'ativo' WHERE status IS NULL OR status = ''")

        # 4. Verifica quantos temos agora
        cur.execute("SELECT COUNT(*) FROM usuarios WHERE role = 'cliente'")
        total = cur.fetchone()[0]
        
        print(f"✅ Sucesso! Agora existem {total} clientes ativos no sistema.")
        conn.close()
    except Exception as e:
        print(f"❌ Erro ao corrigir: {e}")

if __name__ == "__main__":
    fix_users()
