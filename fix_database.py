#!/usr/bin/env python3
"""
Script de diagnóstico e correção do banco de dados.
Corrige valores NULL na coluna 'deletado' e verifica integridade dos dados.
"""
import psycopg2
import os

DB_CONFIG = {
    "dbname": "TN_INFO_DATABASE",
    "user": "postgres",
    "password": "admin123",
    "host": "localhost",
    "port": 5433  # porta mapeada no host
}

def main():
    print("=== DIAGNÓSTICO DO BANCO DE DADOS ===\n")
    
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()
        print("✅ Conexão com banco de dados OK!\n")
    except Exception as e:
        print(f"❌ Falha ao conectar: {e}")
        return

    # 1. Verificar usuários
    print("--- USUÁRIOS ---")
    cur.execute("SELECT id, username, role, status, deletado FROM usuarios ORDER BY id")
    users = cur.fetchall()
    for u in users:
        print(f"  ID={u[0]} | user={u[1]} | role={u[2]} | status={u[3]} | deletado={u[4]}")
    
    # 2. Corrigir NULL em deletado
    print("\n--- CORRIGINDO NULL em 'deletado' ---")
    cur.execute("UPDATE usuarios SET deletado = FALSE WHERE deletado IS NULL")
    affected = cur.rowcount
    print(f"  ✅ {affected} usuário(s) corrigido(s) (NULL → FALSE)")
    
    # 3. Verificar lançamentos por usuário
    print("\n--- LANÇAMENTOS POR USUÁRIO ---")
    cur.execute("SELECT username, COUNT(*), MIN(data), MAX(data) FROM financas GROUP BY username ORDER BY username")
    lancamentos = cur.fetchall()
    if lancamentos:
        for l in lancamentos:
            print(f"  {l[0]}: {l[1]} lançamentos | De: {l[2]} | Até: {l[3]}")
    else:
        print("  ❌ NENHUM lançamento encontrado!")
    
    # 4. Verificar cartões
    print("\n--- CARTÕES ---")
    cur.execute("SELECT username, nome_cartao, limite_total, fatura_atual FROM cartoes ORDER BY username")
    cartoes = cur.fetchall()
    if cartoes:
        for c in cartoes:
            print(f"  {c[0]}: {c[1]} | Limite: R${c[2]} | Fatura: R${c[3]}")
    else:
        print("  ❌ NENHUM cartão encontrado!")
    
    # 5. Testar query de login da dudinha
    print("\n--- TESTE DE LOGIN (dudinha) ---")
    cur.execute("""
        SELECT username, password, role, status, deletado
        FROM usuarios 
        WHERE (username = %s OR email = %s) AND deletado IS NOT TRUE
    """, ('dudinha', 'dudinha'))
    user = cur.fetchone()
    if user:
        print(f"  ✅ Usuário encontrado: {user}")
    else:
        print("  ❌ Usuário 'dudinha' NÃO encontrado com deletado IS NOT TRUE!")
        cur.execute("SELECT username, deletado FROM usuarios WHERE username = 'dudinha'")
        raw = cur.fetchone()
        print(f"  Raw: {raw}")
    
    # 6. Testar query de lancamentos da dudinha
    print("\n--- TESTE LANÇAMENTOS (dudinha) ---")
    cur.execute("SELECT COUNT(*) FROM financas WHERE username = 'dudinha'")
    total = cur.fetchone()[0]
    print(f"  Total de lançamentos: {total}")
    
    cur.execute("SELECT tipo, COUNT(*), SUM(valor) FROM financas WHERE username = 'dudinha' GROUP BY tipo")
    for row in cur.fetchall():
        print(f"  {row[0]}: {row[1]} registros | Total: R${row[2]}")
    
    # Commit das correções
    conn.commit()
    print("\n✅ Correções salvas com sucesso!")
    cur.close()
    conn.close()

if __name__ == "__main__":
    main()
