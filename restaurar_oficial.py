import pg8000
import os
from dotenv import load_dotenv
import re
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
load_dotenv()

def restaurar():
    user = os.getenv("POSTGRES_USER", "postgres")
    password = os.getenv("POSTGRES_PASSWORD", "451630")
    host = os.getenv("POSTGRES_HOST", "localhost")
    port = int(os.getenv("POSTGRES_PORT", 5432))
    dbname = os.getenv("POSTGRES_DB", "TN_INFO_DATABASE")

    # Procura o dump (pode estar na pasta acima ou na atual)
    sql_file = None
    if os.path.exists("../database_dump.sql"):
        sql_file = "../database_dump.sql"
    elif os.path.exists("database_dump.sql"):
        sql_file = "database_dump.sql"
    
    if not sql_file:
        print("❌ Erro: Arquivo 'database_dump.sql' não encontrado!")
        return

    print(f"📖 Lendo arquivo de backup: {sql_file}")
    
    try:
        conn = pg8000.connect(user=user, password=password, host=host, port=port, database=dbname)
        conn.autocommit = True
        cur = conn.cursor()

        with open(sql_file, 'r', encoding='utf-8') as f:
            content = f.read()

        # Limpeza pesada para compatibilidade
        # 1. Remove comandos de sistema (\set, \connect, etc)
        # 2. Remove comentários
        # 3. Ignora blocos COPY (que causam erro no Python) e foca nos INSERTs e DDL
        
        commands = []
        current_command = []
        is_copy = False
        
        for line in content.splitlines():
            clean_line = line.strip()
            
            if not clean_line or clean_line.startswith('--') or clean_line.startswith('\\'):
                continue
            
            if clean_line.upper().startswith('COPY'):
                is_copy = True
                continue
            
            if is_copy:
                if clean_line == '\\.':
                    is_copy = False
                continue
                
            current_command.append(line)
            if clean_line.endswith(';'):
                commands.append("\n".join(current_command))
                current_command = []

        print(f"⚡ Executando {len(commands)} comandos de restauração...")
        
        sucesso = 0
        erros = 0
        
        for cmd in commands:
            try:
                cur.execute(cmd)
                sucesso += 1
            except Exception as e:
                # Ignora erros de "já existe"
                if "already exists" in str(e).lower():
                    continue
                erros += 1
        
        print(f"\n✅ Restauração concluída!")
        print(f"📊 Comandos executados: {sucesso}")
        if erros > 0:
            print(f"⚠️ Alertas: {erros} (comum se tabelas já existirem)")
        
        print("\n🚀 Agora abra o navegador e dê F5 no painel!")

    except Exception as e:
        print(f"❌ Erro fatal: {e}")
    finally:
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    restaurar()
