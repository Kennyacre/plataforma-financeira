from core.database import get_db_connection
import json

def audit_financas():
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        print("Auditando tabela financas...")
        cur.execute("SELECT id, username, tipo, descricao, valor, data FROM financas ORDER BY data DESC LIMIT 20")
        rows = cur.fetchall()
        for r in rows:
            print(f"ID: {r[0]} | User: {r[1]} | Tipo: {r[2]} | Desc: {r[3]} | Valor: {r[4]} | Data: {r[5]}")
            
        print("\nContagem por mes (2026):")
        cur.execute("""
            SELECT EXTRACT(MONTH FROM data) as mes, COUNT(*), SUM(valor) 
            FROM financas 
            WHERE EXTRACT(YEAR FROM data) = 2026 
            GROUP BY 1 ORDER BY 1
        """)
        stats = cur.fetchall()
        for s in stats:
            print(f"Mes: {int(s[0])} | Qtd: {s[1]} | Total: R$ {float(s[2]):.2f}")
            
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    audit_financas()
