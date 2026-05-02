from fastapi import APIRouter, HTTPException, Depends
from core.database import get_db_connection
from pydantic import BaseModel
import os
from google import genai
from google.genai import types

from models.schemas import NovoRevendedor, NovoClienteAdmin
from datetime import date, timedelta
import json
import logging
import io
import re
import random
import string

router = APIRouter(prefix="/api/admin", tags=["Admin"])

# 1. Molde de dados para receber a pergunta do painel
class PerguntaIA(BaseModel):
    mensagem: str

# 2. Configuração do Cliente Gemini
CHAVE_API_GEMINI = os.getenv("GEMINI_API_KEY", "AIzaSyAs_FH_m75V8TTfNDRBCK8JZjDA5bQM0lo")
client = genai.Client(api_key=CHAVE_API_GEMINI)

# --- ROTA PARA LISTAR TODOS OS USUÁRIOS (Atualizada com Status) ---
@router.get("/todos-usuarios")
def listar_todos_usuarios():
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        # Puxa todos que não estão na lixeira e INCLUI novas colunas de contato
        cur.execute("""
            SELECT id, username, role, revendedor, vencimento, status, creditos, nome_completo, is_premium, email, whatsapp, valor_venda
            FROM usuarios 
            WHERE deletado IS NOT TRUE AND role != 'revenda'
            ORDER BY id DESC
        """)
        
        usuarios = []
        for r in cur.fetchall():
            usuarios.append({
                "id": r[0], 
                "username": r[1], 
                "role": str(r[2]).upper(), 
                "revendedor": r[3] if r[3] else "Sistema", 
                "vencimento": str(r[4]) if r[4] else "Sem data",
                "status": r[5] if r[5] else "ativo",
                "creditos": r[6] if r[6] else 0,
                "nome": r[7] if r[7] else r[1],
                "is_premium": bool(r[8]) if len(r) > 8 else False,
                "email": r[9] if len(r) > 9 else "",
                "whatsapp": r[10] if len(r) > 10 else "",
                "valor_venda": float(r[11]) if len(r) > 11 and r[11] else 0.0
            })
            
        return {"status": "sucesso", "usuarios": usuarios}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()
        conn.close()

# --- ROTA PARA BUSCAR UM ÚNICO USUÁRIO (NOVA) ---
@router.get("/usuarios/{usuario_id}")
def obter_usuario(usuario_id: int):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("""
            SELECT id, username, email, whatsapp, vencimento, status, is_premium, valor_venda, nome_completo
            FROM usuarios WHERE id = %s
        """, (usuario_id,))
        r = cur.fetchone()
        if not r:
            raise HTTPException(status_code=404, detail="Usuário não encontrado no banco.")
        
        return {
            "id": r[0],
            "username": r[1],
            "email": r[2] if r[2] else "",
            "whatsapp": r[3] if r[3] else "",
            "vencimento": str(r[4]) if r[4] else "",
            "status": r[5],
            "is_premium": bool(r[6]),
            "valor_venda": float(r[7] or 0.0),
            "nome": r[8] if r[8] else r[1]
        }
    finally:
        cur.close(); conn.close()

@router.post("/novo-revendedor")
def criar_revendedor(dados: NovoRevendedor):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        # Verifica se já existe
        cur.execute("SELECT id FROM usuarios WHERE username = %s", (dados.username,))
        if cur.fetchone():
            raise HTTPException(status_code=400, detail="Este nome de utilizador já está em uso. Verifique a lixeira se necessário.")

        cur.execute("""
            INSERT INTO usuarios (username, password, role, creditos, status, deletado) 
            VALUES (%s, %s, 'revenda', %s, 'ativo', FALSE)
        """, (dados.username, dados.password, dados.creditos_iniciais))
        conn.commit()
        return {"status": "sucesso", "mensagem": f"Revendedor {dados.username} criado com {dados.creditos_iniciais} créditos!"}
    except HTTPException: raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=f"Erro ao criar revenda: {str(e)}")
    finally:
        cur.close(); conn.close()

