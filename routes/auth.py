from fastapi import Request, APIRouter, HTTPException, Depends
from core.database import get_db_connection
from models.schemas import LoginRequest, PerfilUpdate, ManualRegistrationRequest, SolicitacaoRecuperacao, RedefinirSenha
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
            SELECT username, password, role, status, deletado, must_change_password
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
            
        return {
            "status": "sucesso", 
            "role": user[2], 
            "username": user[0],
            "must_change_password": bool(user[5])
        }
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
        vencimento = date.today() + timedelta(days=5)
        
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
        cur.execute("SELECT username, email, role, revendedor, nome_completo, vencimento, whatsapp, id FROM usuarios WHERE username = %s AND deletado = FALSE", (username,))
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
            "vencimento": row[5].strftime("%Y-%m-%d") if row[5] else None,
            "whatsapp": row[6] if row[6] else "",
            "id": row[7]
        }
        return user
    finally:
        cur.close(); conn.close()

@router.put("/usuarios/perfil/{username}")
def update_perfil(username: str, data: PerfilUpdate):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        email_val = data.email.lower().strip() if data.email else None
        cur.execute("UPDATE usuarios SET nome_completo = %s, email = %s, whatsapp = %s WHERE username = %s AND deletado = FALSE", (data.nome_completo, email_val, data.whatsapp, username))
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
        cur.execute("SELECT status, vencimento, role FROM usuarios WHERE username = %s AND deletado IS NOT TRUE", (username,))
        res = cur.fetchone()
        if not res:
            raise HTTPException(status_code=404, detail="Sessão inválida ou utilizador removido.")
        
        status, vencimento, role = res
        from datetime import date
        dias_restantes = (vencimento - date.today()).days if vencimento else None
        
        # Bloqueio automático por vencimento para clientes
        if role == 'cliente' and dias_restantes is not None and dias_restantes < 0:
            status = 'bloqueado'
            
        return {
            "status": status,
            "vencimento_data": vencimento.strftime("%d/%m/%Y") if vencimento else None,
            "dias_restantes": dias_restantes
        }
    finally:
        cur.close(); conn.close()

@router.get("/pix-pagamento/{username}")
def get_pix_pagamento(username: str):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        # 1. Busca quem é o gestor do usuário
        cur.execute("SELECT revendedor FROM usuarios WHERE username = %s", (username,))
        res = cur.fetchone()
        gestor = res[0] if res else None

        pix_chave = None
        pix_titular = None

        if gestor:
            # 2. Busca o PIX do revendedor
            cur.execute("SELECT pix_chave, pix_titular, pix_banco FROM usuarios WHERE username = %s", (gestor,))
            res_pix = cur.fetchone()
            if res_pix and res_pix[0]:
                pix_chave = res_pix[0]
                pix_titular = res_pix[1]
                pix_banco = res_pix[2]

        # 3. Se não tem gestor ou gestor não tem PIX, busca do admin (priorizando o usuário 'admin' principal)
        if not pix_chave:
            cur.execute("""
                SELECT pix_chave, pix_titular, pix_banco 
                FROM usuarios 
                WHERE role = 'admin' AND pix_chave IS NOT NULL 
                ORDER BY (username = 'admin') DESC, id ASC 
                LIMIT 1
            """)
            res_admin = cur.fetchone()
            if res_admin:
                pix_chave = res_admin[0]
                pix_titular = res_admin[1]
                pix_banco = res_admin[2]

        # 4. Busca o valor de venda do próprio usuário
        cur.execute("SELECT valor_venda FROM usuarios WHERE username = %s", (username,))
        res_user = cur.fetchone()
        valor = res_user[0] if res_user else 0.0

        return {
            "status": "sucesso",
            "pix_chave": pix_chave or "Não cadastrada",
            "pix_titular": pix_titular or "Administrador",
            "pix_banco": pix_banco or "Não informado",
            "valor": valor
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
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

@router.post("/recuperar-senha/solicitar")
def solicitar_recuperacao(dados: SolicitacaoRecuperacao):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        username = dados.username.lower().strip()
        # Verifica se o usuário existe
        cur.execute("SELECT id FROM usuarios WHERE username = %s AND deletado = FALSE", (username,))
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="Utilizador não encontrado.")
        
        # Verifica se já tem uma solicitação pendente
        cur.execute("SELECT id FROM recuperacao_senha WHERE username = %s AND status = 'pendente'", (username,))
        if cur.fetchone():
            return {"status": "sucesso", "mensagem": "Já existe uma solicitação pendente para este utilizador."}

        cur.execute("INSERT INTO recuperacao_senha (username) VALUES (%s)", (username,))
        conn.commit()
        return {"status": "sucesso", "mensagem": "Solicitação de recuperação enviada com sucesso!"}
    except HTTPException: raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close(); conn.close()

