from fastapi import APIRouter, HTTPException
from core.database import get_db_connection
from models.schemas import LancamentoRequest, CategoriaRequest, FormaPagamentoRequest, MetaRequest
from datetime import datetime
import calendar

router = APIRouter(prefix="/api", tags=["Financeiro e Cliente"])

def somar_meses(data_original, meses_para_somar):
    mes = data_original.month - 1 + meses_para_somar
    ano = data_original.year + mes // 12
    mes = mes % 12 + 1
    dia = min(data_original.day, calendar.monthrange(ano, mes)[1])
    return data_original.replace(year=ano, month=mes, day=dia)

@router.post("/lancamentos")
def novo_lancamento(request: LancamentoRequest):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        # Segurança: Verifica se o utilizador existe e não está deletado (IS NOT TRUE cobre NULL e FALSE)
        cur.execute("SELECT id FROM usuarios WHERE username = %s AND deletado IS NOT TRUE", (request.username,))
        if not cur.fetchone():
            raise HTTPException(status_code=401, detail="Conta inativa ou não encontrada.")

        data_base = datetime.strptime(request.data, "%Y-%m-%d")
        qtd = request.quantidade if request.repetir == "sim" else 1

        for i in range(qtd):
            data_atual = somar_meses(data_base, i)
            cur.execute("""
                INSERT INTO financas (username, tipo, descricao, valor, data, categoria, pagamento, status)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """, (request.username, request.tipo, request.descricao, request.valor, data_atual.strftime("%Y-%m-%d"), request.categoria, request.pagamento, request.status or 'pago'))

            if request.tipo == "gasto" and request.pagamento not in ["PIX", "Dinheiro", "Boleto", "Saldo em Conta"]:
                # Se for cartão
                cur.execute("UPDATE cartoes SET fatura_atual = fatura_atual + %s WHERE username = %s AND nome_cartao = %s", (request.valor, request.username, request.pagamento))

        conn.commit()
        return {"status": "sucesso", "mensagem": f"{qtd} lançamento(s) registrado(s)!"}
    except HTTPException: raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close(); conn.close()

@router.get("/lancamentos/{username}")
def buscar_lancamentos(username: str):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        # Segurança: Verifica se o utilizador existe e não está deletado (IS NOT TRUE cobre NULL e FALSE)
        cur.execute("SELECT id FROM usuarios WHERE username = %s AND deletado IS NOT TRUE", (username,))
        if not cur.fetchone():
            raise HTTPException(status_code=401, detail="Conta inativa ou não encontrada.")

        cur.execute("SELECT id, tipo, descricao, valor, data, categoria, pagamento, status FROM financas WHERE username = %s ORDER BY data DESC", (username,))
        res = [{"id": l[0], "tipo": l[1], "descricao": l[2], "valor": float(l[3]), "data": l[4].strftime("%d/%m/%Y"), "categoria": l[5], "pagamento": l[6], "status": l[7]} for l in cur.fetchall()]
        return {"status": "sucesso", "dados": res}
    except HTTPException: raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close(); conn.close()

@router.delete("/lancamentos/{lancamento_id}")
def excluir_lancamento(lancamento_id: int):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        # Puxa dados para ajuste de cartão se necessário
        cur.execute("SELECT username, valor, pagamento, tipo FROM financas WHERE id = %s", (lancamento_id,))
        res = cur.fetchone()
        if res:
            username, valor, pagamento, tipo = res
            if tipo == "gasto" and pagamento not in ["PIX", "Dinheiro", "Boleto", "Saldo em Conta"]:
                cur.execute("UPDATE cartoes SET fatura_atual = fatura_atual - %s WHERE username = %s AND nome_cartao = %s", (valor, username, pagamento))
        
        cur.execute("DELETE FROM financas WHERE id = %s", (lancamento_id,))
        conn.commit()
        return {"status": "sucesso", "mensagem": "Lançamento excluído!"}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close(); conn.close()

