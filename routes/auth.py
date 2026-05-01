from fastapi import APIRouter, HTTPException, Depends
from core.database import get_db_connection
from models.schemas import LoginRequest, PerfilUpdate, ManualRegistrationRequest
import logging
from pydantic import BaseModel
# import psycopg2 # REMOVIDO PARA COMPATIBILIDADE COM PYTHON 3.14
import urllib.request
import json

router = APIRouter(prefix="/api", tags=["Autenticacao"])

@router.post("/login")
def login(request: LoginRequest):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("""
            SELECT username, password, role, status, deletado
            FROM usuarios 
            WHERE (username = %s OR email = %s) AND deletado IS NOT TRUE
        """, (request.username.lower().strip(), request.username.lower().strip()))
        
        user = cur.fetchone()
        if not user:
            raise HTTPException(status_code=401, detail="Utilizador não encontrado ou inativo.")
            
        if user[1] != request.password:
            raise HTTPException(status_code=401, detail="Senha incorreta.")
            
        if user[3] == 'bloqueado':
            raise HTTPException(status_code=403, detail="A sua conta está bloqueada.")
            
        return {"status": "sucesso", "role": user[2], "username": user[0]}
    finally:
        cur.close(); conn.close()

@router.post("/cadastro-manual")
def cadastro_manual(dados: ManualRegistrationRequest):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        username = dados.username.lower().strip()
        email = dados.email.lower().strip()

        cur.execute("SELECT id FROM usuarios WHERE username = %s OR email = %s", (username, email))
        if cur.fetchone():
            raise HTTPException(status_code=400, detail="Utilizador ou E-mail já em uso.")
        
        gestor = None
        if dados.id_indicacao:
            cur.execute("SELECT username FROM usuarios WHERE id = %s AND deletado = FALSE", (dados.id_indicacao,))
            res = cur.fetchone()
            if res: gestor = res[0]
            
        from datetime import date, timedelta
        vencimento = date.today() + timedelta(days=30)
        
        cur.execute("""
            INSERT INTO usuarios (username, password, email, nome_completo, role, revendedor, vencimento, status, deletado)
            VALUES (%s, %s, %s, %s, 'cliente', %s, %s, 'ativo', FALSE)
        """, (username, dados.password, email, dados.nome_completo, gestor, vencimento))
        
        conn.commit()
        return {"status": "sucesso", "mensagem": "Registo concluído!"}
    except HTTPException: raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close(); conn.close()

@router.get("/usuarios/perfil/{username}")
def get_perfil(username: str):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("SELECT username, email, role, revendedor, nome_completo, vencimento FROM usuarios WHERE username = %s AND deletado = FALSE", (username,))
        row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Perfil não encontrado.")
        
        # Mapeamento manual para substituir o RealDictCursor
        user = {
            "username": row[0],
            "email": row[1],
            "role": row[2],
            "revendedor": row[3],
            "nome_completo": row[4],
            "vencimento": row[5]
        }
        return user
    finally:
        cur.close(); conn.close()

@router.put("/usuarios/perfil/{username}")
def update_perfil(username: str, data: PerfilUpdate):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("UPDATE usuarios SET nome_completo = %s, email = %s WHERE username = %s AND deletado = FALSE", (data.nome_completo, data.email.lower().strip(), username))
        conn.commit()
        return {"status": "sucesso", "mensagem": "Perfil atualizado!"}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close(); conn.close()

@router.get("/usuarios/sessao/{username}")
def check_sessao(username: str):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("SELECT status, vencimento FROM usuarios WHERE username = %s AND deletado IS NOT TRUE", (username,))
        res = cur.fetchone()
        if not res:
            raise HTTPException(status_code=404, detail="Sessão inválida ou utilizador removido.")
        
        status, vencimento = res
        from datetime import date
        dias_restantes = (vencimento - date.today()).days if vencimento else None
            
        return {
            "status": status,
            "vencimento_data": vencimento.strftime("%d/%m/%Y") if vencimento else None,
            "dias_restantes": dias_restantes
        }
    finally:
        cur.close(); conn.close()

@router.get("/admin/info-indicacao/{usuario_id}")
def get_info_indicacao(usuario_id: int):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("SELECT username, role, nome_completo FROM usuarios WHERE id = %s AND deletado = FALSE", (usuario_id,))
        res = cur.fetchone()
        if not res: raise HTTPException(status_code=404, detail="Indicação não encontrada.")
        return {"username": res[0], "role": res[1], "nome": res[2] or res[0]}
    finally:
        cur.close(); conn.close()