@router.post("/novo-cliente")
def criar_cliente_admin(dados: NovoClienteAdmin):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        # Verifica se já existe
        cur.execute("SELECT id FROM usuarios WHERE username = %s", (dados.username,))
        if cur.fetchone():
            raise HTTPException(status_code=400, detail="Este nome de utilizador já está em uso.")

        from datetime import date, timedelta
        vencimento = date.today() + timedelta(days=dados.dias_acesso)
        cur.execute("""
            INSERT INTO usuarios (username, password, role, vencimento, status, deletado, email, whatsapp, valor_venda) 
            VALUES (%s, %s, 'cliente', %s, 'ativo', FALSE, %s, %s, %s)
        """, (dados.username, dados.password, vencimento, dados.email, dados.whatsapp, dados.valor_venda))
        conn.commit()
        return {"status": "sucesso", "mensagem": f"Cliente {dados.username} criado com sucesso até {vencimento}!"}
    except HTTPException: raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=f"Erro ao criar cliente: {str(e)}")
    finally:
        cur.close(); conn.close()

@router.get("/dashboard")
def dashboard_admin():
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("SELECT COUNT(*) FROM usuarios WHERE role = 'cliente' AND deletado IS NOT TRUE")
        total_clientes = cur.fetchone()[0]
        
        cur.execute("SELECT SUM(valor_venda) FROM usuarios WHERE deletado IS NOT TRUE")
        total_receitas = float(cur.fetchone()[0] or 0.0)
        
        cur.execute("SELECT COUNT(*) FROM financas")
        total_transacoes = cur.fetchone()[0]
        
        cur.execute("SELECT id, username, role FROM usuarios WHERE deletado IS NOT TRUE AND role != 'revenda' ORDER BY id DESC LIMIT 10")
        ultimos = [{"id": r[0], "username": r[1], "role": r[2]} for r in cur.fetchall()]
        
        cur.execute("SELECT COUNT(*) FROM recuperacao_senha WHERE status = 'pendente'")
        total_recuperacoes = cur.fetchone()[0]
        
        return {
            "status": "sucesso", 
            "total_clientes": total_clientes, 
            "total_receitas": total_receitas, 
            "total_transacoes": total_transacoes,
            "total_recuperacoes": total_recuperacoes,
            "ultimos_usuarios": ultimos
        }
    finally:
        cur.close(); conn.close()

@router.delete("/usuarios/{usuario_id}")
def mover_para_lixeira(usuario_id: int):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        # Soft delete: apenas marca como deletado
        cur.execute("UPDATE usuarios SET deletado = TRUE WHERE id = %s", (usuario_id,))
        conn.commit()
        return {"status": "sucesso", "mensagem": "Utilizador movido para a lixeira."}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close(); conn.close()

from models.schemas import UsuarioUpdateAdmin

@router.put("/usuarios/{usuario_id}")
def atualizar_usuario(usuario_id: int, dados: UsuarioUpdateAdmin):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        # 1. Verifica se o usuário existe
        cur.execute("SELECT username FROM usuarios WHERE id = %s", (usuario_id,))
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="Usuário não encontrado.")

        # 2. Prepara a gravação campo a campo para evitar falhas silenciosas
        if dados.nome_completo is not None:
            cur.execute("UPDATE usuarios SET nome_completo = %s WHERE id = %s", (dados.nome_completo, usuario_id))
        if dados.email is not None:
            cur.execute("UPDATE usuarios SET email = %s WHERE id = %s", (dados.email, usuario_id))
        if dados.whatsapp is not None:
            cur.execute("UPDATE usuarios SET whatsapp = %s WHERE id = %s", (dados.whatsapp, usuario_id))
        if dados.vencimento is not None:
            venc = dados.vencimento if dados.vencimento and dados.vencimento != "" else None
            cur.execute("UPDATE usuarios SET vencimento = %s WHERE id = %s", (venc, usuario_id))
        if dados.status is not None:
            cur.execute("UPDATE usuarios SET status = %s WHERE id = %s", (dados.status, usuario_id))
        if dados.is_premium is not None:
            cur.execute("UPDATE usuarios SET is_premium = %s WHERE id = %s", (dados.is_premium, usuario_id))
        if dados.valor_venda is not None:
            val = float(dados.valor_venda)
            cur.execute("UPDATE usuarios SET valor_venda = %s WHERE id = %s", (val, usuario_id))

        # 3. Força a gravação no disco
        conn.commit()
        logging.info(f"✅ Usuário {usuario_id} gravado com sucesso no banco de dados.")
            
        return {"status": "sucesso", "mensagem": "Usuário atualizado com sucesso no banco de dados."}
    except Exception as e:
        conn.rollback()
        logging.error(f"❌ Erro ao gravar usuário {usuario_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro interno de gravação: {str(e)}")
    finally:
        cur.close()
        conn.close()

