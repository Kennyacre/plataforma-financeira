import psycopg2
from config import DB_CONFIG

conn = psycopg2.connect(**DB_CONFIG)
cur = conn.cursor()

try:
    cur.execute("ALTER TABLE usuarios ADD COLUMN google_id VARCHAR(255) UNIQUE;")
    conn.commit()
    print("Coluna google_id adicionada com sucesso.")
except psycopg2.errors.DuplicateColumn:
    print("A coluna google_id ja existe.")
except Exception as e:
    print(f"Erro: {e}")
finally:
    cur.close()
    conn.close()