@router.get("/dashboard-stats/{username}")
def get_dashboard_stats(username: str, month: int = None, year: int = None):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        # Segurança (IS NOT TRUE cobre NULL e FALSE)
        cur.execute("SELECT id FROM usuarios WHERE username = %s AND deletado IS NOT TRUE", (username,))
        if not cur.fetchone():
            raise HTTPException(status_code=401, detail="Sessão inativa.")

        # Se não vier parâmetro, usa o mês atual
        if not month: month = datetime.now().month
        if not year: year = datetime.now().year

        # 1. Saldo Total (Geral)
        cur.execute("""
            SELECT SUM(CASE 
                WHEN LOWER(tipo) IN ('recebimento', 'receita') THEN valor 
                WHEN LOWER(tipo) IN ('gasto', 'despesa') THEN -valor 
                ELSE 0 END) 
            FROM financas WHERE username = %s
        """, (username,))
        saldo_global = float(cur.fetchone()[0] or 0.0)

        # 2. Receitas do Período
        cur.execute("""
            SELECT SUM(valor) FROM financas 
            WHERE username = %s AND LOWER(tipo) IN ('recebimento', 'receita')
            AND EXTRACT(MONTH FROM data) = %s
            AND EXTRACT(YEAR FROM data) = %s
        """, (username, month, year))
        receitas_mes = float(cur.fetchone()[0] or 0.0)
        
        # 3. Despesas do Período
        cur.execute("""
            SELECT SUM(valor) FROM financas 
            WHERE username = %s AND LOWER(tipo) IN ('gasto', 'despesa')
            AND EXTRACT(MONTH FROM data) = %s
            AND EXTRACT(YEAR FROM data) = %s
        """, (username, month, year))
        despesas_mes = float(cur.fetchone()[0] or 0.0)
        
        return {
            "status": "sucesso", 
            "receitas": receitas_mes, 
            "despesas": despesas_mes, 
            "saldo": saldo_global,
            "periodo": f"{month}/{year}"
        }
    except HTTPException: raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close(); conn.close()