@router.get("/lixeira")
def listar_lixeira():
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("SELECT id, username, role, revendedor FROM usuarios WHERE deletado = TRUE ORDER BY id DESC")
        users = [{"id": r[0], "username": r[1], "role": r[2], "revendedor": r[3] if r[3] else "Sistema"} for r in cur.fetchall()]
        return users # Retorna lista direta como esperado pelo lixeira.js
    finally:
        cur.close(); conn.close()

@router.post("/restaurar-usuario/{usuario_id}")
def restaurar_usuario(usuario_id: int):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("UPDATE usuarios SET deletado = FALSE WHERE id = %s", (usuario_id,))
        conn.commit()
        return {"status": "sucesso", "mensagem": "Utilizador restaurado com sucesso."}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close(); conn.close()

@router.delete("/excluir-permanente/{usuario_id}")
def excluir_permanente(usuario_id: int):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("DELETE FROM usuarios WHERE id = %s", (usuario_id,))
        conn.commit()
        return {"status": "sucesso", "mensagem": "Utilizador apagado da base de dados."}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close(); conn.close()

@router.post("/usuarios/toggle-bloqueio/{usuario_id}")
def toggle_bloqueio(usuario_id: int):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        # Puxa o status atual
        cur.execute("SELECT status FROM usuarios WHERE id = %s", (usuario_id,))
        res = cur.fetchone()
        if not res:
            raise HTTPException(status_code=404, detail="Utilizador não encontrado.")
        
        novo_status = 'bloqueado' if res[0] != 'bloqueado' else 'ativo'
        
        cur.execute("UPDATE usuarios SET status = %s WHERE id = %s", (novo_status, usuario_id))
        conn.commit()
        return {"status": "sucesso", "novo_status": novo_status}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close(); conn.close()

@router.post("/bloquear/{usuario_id}")
def bloquear_alias(usuario_id: int):
    return toggle_bloqueio(usuario_id)

@router.get("/backup")
def gerar_backup():
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("SELECT * FROM usuarios")
        usuarios = cur.fetchall()
        cur.execute("SELECT * FROM financas")
        financas = cur.fetchall()
        return {"usuarios": usuarios, "financas": financas}
    finally:
        cur.close(); conn.close()

# --- ROTAS DE RECUPERAÇÃO DE SENHA (ADMIN) ---

@router.get("/recuperacoes-pendentes")
def listar_recuperacoes_pendentes():
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("""
            SELECT id, username, status, data_solicitacao 
            FROM recuperacao_senha 
            WHERE status = 'pendente' 
            ORDER BY data_solicitacao DESC
        """)
        rows = cur.fetchall()
        recuperacoes = []
        for r in rows:
            recuperacoes.append({
                "id": r[0],
                "username": r[1],
                "status": r[2],
                "data": r[3].strftime("%d/%m/%Y %H:%M")
            })
        return {"status": "sucesso", "recuperacoes": recuperacoes}
    finally:
        cur.close(); conn.close()