@router.post("/recuperar-senha/redefinir")
def redefinir_senha(dados: RedefinirSenha):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        username = dados.username.lower().strip()
        cur.execute("""
            UPDATE usuarios 
            SET password = %s, must_change_password = FALSE 
            WHERE username = %s AND deletado = FALSE
        """, (dados.nova_senha, username))
        
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Utilizador não encontrado.")
            
        conn.commit()
        return {"status": "sucesso", "mensagem": "Senha redefinida com sucesso!"}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close(); conn.close()
@router.post("/solicitar-desbloqueio/{username}")
def solicitar_desbloqueio(username: str):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("UPDATE usuarios SET solicitacao_renovacao = TRUE WHERE username = %s", (username,))
        conn.commit()
        return {"status": "sucesso", "mensagem": "Solicitação enviada! Aguarde a confirmação do administrador."}
    finally:
        cur.close(); conn.close()



import requests
import os
from fastapi.responses import RedirectResponse

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")
GOOGLE_REDIRECT_URI = "https://beta.tninfo-angra.duckdns.org/api/auth/google/callback"

@router.get("/auth/google/login")
def google_login(request: Request, action: str = "login", username: str = None):
    host = request.headers.get("host", "beta.tninfo-angra.duckdns.org")
    dynamic_redirect_uri = f"https://{host}/api/auth/google/callback"
    # state will store 'action|username' (e.g. 'login|' or 'link|joao')
    state = f"{action}|{username if username else ''}"
    auth_url = (
        "https://accounts.google.com/o/oauth2/v2/auth?"
        "response_type=code&"
        f"client_id={GOOGLE_CLIENT_ID}&"
        f"redirect_uri={dynamic_redirect_uri}&"
        "scope=openid%20email%20profile&"
        "access_type=offline&"
        "prompt=consent&"
        f"state={state}"
    )
    return RedirectResponse(auth_url)

