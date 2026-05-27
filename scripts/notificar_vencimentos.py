import pg8000
import requests as req
import os
import logging
from datetime import date, datetime
from dotenv import load_dotenv

# Configura o logger
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

# Carrega variáveis de ambiente
load_dotenv()

DB_CONFIG = {
    "database": os.getenv("POSTGRES_DB", "TN_INFO_DATABASE"),
    "user": os.getenv("POSTGRES_USER", "postgres"),
    "password": os.getenv("POSTGRES_PASSWORD", "451630"),
    "host": os.getenv("POSTGRES_HOST", "db_postgres"),
    "port": int(os.getenv("POSTGRES_PORT", 5432))
}

API_KEY = "TNINFO_MASTER_KEY_123"
INSTANCE = "admin"  # Instância padrão do WhatsApp

# Tenta diferentes caminhos para a Evolution API (Host IP, localhost e nome do container)
URL_CANDIDATES = [
    f"http://192.168.29.221:8081/message/sendText/{INSTANCE}",
    f"http://evolution_api:8080/message/sendText/{INSTANCE}",
    f"http://localhost:8081/message/sendText/{INSTANCE}"
]

def enviar_whatsapp(numero, texto):
    payload = {
        "number": numero,
        "text": texto,
        "delay": 1000,
        "linkPreview": False
    }
    
    headers = {
        "apikey": API_KEY,
        "Content-Type": "application/json"
    }
    
    for url in URL_CANDIDATES:
        try:
            logging.info(f"Tentando enviar mensagem para {numero} via {url}...")
            res = req.post(url, json=payload, headers=headers, timeout=10)
            if res.status_code in [200, 201]:
                logging.info(f"Mensagem enviada com sucesso para {numero}!")
                return True
            else:
                logging.warning(f"Resposta inesperada de {url}: {res.status_code} - {res.text}")
        except Exception as e:
            logging.error(f"Erro ao enviar via {url}: {str(e)}")
            
    logging.error(f"Falha total ao enviar mensagem para {numero} em todas as URLs candidatas.")
    return False

def processar_notificacoes():
    logging.info("Iniciando varredura diária de vencimentos...")
    
    try:
        conn = pg8000.connect(**DB_CONFIG)
        cur = conn.cursor()
    except Exception as e:
        logging.error(f"Erro ao conectar ao banco de dados: {str(e)}")
        return
        
    try:
        # Busca usuários ativos que não estão deletados e possuem whatsapp cadastrado
        cur.execute("""
            SELECT username, nome_completo, whatsapp, vencimento 
            FROM usuarios 
            WHERE deletado = FALSE 
            AND status = 'ativo' 
            AND LOWER(role) = 'cliente' 
            AND whatsapp IS NOT NULL
        """)
        
        usuarios = cur.fetchall()
        hoje = date.today()
        
        total_processados = 0
        total_enviados = 0
        
        for u in usuarios:
            username, nome_completo, whatsapp_raw, vencimento_date = u
            
            if not vencimento_date:
                continue
                
            # Limpa o número de WhatsApp (mantém apenas dígitos)
            whatsapp = "".join(c for c in str(whatsapp_raw) if c.isdigit())
            if not whatsapp:
                continue
                
            # Calcula a diferença de dias
            dias_restantes = (vencimento_date - hoje).days
            vencimento_formatado = vencimento_date.strftime("%d/%m/%Y")
            nome = nome_completo if nome_completo else username
            
            mensagem = ""
            if dias_restantes == 3:
                mensagem = (
                    f"👋 *Olá, {nome}!*\n\n"
                    f"Passando para lembrar que sua assinatura de nossa plataforma expira em *3 dias* (no dia {vencimento_formatado}).\n\n"
                    f"Para evitar qualquer interrupção em seu acesso, você pode realizar a renovação a qualquer momento. Se precisar de ajuda ou dos dados de pagamento, por favor, responda a esta mensagem! 😊"
                )
            elif dias_restantes == 1:
                mensagem = (
                    f"⚠️ *Aviso Importante, {nome}!*\n\n"
                    f"Sua assinatura de nossa plataforma expira *amanhã* (no dia {vencimento_formatado}).\n\n"
                    f"Evite o bloqueio automático de sua conta realizando a renovação. Para renovar, basta acessar o painel financeiro ou responder diretamente a esta mensagem para falar conosco! 📲"
                )
            elif dias_restantes == 0:
                mensagem = (
                    f"🚨 *Aviso Urgente, {nome}!*\n\n"
                    f"Sua assinatura de nossa plataforma *vence hoje* ({vencimento_formatado}).\n\n"
                    f"Para continuar gerenciando suas finanças e utilizando nossos recursos sem interrupções, realize a renovação agora mesmo! Entre em contato conosco respondendo a esta mensagem. 💳"
                )
                
            if mensagem:
                total_processados += 1
                logging.info(f"Usuário {username} vence em {dias_restantes} dias. Enviando notificação...")
                if enviar_whatsapp(whatsapp, mensagem):
                    total_enviados += 1
                    
        logging.info(f"Varredura concluída. Encontrados {total_processados} usuários para notificar. Enviadas {total_enviados} mensagens.")
        
    except Exception as e:
        logging.error(f"Erro durante o processamento das notificações: {str(e)}")
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    processar_notificacoes()