@router.post("/recuperacoes/gerar/{recuperacao_id}")
def gerar_senha_temporaria(recuperacao_id: int):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        # Busca o username da solicitação
        cur.execute("SELECT username FROM recuperacao_senha WHERE id = %s", (recuperacao_id,))
        res = cur.fetchone()
        if not res:
            raise HTTPException(status_code=404, detail="Solicitação não encontrada.")
        
        username = res[0]
        
        # Gera senha aleatória de 8 caracteres
        nova_senha = ''.join(random.choices(string.ascii_letters + string.digits, k=8))
        
        # Atualiza o usuário
        cur.execute("""
            UPDATE usuarios 
            SET password = %s, must_change_password = TRUE 
            WHERE username = %s
        """, (nova_senha, username))
        
        # Atualiza a solicitação
        from datetime import datetime
        cur.execute("""
            UPDATE recuperacao_senha 
            SET status = 'resolvido', data_resolucao = %s 
            WHERE id = %s
        """, (datetime.now(), recuperacao_id))
        
        conn.commit()
        return {"status": "sucesso", "senha_temporaria": nova_senha, "username": username}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close(); conn.close()

@router.delete("/recuperacoes/{recuperacao_id}")
def excluir_recuperacao(recuperacao_id: int):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("DELETE FROM recuperacao_senha WHERE id = %s", (recuperacao_id,))
        conn.commit()
        return {"status": "sucesso", "mensagem": "Solicitação removida."}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close(); conn.close()

# --- FERRAMENTAS PARA A IA (Assistente Admin) ---

def bloquear_usuario_ia(usuario_id: int):
    """Bloqueia o acesso de um utilizador ao sistema MTConnect."""
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("UPDATE usuarios SET status = 'bloqueado' WHERE id = %s", (usuario_id,))
        conn.commit()
        return f"Utilizador ID {usuario_id} bloqueado com sucesso pelo Assistente."
    finally:
        cur.close(); conn.close()

def adicionar_creditos_ia(usuario_id: int, quantidade: int):
    """Adiciona uma quantidade específica de créditos à carteira de um utilizador."""
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("UPDATE usuarios SET creditos = creditos + %s WHERE id = %s", (quantidade, usuario_id))
        conn.commit()
        return f"Adicionados {quantidade} créditos ao utilizador ID {usuario_id} com sucesso."
    finally:
        cur.close(); conn.close()

# Mapeamento para execução na Etapa 2
IA_TOOLS_MAP = {
    "bloquear_usuario_ia": bloquear_usuario_ia,
    "adicionar_creditos_ia": adicionar_creditos_ia
}

# --- A rota do Assistente (Etapa 1: Avaliação) ---
@router.post("/ia-assistente")
def consultar_gemini_admin(dados: PerguntaIA):
    try:
        # 1. Cria o chat com as ferramentas e instrução de sistema
        chat = client.chats.create(
            model='gemini-1.5-flash',
            config=types.GenerateContentConfig(
                tools=[bloquear_usuario_ia, adicionar_creditos_ia],
                system_instruction="Você é o assistente virtual do painel MTConnect. Responda em português.",
                automatic_function_calling=types.AutomaticFunctionCallingConfig(disable=True)
            )
        )
        
        # 2. Chama o Gemini
        response = chat.send_message(message=dados.mensagem)
        
        # 3. Analisa se o Gemini quer usar uma função (function_call)
        if hasattr(response, 'function_calls') and response.function_calls:
            # Pegamos a primeira chamada de função para manter o fluxo de autorização manual
            fn_call = response.function_calls[0]
            fn_name = fn_call.name
            fn_args = dict(fn_call.args)
            
            return {
                "status": "aguardando_autorizacao",
                "funcao": fn_name,
                "parametros": fn_args,
                "mensagem_ia": f"Comandante, identifiquei que preciso executar a ação '{fn_name}'. Deseja autorizar?"
            }

        # 4. Caso não precise de função, retorna a resposta de texto normal
        return {"status": "sucesso", "resposta": response.text}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro de comunicação com o satélite Gemini: {str(e)}")

