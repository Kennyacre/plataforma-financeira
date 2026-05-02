import pg8000
import logging
import os
from dotenv import load_dotenv

load_dotenv()

DB_CONFIG = {
    "database": os.getenv("POSTGRES_DB", "TN_INFO_DATABASE"),
    "user": os.getenv("POSTGRES_USER", "postgres"),
    "password": os.getenv("POSTGRES_PASSWORD", "451630"),
    "host": os.getenv("POSTGRES_HOST", "localhost"),
    "port": int(os.getenv("POSTGRES_PORT", 5432))
}

def get_db_connection():
    """Retorna uma conexão com a base de dados."""
    return pg8000.connect(**DB_CONFIG)

def check_and_add_column(cur, table, column, definition):
    """Auxiliar para adicionar colunas se não existirem (Soft Migrations)."""
    cur.execute("""
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name=%s AND column_name=%s
    """, (table, column))
    if not cur.fetchone():
        logging.info(f"Adicionando coluna {column} à tabela {table}...")
        cur.execute(f"ALTER TABLE {table} ADD COLUMN {column} {definition}")

def startup_db():
    """Inicializa as tabelas e garante que as colunas necessárias existam."""
    conn = get_db_connection()
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
                nome_completo VARCHAR(100)
            )
        """)
        check_and_add_column(cur, 'usuarios', 'email', 'VARCHAR(255)')
        check_and_add_column(cur, 'usuarios', 'status', "VARCHAR(20) DEFAULT 'ativo'")
        check_and_add_column(cur, 'usuarios', 'deletado', "BOOLEAN DEFAULT FALSE")
        check_and_add_column(cur, 'usuarios', 'nome_completo', "VARCHAR(100)")
        check_and_add_column(cur, 'usuarios', 'is_premium', "BOOLEAN DEFAULT FALSE")
        check_and_add_column(cur, 'usuarios', 'whatsapp', "VARCHAR(255)")
        check_and_add_column(cur, 'usuarios', 'valor_venda', "NUMERIC(15, 2) DEFAULT 0.0")

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
        check_and_add_column(cur, 'financas', 'status', "VARCHAR(20) DEFAULT 'pago'")

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
        check_and_add_column(cur, 'cartoes', 'dia_vencimento', 'INTEGER')

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

        # Criar Admin Padrão se não existir
        cur.execute("SELECT username FROM usuarios WHERE username = 'admin'")
        if not cur.fetchone():
            cur.execute("INSERT INTO usuarios (username, password, role, status) VALUES ('admin', '451630', 'admin', 'ativo')")

        conn.commit()
        logging.info("Base de dados sincronizada com sucesso.")

    except Exception as e:
        conn.rollback()
        logging.error(f"Erro ao inicializar base de dados: {e}")
        raise e
    finally:
        cur.close()
        conn.close()
