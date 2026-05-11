from core.database import get_db_connection
from datetime import datetime

def check_data():
    conn = get_db_connection()
    cur = conn.cursor()
    
    print("--- USUARIOS COM DADOS FINANCEIROS ---")
    cur.execute("SELECT DISTINCT username FROM financas")
    users = [u[0] for u in cur.fetchall()]
    
    for user in users:
        cur.execute("""
            SELECT SUM(CASE 
                WHEN LOWER(tipo) IN ('recebimento', 'receita') THEN valor 
                WHEN LOWER(tipo) IN ('gasto', 'despesa') THEN -valor 
                ELSE 0 END) 
            FROM financas WHERE username = %s
        """, (user,))
        saldo = cur.fetchone()[0] or 0.0
        
        cur.execute("SELECT COUNT(*) FROM financas WHERE username = %s", (user,))
        total = cur.fetchone()[0]
        
        cur.execute("SELECT MIN(data), MAX(data) FROM financas WHERE username = %s", (user,))
        d_min, d_max = cur.fetchone()
        
        print(f"User: {user} | Saldo: R$ {saldo:.2f} | Total Transacoes: {total} | Periodo: {d_min} ate {d_max}")

    cur.close()
    conn.close()

if __name__ == '__main__':
    check_data()