# --- Etapa 2: Execução Autorizada ---
class ConfirmacaoAcaoIA(BaseModel):
    funcao: str
    parametros: dict

@router.post("/ia-assistente/confirmar")
def confirmar_acao_ia(dados: ConfirmacaoAcaoIA):
    try:
        if dados.funcao not in IA_TOOLS_MAP:
            raise HTTPException(status_code=400, detail="Função não reconhecida.")
        
        # Executa a função real mapeada
        resultado = IA_TOOLS_MAP[dados.funcao](**dados.parametros)
        
        return {
            "status": "sucesso",
            "mensagem": "Ação executada com sucesso!",
            "resultado_tecnico": resultado
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao executar ação autorizada: {str(e)}")

# --- CONFIGURAÇÃO DO SISTEMA (Endereçamento) ---
@router.get("/config")
def get_config():
    config_path = "sistema_config.json"
    if not os.path.exists(config_path):
        # Cria um padrão se não existir
        default_config = {
            "api_url": "http://localhost:8000",
            "system_name": "MTConnect V2",
            "environment": "production"
        }
        with open(config_path, "w") as f:
            json.dump(default_config, f, indent=2)
        return default_config
    
    with open(config_path, "r") as f:
        return json.load(f)

@router.post("/config")
def update_config(dados: dict):
    config_path = "sistema_config.json"
    with open(config_path, "w") as f:
        json.dump(dados, f, indent=2)
    return {"status": "sucesso", "mensagem": "Configurações atualizadas!"}

# --- RESTAURAÇÃO DE BACKUP ---
@router.post("/restaurar-backup")
def restaurar_backup():
    """
    Restaura o banco de dados a partir do arquivo database_dump.sql 
    localizado na pasta raiz ou na pasta de backup.
    """
    # Procura o arquivo SQL
    paths_to_check = [
        "../database_dump.sql",
        "database_dump.sql",
        "backup_financeiro_pg.sql"
    ]
    
    sql_file = None
    for p in paths_to_check:
        if os.path.exists(p):
            sql_file = p
            break
            
    if not sql_file:
        raise HTTPException(status_code=404, detail="Arquivo de backup (database_dump.sql) não encontrado.")

    conn = get_db_connection()
    conn.autocommit = True # Importante para DROP/CREATE DATABASE se necessário
    cur = conn.cursor()
    
    try:
        logging.info(f"Iniciando restauração de backup do arquivo: {sql_file}")
        
        with open(sql_file, 'r', encoding='utf-8') as f:
            content = f.read()
            
        # Limpeza básica: remove comandos de sistema do PostgreSQL (\set, \connect, etc) 
        # que o psycopg2 não entende.
        clean_content = []
        for line in content.splitlines():
            if line.strip().startswith('\\'):
                continue
            clean_content.append(line)
        
        full_sql = "\n".join(clean_content)
        
        # Como o dump pode ser grande e conter COPY FROM STDIN, 
        # uma execução direta pode falhar. 
        # No entanto, tentaremos executar o bloco principal.
        # Se falhar, sugerimos o uso do psql.
        
        # Nota: psycopg2 não lida bem com COPY FROM STDIN via execute().
        # Para um restore completo, o ideal seria o 'psql'.
        # Mas vamos tentar executar os comandos DDL e INSERTs.
        
        # Splitting by semicolons is naive but might work for simple dumps.
        # PostgreSQL dumps are complex.
        
        cur.execute(full_sql)
        
        return {"status": "sucesso", "mensagem": f"Backup {sql_file} processado. Verifique se os dados apareceram."}
        
    except Exception as e:
        logging.error(f"Erro na restauração: {str(e)}")
        # Se falhar aqui, é provável que seja por causa do formato do dump (COPY FROM STDIN)
        return {
            "status": "parcial", 
            "erro": str(e),
            "aviso": "O formato do backup pode exigir o comando 'psql' para restauração completa."
        }
    finally:
        cur.close()
        conn.close()