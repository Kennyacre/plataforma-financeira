from fastapi import APIRouter, HTTPException, Request
from core.database import get_db_connection
from models.schemas import LancamentoRequest, CategoriaRequest, FormaPagamentoRequest, MetaRequest
from datetime import datetime
import calendar
import logging

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
        agora = datetime.now()
        # Busca os dados básicos do cartão + soma dos gastos do mês atual
        cur.execute("""
            SELECT c.nome_cartao, c.dia_fechamento, c.limite_total, c.fatura_atual, c.cor_card, c.dia_vencimento,
            (SELECT COALESCE(SUM(f.valor), 0) FROM financas f 
             WHERE f.username = c.username AND f.pagamento = c.nome_cartao 
             AND EXTRACT(MONTH FROM f.data) = %s AND EXTRACT(YEAR FROM f.data) = %s
             AND f.tipo = 'gasto') as fatura_mes
            FROM cartoes c WHERE c.username = %s
        """, (agora.month, agora.year, username))
        
        cartoes = []
        for r in cur.fetchall():
            cartoes.append({
                "nome": r[0],
                "fechamento": r[1],
                "limite": float(r[2]),
                "fatura_total": float(r[3]), # Dívida total (todas as parcelas)
                "cor": r[4],
                "vencimento": r[5],
                "fatura": float(r[6]) # Fatura do mês atual (o que o usuário vê pra pagar)
            })
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
        agora = datetime.now()
        # 1. Calcula o valor total de compras deste mês para este cartão
        cur.execute("""
            SELECT COALESCE(SUM(valor), 0) FROM financas 
            WHERE username = %s AND pagamento = %s 
            AND EXTRACT(MONTH FROM data) = %s AND EXTRACT(YEAR FROM data) = %s
            AND tipo = 'gasto'
        """, (dados['username'], dados['nome_cartao'], agora.month, agora.year))
        
        valor_fatura_mes = float(cur.fetchone()[0] or 0.0)
        
        if valor_fatura_mes <= 0:
            return {"status": "erro", "detalhe": "A fatura deste mês já está zerada!"}
        
        # 2. Abate apenas o valor do mês da dívida total do cartão
        cur.execute("""
            UPDATE cartoes 
            SET fatura_atual = GREATEST(fatura_atual - %s, 0) 
            WHERE username = %s AND nome_cartao = %s
        """, (valor_fatura_mes, dados['username'], dados['nome_cartao']))
        
        # 3. Registra o pagamento no histórico (para abater do saldo em conta)
        cur.execute("""
            INSERT INTO financas (username, tipo, descricao, valor, data, categoria, pagamento) 
            VALUES (%s, 'gasto', %s, %s, CURRENT_DATE, 'Pagamento', 'Saldo em Conta')
        """, (dados['username'], f"Pagamento Fatura ({agora.month}/{agora.year}): {dados['nome_cartao']}", valor_fatura_mes))
        
        conn.commit()
        return {"status": "sucesso", "mensagem": f"Fatura de {agora.month}/{agora.year} paga com sucesso!"}
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
  # ==========================================
