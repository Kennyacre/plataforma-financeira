from core.database import get_db_connection

def audit_usuarios():
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        print("--- AUDITORIA USUARIOS (VENCIMENTOS) ---")
        cur.execute("""
            SELECT id, username, vencimento, status 
            FROM usuarios 
            WHERE vencimento IS NOT NULL
            ORDER BY vencimento
        """)
        rows = cur.fetchall()
        for r in rows:
            print(f"ID: {r[0]} | User: {r[1]} | Vencimento: {r[2]} | Status: {r[3]}")
            
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    audit_usuarios()
