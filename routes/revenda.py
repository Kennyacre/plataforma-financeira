from fastapi import APIRouter, HTTPException
from core.database import get_db_connection
from models.schemas import PedidoCredito, NovoClienteRevenda
from datetime import date, timedelta
import requests

router = APIRouter(prefix="/api/revenda", tags=["Revenda"])

@router.post("/solicitar-creditos")
def solicitar_creditos(pedido: PedidoCredito):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("INSERT INTO solicitacoes_credito (username, quantidade) VALUES (%s, %s)", (pedido.username, pedido.quantidade))
        conn.commit()
        try:
            TELEGRAM_TOKEN = "8731012556:AAEDIKHniMp0niqwIaJM-DcymDzJsoPpS1M"
            CHAT_ID = "6016539904"
            msg = f"🚨 *NOVO PEDIDO*\nRevendedor: {pedido.username}\nQuantidade: {pedido.quantidade}"
            requests.post(f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendMessage", json={"chat_id": CHAT_ID, "text": msg, "parse_mode": "Markdown"})
        except: pass
        return {"status": "sucesso"}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close(); conn.close()

@router.post("/novo-cliente")
def criar_cliente_revenda(dados: NovoClienteRevenda):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        # 0. Verifica se o username já existe (mesmo que na lixeira)
        cur.execute("SELECT id FROM usuarios WHERE username = %s", (dados.username,))
        if cur.fetchone():
            raise HTTPException(status_code=400, detail="Este nome de utilizador já está em uso por outro cliente.")

        # 1. Verifica se o revendedor tem créditos (Apenas para conta oficial)
        if dados.tipo_conta == 'oficial':
            cur.execute("SELECT creditos FROM usuarios WHERE username = %s AND role = 'revenda'", (dados.revendedor,))
            res = cur.fetchone()
            if not res or res[0] < 1:
                raise HTTPException(status_code=400, detail="Créditos insuficientes para criar conta oficial.")
            
            # 2. Desconta 1 crédito
            cur.execute("UPDATE usuarios SET creditos = creditos - 1 WHERE username = %s", (dados.revendedor,))
        
        # 3. Cria o cliente
        vencimento = date.today() + timedelta(days=dados.dias_acesso)
        cur.execute("""
            INSERT INTO usuarios (username, password, role, revendedor, vencimento, status, deletado) 
            VALUES (%s, %s, 'cliente', %s, %s, 'ativo', FALSE)
        """, (dados.username, dados.password, dados.revendedor, vencimento))
        
        conn.commit()
        msg = f"Cliente {dados.username} criado com sucesso ({dados.tipo_conta})!"
        return {"status": "sucesso", "mensagem": msg}
        
    except HTTPException: raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=f"Erro ao criar cliente pela revenda: {str(e)}")
    finally:
        cur.close(); conn.close()

@router.delete("/excluir-cliente/{revendedor}/{cliente}")
def excluir_cliente(revendedor: str, cliente: str):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("UPDATE usuarios SET deletado = TRUE WHERE username = %s AND revendedor = %s", (cliente, revendedor))
        conn.commit()
        return {"status": "sucesso", "mensagem": f"Cliente {cliente} foi movido para a lixeira."}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close(); conn.close()

@router.get("/clientes/{user}")
def listar_clientes(user: str):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("SELECT id, username, vencimento, status FROM usuarios WHERE revendedor = %s AND deletado = FALSE", (user,))
        rows = cur.fetchall()
        hoje = date.today()
        clientes = []
        for r in rows:
            venc = r[2]
            dias = (venc - hoje).days if venc else None
            status_venc = "ativo"
            if dias is not None and dias < 0: status_venc = "vencido"
            elif dias is not None and dias <= 3: status_venc = "expirando"
            clientes.append({
                "id": r[0],
                "username": r[1], 
                "vencimento": venc.strftime("%d/%m/%Y") if venc else "Sem data", 
                "status_vencimento": status_venc, 
                "status": r[3] if r[3] else "ativo",
                "texto_prazo": f"{dias} dias" if dias is not None else "---"
            })
        return {"status": "sucesso", "clientes": clientes}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close(); conn.close()

@router.get("/minhas-solicitacoes/{username}")
def minhas_solicitacoes(username: str):
    conn = get_db_connection(); cur = conn.cursor()
    try:
        cur.execute("SELECT id, quantidade, status, data_solicitacao FROM solicitacoes_credito WHERE username = %s ORDER BY data_solicitacao DESC", (username,))
        res = [{"id": r[0], "quantidade": r[1], "status": r[2], "data": r[3].strftime("%d/%m/%Y %H:%M")} for r in cur.fetchall()]
        return {"status": "sucesso", "pedidos": res}
    finally:
        cur.close(); conn.close()

# --- GESTÃO DE CLIENTES (LIXEIRA E BLOQUEIO) ---

@router.get("/lixeira/{username}")
def listar_lixeira_revenda(username: str):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("SELECT id, username, role FROM usuarios WHERE revendedor = %s AND deletado = TRUE ORDER BY id DESC", (username,))
        clientes = [{"id": r[0], "username": r[1], "role": r[2]} for r in cur.fetchall()]
        return {"status": "sucesso", "clientes": clientes}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close(); conn.close()

@router.post("/restaurar-cliente/{revendedor}/{cliente}")
def restaurar_cliente_revenda(revendedor: str, cliente: str):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("UPDATE usuarios SET deletado = FALSE WHERE username = %s AND revendedor = %s", (cliente, revendedor))
        conn.commit()
        return {"status": "sucesso", "mensagem": "Cliente restaurado!"}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close(); conn.close()

@router.delete("/excluir-permanente/{revendedor}/{cliente}")
def excluir_permanente_revenda(revendedor: str, cliente: str):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("DELETE FROM usuarios WHERE username = %s AND revendedor = %s", (cliente, revendedor))
        conn.commit()
        return {"status": "sucesso", "mensagem": "Cliente apagado permanentemente."}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close(); conn.close()

@router.post("/toggle-bloqueio/{revendedor}/{cliente}")
def toggle_bloqueio_revenda(revendedor: str, cliente: str):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("SELECT status FROM usuarios WHERE username = %s AND revendedor = %s", (cliente, revendedor))
        res = cur.fetchone()
        if not res:
            raise HTTPException(status_code=404, detail="Cliente não encontrado.")
        
        novo_status = 'bloqueado' if res[0] != 'bloqueado' else 'ativo'
        cur.execute("UPDATE usuarios SET status = %s WHERE username = %s AND revendedor = %s", (novo_status, cliente, revendedor))
        conn.commit()
        return {"status": "sucesso", "novo_status": novo_status}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close(); conn.close()