@router.get("/auth/google/callback")
def google_callback(request: Request, code: str, state: str = "login|"):
    host = request.headers.get("host", "beta.tninfo-angra.duckdns.org")
    dynamic_redirect_uri = f"https://{host}/api/auth/google/callback"
    # 1. Exchange code for token
    token_url = "https://oauth2.googleapis.com/token"
    data = {
        "code": code,
        "client_id": GOOGLE_CLIENT_ID,
        "client_secret": GOOGLE_CLIENT_SECRET,
        "redirect_uri": dynamic_redirect_uri,
        "grant_type": "authorization_code",
    }
    r = requests.post(token_url, data=data)
    token_data = r.json()
    access_token = token_data.get("access_token")
    if not access_token:
        return RedirectResponse("/index.html?erro=google_token_invalido")

    # 2. Get user info
    user_info_url = "https://www.googleapis.com/oauth2/v1/userinfo"
    headers = {"Authorization": f"Bearer {access_token}"}
    r_info = requests.get(user_info_url, headers=headers)
    user_info = r_info.json()
    
    email = user_info.get("email")
    google_id = user_info.get("id")
    name = user_info.get("name", "Usuário Google")
    
    if not email:
        return RedirectResponse("/index.html?erro=google_sem_email")

    action, _, local_username = state.partition("|")

    conn = get_db_connection()
    cur = conn.cursor()
    try:
        if action == "link" and local_username:
            # Vincular conta Google ao usuário logado
            cur.execute("UPDATE usuarios SET google_id = %s WHERE username = %s AND deletado = FALSE", (google_id, local_username))
            conn.commit()
            return RedirectResponse(f"/cliente/perfil.html?msg=google_vinculado")
        
        # Fluxo normal de Login
        cur.execute("SELECT username, role, status FROM usuarios WHERE google_id = %s OR email = %s AND deletado = FALSE", (google_id, email))
        user = cur.fetchone()
        
        if user:
            # Usuário já existe, atualiza google_id se estiver nulo
            cur.execute("UPDATE usuarios SET google_id = %s WHERE email = %s AND deletado = FALSE", (google_id, email))
            conn.commit()
            
            db_user, db_role, db_status = user
            if db_status == 'bloqueado':
                return RedirectResponse("/index.html?erro=conta_bloqueada")
                
            # Logar o usuário redirecionando com um hash/token ou simplesmente simulando a sessão (usando query param ou cookies. 
            # O frontend original usa POST /login que retorna JSON, então redirecionamos com um parametro temporario para o frontend processar)
            # Para manter segurança, vamos usar sessionStorage via frontend, mas precisamos passar pro HTML de alguma forma.
            # Um método simples: redirecionar para uma rota que injeta JS.
            html_response = f"""
            <html><body><script>
                localStorage.setItem('usuarioLogado', '{db_user}');
                localStorage.setItem('funcaoUsuario', '{db_role}');
                window.location.href = '{'/gerente/painel-admin.html' if db_role == 'admin' or db_role == 'revendedor' else '/cliente/painel-cliente.html'}';
            </script></body></html>
            """
            from fastapi.responses import HTMLResponse
            return HTMLResponse(content=html_response)
        
        else:
            # Usuário NOVO - Pausar para o Indicação Code
            # Redireciona para completar-google.html passando os dados na URL
            import urllib.parse
            safe_email = urllib.parse.quote(email)
            safe_name = urllib.parse.quote(name)
            return RedirectResponse(f"/completar-google.html?email={safe_email}&name={safe_name}&gid={google_id}")
            
    finally:
        cur.close()
        conn.close()

class CompletarGoogleRequest(BaseModel):
    email: str
    nome: str
    google_id: str
    codigo_indicacao: str = ""

@router.post("/auth/google/completar")
def google_completar(dados: CompletarGoogleRequest):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        # Gera username
        username = dados.email.split('@')[0].lower()
        # Garante username único
        cur.execute("SELECT id FROM usuarios WHERE username = %s", (username,))
        if cur.fetchone():
            import random
            username = f"{username}{random.randint(100,999)}"
            
        gestor = "admin" # Fallback
        if dados.codigo_indicacao:
            cur.execute("SELECT username FROM usuarios WHERE id::text = %s AND deletado = FALSE", (dados.codigo_indicacao,))
            res = cur.fetchone()
            if res:
                gestor = res[0]
                
        from datetime import date, timedelta
        vencimento = date.today() + timedelta(days=5)
        
        cur.execute("""
            INSERT INTO usuarios (username, password, email, nome_completo, role, revendedor, vencimento, status, deletado, google_id)
            VALUES (%s, 'senha_google', %s, %s, 'cliente', %s, %s, 'ativo', FALSE, %s)
        """, (username, dados.email, dados.nome, gestor, vencimento, dados.google_id))
        
        conn.commit()
        return {"status": "sucesso", "username": username, "role": "cliente"}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()
        conn.close()