# 6. WEBHOOK WHATSAPP AUTOMATION
# ==========================================
@router.post("/webhook/whatsapp")
async def webhook_whatsapp(request: Request):
    import json
    payload = await request.json()
    
    # Salva o log do payload recebido para diagnóstico
    try:
        with open("webhook_incoming.log", "a", encoding="utf-8") as f:
            f.write(f"\n--- Webhook Recebido: {datetime.now()} ---\n")
            f.write(json.dumps(payload, indent=2, ensure_ascii=False))
            f.write("\n")
    except Exception as log_ex:
        logging.error(f"Erro ao salvar log de webhook: {str(log_ex)}")
    
    # Verifica se é um evento de mensagem recebida
    event = payload.get("event")
    if event != "messages.upsert":
        return {"status": "ignorado", "motivo": "evento nao e messages.upsert"}
        
    data = payload.get("data", {})
    key = data.get("key", {})
    from_me = key.get("fromMe", False)
    
    # Ignora mensagens enviadas pelo próprio bot para evitar loops
    if from_me:
        return {"status": "ignorado", "motivo": "mensagem enviada pelo proprio bot"}
        
    # Extrai o número do WhatsApp do remetente
    remote_jid = key.get("remoteJid", "")
    if not remote_jid or ("@s.whatsapp.net" not in remote_jid and "@lid" not in remote_jid):
        return {"status": "ignorado", "motivo": "JID invalido"}
        
    whatsapp_num = remote_jid.split("@")[0] # Ex: "5524999681057" ou "139646617002175"
    
    # Extrai o texto da mensagem
    message_obj = data.get("message", {})
    text = ""
    if "conversation" in message_obj:
        text = message_obj["conversation"]
    elif "extendedTextMessage" in message_obj:
        text = message_obj["extendedTextMessage"].get("text", "")
        
    text = text.strip()
    if not text:
        return {"status": "ignorado", "motivo": "mensagem vazia"}
        
    # Identifica o usuário pelo número de WhatsApp no banco com normalização de 9º dígito e D.D.D.
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        # Garante a criação das tabelas necessárias
        cur.execute("""
            CREATE TABLE IF NOT EXISTS conversas_whatsapp (
                whatsapp VARCHAR(50) PRIMARY KEY,
                state VARCHAR(50) NOT NULL,
                temp_data TEXT,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.commit()
        
        # Puxa todos os usuários ativos
        cur.execute("SELECT username, nome_completo, whatsapp FROM usuarios WHERE whatsapp IS NOT NULL AND deletado = FALSE")
        rows = cur.fetchall()
        
        # Função interna de normalização de números brasileiros
        def normalizar_numero(num_str):
            clean = "".join(c for c in str(num_str) if c.isdigit())
            # Remove código de país se presente
            if clean.startswith("55") and len(clean) >= 10:
                clean = clean[2:]
            # Se tiver 11 dígitos e o terceiro for '9' (nono dígito), remove-o para normalizar em 10 dígitos
            if len(clean) == 11 and clean[2] == '9':
                clean = clean[:2] + clean[3:]
            return clean
            
        # Normaliza o remetente
        remetente_normalizado = normalizar_numero(whatsapp_num)
        
        user_match = None
        for r in rows:
            u_username, u_nome, u_whatsapp = r
            if normalizar_numero(u_whatsapp) == remetente_normalizado:
                user_match = (u_username, u_nome)
                break
                
        instance = payload.get("instance", "admin")
        
        if not user_match:
            # Envia resposta de erro amigável
            enviar_resposta_whatsapp(instance, remote_jid, "⚠️ *Olá!* Não encontrei nenhuma conta cadastrada em nossa plataforma associada a este número de WhatsApp. Por favor, acesse o painel, vá em *Meu Perfil* e cadastre o seu número de WhatsApp com o DDD (ex: 24999999999) para poder usar a automação!")
            return {"status": "usuario_nao_encontrado"}
            
        username, nome_completo = user_match
        nome = nome_completo if nome_completo else username
        
        # 1. Verifica se a mensagem corresponde a um comando direto do atalho rápido (Legado)
        partes = text.split(" ", 2)
        if len(partes) >= 2 and partes[0].lower() in ["gasto", "despesa", "receita", "recebimento"]:
            comando = partes[0].lower()
            valor_str = partes[1].replace(",", ".")
            try:
                valor = float(valor_str)
                descricao = partes[2] if len(partes) > 2 else "Lançamento rápido via WhatsApp"
                tipo = "despesa" if comando in ["gasto", "despesa"] else "receita"
                
                # Registra o lançamento
                from datetime import date
                cur.execute("""
                    INSERT INTO financas (username, tipo, descricao, valor, data, categoria, pagamento, status)
                    VALUES (%s, %s, %s, %s, %s, 'Outros', %s, 'pago')
                """, (username, tipo, descricao, valor, date.today().strftime("%Y-%m-%d"), "PIX" if tipo == "receita" else "Dinheiro"))
                conn.commit()
                
                tipo_label = "Despesa 📉" if tipo == "despesa" else "Receita 📈"
                valor_format = f"R$ {valor:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
                enviar_resposta_whatsapp(instance, remote_jid, f"✅ *Registro Rápido Efetuado!*\n\n• *Tipo:* {tipo_label}\n• *Valor:* {valor_format}\n• *Descrição:* {descricao}\n• *Data:* {date.today().strftime('%d/%m/%Y')}\n\nO seu painel já foi atualizado!")
                return {"status": "sucesso_atalho"}
            except ValueError:
                pass # Se falhar ao converter valor, segue para o funil interativo
                
        # 2. Recupera o estado atual do usuário no funil
        cur.execute("SELECT state, temp_data FROM conversas_whatsapp WHERE whatsapp = %s", (whatsapp_num,))
        state_row = cur.fetchone()
        
        menu_msg = f"👋 *Olá, {nome}!* Como posso ajudar você hoje?\n\n" \
                   f"Digite o número da opção desejada:\n" \
                   f"1️⃣ - Registrar Despesa / Gasto 📉\n" \
                   f"2️⃣ - Registrar Receita / Ganho 📈\n" \
                   f"3️⃣ - Ver Saldo do Mês 📊\n" \
                   f"4️⃣ - Ajuda / Como usar ❓"
                   
        if not state_row:
            # Novo contato / sem estado. Inicia e envia o menu
            cur.execute("INSERT INTO conversas_whatsapp (whatsapp, state, temp_data) VALUES (%s, 'MENU', NULL)", (whatsapp_num,))
            conn.commit()
            enviar_resposta_whatsapp(instance, remote_jid, menu_msg)
            return {"status": "menu_inicial"}
            
        state, temp_data_raw = state_row
        temp_data = json.loads(temp_data_raw) if temp_data_raw else {}
        
        # 3. Lógica do Menu Principal
        if state == "MENU":
            if text == "1":
                cur.execute("UPDATE conversas_whatsapp SET state = 'AGUARDANDO_VALOR_DESPESA' WHERE whatsapp = %s", (whatsapp_num,))
                conn.commit()
                enviar_resposta_whatsapp(instance, remote_jid, "📉 *Registrar Despesa*\n\nDigite o *valor* da despesa (ex: `15.50` ou `50`):")
            elif text == "2":
                cur.execute("UPDATE conversas_whatsapp SET state = 'AGUARDANDO_VALOR_RECEITA' WHERE whatsapp = %s", (whatsapp_num,))
                conn.commit()
                enviar_resposta_whatsapp(instance, remote_jid, "📈 *Registrar Receita*\n\nDigite o *valor* da receita/ganho (ex: `1500` ou `250.00`):")
            elif text == "3":
                # Mostra o saldo consolidado do mês atual
                from datetime import datetime as dt
                mes_atual = dt.now().month
                ano_atual = dt.now().year
                
                cur.execute("""
                    SELECT SUM(CASE 
                        WHEN LOWER(tipo) IN ('recebimento', 'receita') THEN valor 
                        WHEN LOWER(tipo) IN ('gasto', 'despesa') THEN -valor 
                        ELSE 0 END) 
                    FROM financas WHERE username = %s
                """, (username,))
                saldo_geral = float(cur.fetchone()[0] or 0.0)
                
                cur.execute("""
                    SELECT SUM(valor) FROM financas 
                    WHERE username = %s AND LOWER(tipo) IN ('recebimento', 'receita')
                    AND EXTRACT(MONTH FROM data) = %s AND EXTRACT(YEAR FROM data) = %s
                """, (username, mes_atual, ano_atual))
                receitas_mes = float(cur.fetchone()[0] or 0.0)
                
                cur.execute("""
                    SELECT SUM(valor) FROM financas 
                    WHERE username = %s AND LOWER(tipo) IN ('gasto', 'despesa')
                    AND EXTRACT(MONTH FROM data) = %s AND EXTRACT(YEAR FROM data) = %s
                """, (username, mes_atual, ano_atual))
                despesas_mes = float(cur.fetchone()[0] or 0.0)
                
                def fmt(val):
                    return f"R$ {val:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
                    
                saldo_msg = f"📊 *Resumo Financeiro - {mes_atual}/{ano_atual}*\n\n" \
                            f"📈 *Receitas (Mês):* {fmt(receitas_mes)}\n" \
                            f"📉 *Despesas (Mês):* {fmt(despesas_mes)}\n" \
                            f"💰 *Saldo Geral Acumulado:* {fmt(saldo_geral)}\n\n" \
                            f"Digite qualquer mensagem para voltar ao menu!"
                            
                cur.execute("DELETE FROM conversas_whatsapp WHERE whatsapp = %s", (whatsapp_num,))
                conn.commit()
                enviar_resposta_whatsapp(instance, remote_jid, saldo_msg)
            elif text == "4":
                ajuda = "❓ *Ajuda do Assistente Financeiro*\n\n" \
                        "Você pode interagir respondendo aos menus numerados ou usando os atalhos rápidos de mensagem única:\n\n" \
                        "👉 *Exemplo de Gasto rápido:* `gasto 45.90 mercado`\n" \
                        "👉 *Exemplo de Receita rápida:* `receita 1200 salario`\n\n" \
                        "Digite qualquer mensagem para retornar ao menu principal."
                cur.execute("DELETE FROM conversas_whatsapp WHERE whatsapp = %s", (whatsapp_num,))
                conn.commit()
                enviar_resposta_whatsapp(instance, remote_jid, ajuda)
            else:
                # Entrada inválida no menu principal, reenvia o menu
                enviar_resposta_whatsapp(instance, remote_jid, "⚠️ *Opção inválida.*\n\n" + menu_msg)
                
        # 4. Estados do Fluxo de Gasto (Despesa)
        elif state == "AGUARDANDO_VALOR_DESPESA":
            try:
                valor = float(text.replace(",", "."))
                temp_data["valor"] = valor
                cur.execute("UPDATE conversas_whatsapp SET state = 'AGUARDANDO_DESC_DESPESA', temp_data = %s WHERE whatsapp = %s", (json.dumps(temp_data), whatsapp_num))
                conn.commit()
                enviar_resposta_whatsapp(instance, remote_jid, "📝 *Descrição do Gasto*\n\nDigite o nome ou descrição do gasto (ex: `almoço` ou `posto shell`):")
            except ValueError:
                enviar_resposta_whatsapp(instance, remote_jid, "❌ *Valor inválido!* Por favor, digite apenas números decimais (ex: `15.50` ou `120`):")
                
        elif state == "AGUARDANDO_DESC_DESPESA":
            valor = temp_data.get("valor", 0.0)
            descricao = text
            from datetime import date
            
            cur.execute("""
                INSERT INTO financas (username, tipo, descricao, valor, data, categoria, pagamento, status)
                VALUES (%s, 'despesa', %s, %s, %s, 'Outros', 'Dinheiro', 'pago')
            """, (username, descricao, valor, date.today().strftime("%Y-%m-%d")))
            cur.execute("DELETE FROM conversas_whatsapp WHERE whatsapp = %s", (whatsapp_num,))
            conn.commit()
            
            valor_format = f"R$ {valor:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
            enviar_resposta_whatsapp(instance, remote_jid, f"✅ *Gasto Registrado com Sucesso!*\n\n• *Tipo:* Despesa 📉\n• *Valor:* {valor_format}\n• *Descrição:* {descricao}\n• *Data:* {date.today().strftime('%d/%m/%Y')}\n\nO seu painel financeiro foi atualizado!")
            
        # 5. Estados do Fluxo de Receita (Ganho)
        elif state == "AGUARDANDO_VALOR_RECEITA":
            try:
                valor = float(text.replace(",", "."))
                temp_data["valor"] = valor
                cur.execute("UPDATE conversas_whatsapp SET state = 'AGUARDANDO_DESC_RECEITA', temp_data = %s WHERE whatsapp = %s", (json.dumps(temp_data), whatsapp_num))
                conn.commit()
                enviar_resposta_whatsapp(instance, remote_jid, "📝 *Descrição da Receita*\n\nDigite o nome ou descrição do recebimento (ex: `salário` ou `PIX joão`):")
            except ValueError:
                enviar_resposta_whatsapp(instance, remote_jid, "❌ *Valor inválido!* Por favor, digite apenas números decimais (ex: `1500` ou `250.50`):")
                
        elif state == "AGUARDANDO_DESC_RECEITA":
            valor = temp_data.get("valor", 0.0)
            descricao = text
            from datetime import date
            
            cur.execute("""
                INSERT INTO financas (username, tipo, descricao, valor, data, categoria, pagamento, status)
                VALUES (%s, 'receita', %s, %s, %s, 'Outros', 'PIX', 'pago')
            """, (username, descricao, valor, date.today().strftime("%Y-%m-%d")))
            cur.execute("DELETE FROM conversas_whatsapp WHERE whatsapp = %s", (whatsapp_num,))
            conn.commit()
            
            valor_format = f"R$ {valor:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
            enviar_resposta_whatsapp(instance, remote_jid, f"✅ *Receita Registrada com Sucesso!*\n\n• *Tipo:* Receita 📈\n• *Valor:* {valor_format}\n• *Descrição:* {descricao}\n• *Data:* {date.today().strftime('%d/%m/%Y')}\n\nO seu painel financeiro foi atualizado!")
            
        return {"status": "sucesso"}
        
    except Exception as e:
        conn.rollback()
        logging.error(f"Erro no webhook WhatsApp: {str(e)}")
        return {"status": "erro", "detalhe": str(e)}
    finally:
        cur.close()
        conn.close()

def enviar_resposta_whatsapp(instance: str, remote_jid: str, text: str):
    import requests as req
    try:
        url = f"http://192.168.29.221:8081/message/sendText/{instance}"
        headers = {
            "apikey": "TNINFO_MASTER_KEY_123",
            "Content-Type": "application/json"
        }
        payload = {
            "number": remote_jid,  # Envia diretamente para o JID completo (@s.whatsapp.net ou @lid) para evitar problemas de roteamento
            "text": text,
            "delay": 1200,
            "linkPreview": False
        }
        res = req.post(url, json=payload, headers=headers, timeout=10)
        logging.info(f"Envio WhatsApp status: {res.status_code}")
    except Exception as e:
        logging.error(f"Falha ao enviar resposta de WhatsApp: {str(e)}")
