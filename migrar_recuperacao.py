import pg8000
import os
from dotenv import load_dotenv
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
load_dotenv()

user = os.getenv("POSTGRES_USER", "postgres")
password = os.getenv("POSTGRES_PASSWORD", "451630")
host = os.getenv("POSTGRES_HOST", "localhost")
port = int(os.getenv("POSTGRES_PORT", 5432))
dbname = os.getenv("POSTGRES_DB", "TN_INFO_DATABASE")

def migrate():
    logging.info(f"Conectando ao banco de dados '{dbname}' para migração...")
    try:
        conn = pg8000.connect(user=user, password=password, host=host, port=port, database=dbname)
        cur = conn.cursor()

        # 1. Adicionar coluna must_change_password na tabela usuarios
        logging.info("Verificando coluna 'must_change_password' em 'usuarios'...")
        cur.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='usuarios' AND column_name='must_change_password'
        """)
        if not cur.fetchone():
            logging.info("Adicionando coluna 'must_change_password'...")
            cur.execute("ALTER TABLE usuarios ADD COLUMN must_change_password BOOLEAN DEFAULT FALSE")
        else:
            logging.info("Coluna 'must_change_password' já existe.")

        # 2. Criar tabela recuperacao_senha
        logging.info("Criando tabela 'recuperacao_senha'...")
        cur.execute("""
            CREATE TABLE IF NOT EXISTS recuperacao_senha (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50),
                status VARCHAR(20) DEFAULT 'pendente',
                data_solicitacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                data_resolucao TIMESTAMP
            )
        """)

        conn.commit()
        logging.info("Migração concluída com sucesso!")

        cur.close()
        conn.close()
    except Exception as e:
        logging.error(f"Erro na migração: {e}")
        raise

if __name__ == "__main__":
    migrate()
