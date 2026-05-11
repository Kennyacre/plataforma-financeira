from core.database import get_db_connection

def detail_audit():
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        print("--- DETALHES MES 4 (ABRIL) ---")
        cur.execute("""
            SELECT id, username, tipo, descricao, valor, data 
            FROM financas 
            WHERE EXTRACT(MONTH FROM data) = 4 AND EXTRACT(YEAR FROM data) = 2026
            ORDER BY data
        """)
        rows = cur.fetchall()
        for r in rows:
            print(f"ID: {r[0]} | User: {r[1]} | Tipo: {r[2]} | Desc: {r[3]} | Valor: {r[4]} | Data: {r[5]}")

        print("\n--- DETALHES MES 5 (MAIO) ---")
        cur.execute("""
            SELECT id, username, tipo, descricao, valor, data 
            FROM financas 
            WHERE EXTRACT(MONTH FROM data) = 5 AND EXTRACT(YEAR FROM data) = 2026
            ORDER BY data
        """)
        rows = cur.fetchall()
        for r in rows:
            print(f"ID: {r[0]} | User: {r[1]} | Tipo: {r[2]} | Desc: {r[3]} | Valor: {r[4]} | Data: {r[5]}")
            
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    detail_audit()
