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

def create_database():
    logging.info(f"Conectando ao PostgreSQL em {host}:{port}...")
    try:
        # Conecta ao banco 'postgres' para criar o novo banco
        conn = pg8000.connect(user=user, password=password, host=host, port=port, database='postgres')
        conn.autocommit = True
        cur = conn.cursor()

        # Verifica se já existe
        cur.execute("SELECT datname FROM pg_catalog.pg_database WHERE datname = %s", (dbname,))
        exists = cur.fetchone()

        if not exists:
            logging.info(f"Criando banco de dados '{dbname}'...")
            cur.execute(f'CREATE DATABASE "{dbname}"')
            logging.info("Banco criado com sucesso!")
        else:
            logging.info(f"Banco '{dbname}' já existe.")

        cur.close()
        conn.close()
    except Exception as e:
        logging.error(f"Erro ao criar banco: {e}")
        raise

def create_tables():
    logging.info("Criando tabelas no banco de dados...")
    conn = pg8000.connect(user=user, password=password, host=host, port=port, database=dbname)
    cur = conn.cursor()

    try:
        cur.execute("""
            CREATE TABLE IF NOT EXISTS usuarios (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) UNIQUE,
                password VARCHAR(100),
                email VARCHAR(255),
                role VARCHAR(20),
                creditos INTEGER DEFAULT 0,
                revendedor VARCHAR(50),
                vencimento DATE,
                deletado BOOLEAN DEFAULT FALSE,
                status VARCHAR(20) DEFAULT 'ativo',
                nome_completo VARCHAR(100),
                is_premium BOOLEAN DEFAULT FALSE
            )
        """)

        cur.execute("""
            CREATE TABLE IF NOT EXISTS financas (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50),
                tipo VARCHAR(20),
                descricao VARCHAR(255),
                valor NUMERIC(15, 2),
                data DATE,
                categoria VARCHAR(50),
                pagamento VARCHAR(50),
                status VARCHAR(20) DEFAULT 'pago'
            )
        """)

        cur.execute("""
            CREATE TABLE IF NOT EXISTS solicitacoes_credito (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50),
                quantidade INTEGER,
                status VARCHAR(20) DEFAULT 'Pendente',
                data_solicitacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        cur.execute("""
            CREATE TABLE IF NOT EXISTS pacotes_credito (
                id SERIAL PRIMARY KEY,
                nome VARCHAR(100),
                creditos INTEGER,
                valor NUMERIC(15, 2)
            )
        """)

        cur.execute("""
            CREATE TABLE IF NOT EXISTS cartoes (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50),
                nome_cartao VARCHAR(100),
                dia_fechamento INTEGER,
                limite_total NUMERIC(15, 2),
                fatura_atual NUMERIC(15, 2) DEFAULT 0,
                cor_card VARCHAR(20),
                dia_vencimento INTEGER
            )
        """)

        cur.execute("""
            CREATE TABLE IF NOT EXISTS convites (
                id SERIAL PRIMARY KEY,
                remetente VARCHAR(255),
                destinatario VARCHAR(255),
                status VARCHAR(50) DEFAULT 'pendente'
            )
        """)

        cur.execute("""
            CREATE TABLE IF NOT EXISTS categorias (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50),
                nome VARCHAR(100),
                tipo VARCHAR(20),
                cor VARCHAR(20) DEFAULT '#3b82f6'
            )
        """)

        cur.execute("""
            CREATE TABLE IF NOT EXISTS formas_pagamento (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50),
                nome VARCHAR(100)
            )
        """)

        cur.execute("""
            CREATE TABLE IF NOT EXISTS metas_gastos (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50),
                categoria VARCHAR(100),
                limite NUMERIC(15, 2),
                UNIQUE(username, categoria)
            )
        """)

        # Criar admin padrão
        cur.execute("SELECT username FROM usuarios WHERE username = 'admin'")
        if not cur.fetchone():
            logging.info("Criando usuário admin padrão...")
            cur.execute("INSERT INTO usuarios (username, password, role, status) VALUES ('admin', '451630', 'admin', 'ativo')")

        conn.commit()
        logging.info("Tabelas criadas com sucesso!")

    except Exception as e:
        conn.rollback()
        logging.error(f"Erro ao criar tabelas: {e}")
        raise
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    create_database()
    create_tables()
    print("\n" + "="*55)
    print("  BANCO DE DADOS CONFIGURADO COM SUCESSO!")
    print("="*55)
    print("\n  Agora rode: python main.py")
    print("  Depois acesse: http://localhost:8000")
    print("  Login: admin | Senha: 451630\n")