@router.get("/chart-data/{username}")
def get_chart_data(username: str, year: int = None):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        if not year: year = datetime.now().year

        cur.execute("""
            SELECT EXTRACT(MONTH FROM data), tipo, SUM(valor) 
            FROM financas 
            WHERE username = %s AND EXTRACT(YEAR FROM data) = %s 
            GROUP BY 1, 2
        """, (username, year))
        linhas = cur.fetchall()
        
        rec_mes, des_mes = [0]*12, [0]*12
        for l in linhas:
            tipo = l[1].lower()
            mes_idx = int(l[0]) - 1
            if tipo in ['recebimento', 'receita']: 
                rec_mes[mes_idx] = float(l[2])
            elif tipo in ['gasto', 'despesa']:
                des_mes[mes_idx] = float(l[2])
            
        return {
            "status": "sucesso", 
            "labels": ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'], 
            "receitas": rec_mes, 
            "despesas": des_mes,
            "ano": year
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close(); conn.close()

@router.post("/cartoes")
def salvar_cartao(dados: dict):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("""
            INSERT INTO cartoes (username, nome_cartao, dia_fechamento, limite_total, cor_card, dia_vencimento)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (dados['username'], dados['nome'], dados['fechamento'], dados['limite'], dados['cor'], dados['vencimento']))
        conn.commit()
        return {"status": "sucesso"}
    except Exception as e:
        conn.rollback()
        return {"status": "erro", "detalhe": str(e)}
    finally:
        cur.close(); conn.close()

@router.get("/cartoes/{username}")
def get_cartoes(username: str):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("SELECT nome_cartao, dia_fechamento, limite_total, fatura_atual, cor_card, dia_vencimento FROM cartoes WHERE username = %s", (username,))
        cartoes = [{"nome": r[0], "fechamento": r[1], "limite": float(r[2]), "fatura": float(r[3]), "cor": r[4], "vencimento": r[5]} for r in cur.fetchall()]
        return {"status": "sucesso", "cartoes": cartoes}
    except Exception as e:
        return {"status": "erro", "detalhe": str(e)}
    finally:
        cur.close(); conn.close()

@router.delete("/cartoes/{username}/{nome_cartao}")
def deletar_cartao(username: str, nome_cartao: str):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("DELETE FROM cartoes WHERE username = %s AND nome_cartao = %s", (username, nome_cartao))
        conn.commit()
        return {"status": "sucesso"}
    except Exception as e:
        conn.rollback()
        return {"status": "erro", "detalhe": str(e)}
    finally:
        cur.close(); conn.close()

@router.post("/cartoes/gasto")
def adicionar_gasto_cartao(dados: dict):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("UPDATE cartoes SET fatura_atual = fatura_atual + %s WHERE username = %s AND nome_cartao = %s", (dados['valor'], dados['username'], dados['nome_cartao']))
        cur.execute("INSERT INTO financas (username, tipo, descricao, valor, data, categoria, pagamento) VALUES (%s, 'gasto', %s, %s, CURRENT_DATE, 'Cartão', %s)", (dados['username'], f"Gasto no {dados['nome_cartao']}", dados['valor'], dados['nome_cartao']))
        conn.commit()
        return {"status": "sucesso"}
    except Exception as e:
        conn.rollback()
        return {"status": "erro", "detalhe": str(e)}
    finally:
        cur.close(); conn.close()

@router.post("/cartoes/pagar-fatura")
def pagar_fatura(dados: dict):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("SELECT fatura_atual FROM cartoes WHERE username = %s AND nome_cartao = %s", (dados['username'], dados['nome_cartao']))
        res = cur.fetchone()
        if not res: return {"status": "erro", "detalhe": "Cartão não encontrado."}
        valor_fatura = res[0]
        if valor_fatura <= 0: return {"status": "erro", "detalhe": "A fatura já está zerada!"}
        
        cur.execute("UPDATE cartoes SET fatura_atual = 0 WHERE username = %s AND nome_cartao = %s", (dados['username'], dados['nome_cartao']))
        cur.execute("INSERT INTO financas (username, tipo, descricao, valor, data, categoria, pagamento) VALUES (%s, 'gasto', %s, %s, CURRENT_DATE, 'Pagamento', 'Saldo em Conta')", (dados['username'], f"Pagamento Fatura: {dados['nome_cartao']}", valor_fatura))
        conn.commit()
        return {"status": "sucesso"}
    except Exception as e:
        conn.rollback()
        return {"status": "erro", "detalhe": str(e)}
    finally:
        cur.close(); conn.close()

@router.put("/lancamentos/{lancamento_id}")
def editar_lancamento(lancamento_id: int, request: LancamentoRequest):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("""
            UPDATE financas 
            SET tipo = %s, descricao = %s, valor = %s, data = %s, categoria = %s, pagamento = %s, status = %s
            WHERE id = %s AND username = %s
        """, (request.tipo, request.descricao, request.valor, request.data, request.categoria, request.pagamento, request.status or 'pago', lancamento_id, request.username))
        
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Transação não encontrada ou sem permissão.")

        conn.commit()
        return {"status": "sucesso", "mensagem": "Transação atualizada com sucesso!"}
    except HTTPException: raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close(); conn.close()

@router.put("/confirmar-pagamento/{lancamento_id}")
def confirmar_pagamento(lancamento_id: int):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("UPDATE financas SET status = 'pago' WHERE id = %s", (lancamento_id,))
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Lançamento não encontrado.")
        conn.commit()
        return {"status": "sucesso", "mensagem": "Pagamento confirmado!"}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close(); conn.close()

@router.get("/categorias/{username}")
def get_categorias(username: str):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("SELECT id, nome, tipo, cor FROM categorias WHERE username = %s ORDER BY nome ASC", (username,))
        dados = [{"id": r[0], "nome": r[1], "tipo": r[2], "cor": r[3]} for r in cur.fetchall()]
        return {"status": "sucesso", "dados": dados}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close(); conn.close()

@router.post("/categorias")
def salvar_categoria(request: CategoriaRequest):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("""
            INSERT INTO categorias (username, nome, tipo, cor)
            VALUES (%s, %s, %s, %s)
        """, (request.username, request.nome, request.tipo, request.cor))
        conn.commit()
        return {"status": "sucesso", "mensagem": "Categoria salva!"}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close(); conn.close()

@router.delete("/categorias/{categoria_id}")
def deletar_categoria(categoria_id: int):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("DELETE FROM categorias WHERE id = %s", (categoria_id,))
        conn.commit()
        return {"status": "sucesso", "mensagem": "Categoria removida!"}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close(); conn.close()

@router.get("/formas-pagamento/{username}")
def get_formas_pagamento(username: str):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("SELECT id, nome FROM formas_pagamento WHERE username = %s ORDER BY nome ASC", (username,))
        dados = [{"id": r[0], "nome": r[1]} for r in cur.fetchall()]
        return {"status": "sucesso", "dados": dados}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close(); conn.close()

@router.post("/formas-pagamento")
def salvar_forma_pagamento(request: FormaPagamentoRequest):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("""
            INSERT INTO formas_pagamento (username, nome)
            VALUES (%s, %s)
        """, (request.username, request.nome))
        conn.commit()
        return {"status": "sucesso", "mensagem": "Forma de pagamento salva!"}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close(); conn.close()

@router.delete("/formas-pagamento/{forma_id}")
def deletar_forma_pagamento(forma_id: int):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("DELETE FROM formas_pagamento WHERE id = %s", (forma_id,))
        conn.commit()
        return {"status": "sucesso", "mensagem": "Forma de pagamento removida!"}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close(); conn.close()

@router.get("/metas/{username}")
def get_metas(username: str):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("SELECT categoria, limite FROM metas_gastos WHERE username = %s ORDER BY categoria ASC", (username,))
        dados = [{"categoria": r[0], "limite": float(r[1])} for r in cur.fetchall()]
        return dados
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close(); conn.close()

@router.post("/metas")
def salvar_meta(request: MetaRequest):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("""
            INSERT INTO metas_gastos (username, categoria, limite)
            VALUES (%s, %s, %s)
            ON CONFLICT (username, categoria) DO UPDATE SET limite = EXCLUDED.limite
        """, (request.username, request.categoria, request.limite))
        conn.commit()
        return {"status": "sucesso"}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close(); conn.close()

@router.delete("/metas/{username}/{categoria}")
def deletar_meta(username: str, categoria: str):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("DELETE FROM metas_gastos WHERE username = %s AND categoria = %s", (username, categoria))
        conn.commit()
        return {"status": "sucesso"}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close(); conn.close()