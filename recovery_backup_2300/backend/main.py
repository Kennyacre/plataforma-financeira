from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import psycopg2
from datetime import datetime
import calendar # Usando a biblioteca nativa do Python (Não precisa instalar nada!)

app = FastAPI(title="API TN INFO")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_CONFIG = {
    "dbname": "TN_INFO_DATABASE", 
    "user": "postgres",           
    "password": "admin123", 
    "host": "127.0.0.1",
    "port": 5432   # <--- TROQUE DE 5433 PARA 5432 AQUI!
}

# --- 1. CRIAR TABELAS AUTOMATICAMENTE AO LIGAR O SERVIDOR ---
@app.on_event("startup")
def startup_db():
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS financas (
            id SERIAL PRIMARY KEY,
            username VARCHAR(50),
            tipo VARCHAR(20),
            descricao VARCHAR(255),
            valor NUMERIC(15, 2),
            data DATE,
            categoria VARCHAR(50),
            pagamento VARCHAR(50)
        )
    """)
    conn.commit()
    cur.close()
    conn.close()

# --- 2. MODELOS DE DADOS ---
class LoginRequest(BaseModel):
    username: str
    password: str

class LancamentoRequest(BaseModel):
    username: str
    tipo: str
    descricao: str
    valor: float
    data: str
    categoria: str
    pagamento: str
    repetir: str
    quantidade: int

# --- FUNÇÃO MATEMÁTICA NATIVA (Sem depender do Docker) ---
def somar_meses(data_original, meses_para_somar):
    mes = data_original.month - 1 + meses_para_somar
    ano = data_original.year + mes // 12
    mes = mes % 12 + 1
    dia = min(data_original.day, calendar.monthrange(ano, mes)[1])
    return data_original.replace(year=ano, month=mes, day=dia)

# --- 3. ROTAS DE API ---
@app.post("/api/login")
def login(request: LoginRequest):
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()
        cur.execute("SELECT password, role FROM usuarios WHERE username = %s", (request.username,))
        user = cur.fetchone()
        cur.close()
        conn.close()

        if user is None:
            raise HTTPException(status_code=401, detail="Usuário não encontrado")
        
        db_password, role = user
        if request.password != db_password:
            raise HTTPException(status_code=401, detail="Senha incorreta")

        return {"status": "sucesso", "role": role}
    except psycopg2.Error as e:
        raise HTTPException(status_code=500, detail=f"Erro de DB: {e}")

@app.post("/api/lancamentos")
def novo_lancamento(request: LancamentoRequest):
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()

        data_base = datetime.strptime(request.data, "%Y-%m-%d")
        qtd = request.quantidade if request.repetir == "sim" else 1

        for i in range(qtd):
            data_atual = somar_meses(data_base, i)
            cur.execute("""
                INSERT INTO financas (username, tipo, descricao, valor, data, categoria, pagamento)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, (
                request.username, request.tipo, request.descricao, 
                request.valor, data_atual.strftime("%Y-%m-%d"), 
                request.categoria, request.pagamento
            ))

        conn.commit()
        cur.close()
        conn.close()
        return {"status": "sucesso", "mensagem": f"{qtd} lançamento(s) registrado(s)!"}
    
    except Exception as e:
        print(f"ERRO PYTHON: {e}")
        raise HTTPException(status_code=500, detail=f"Erro ao salvar: {e}")

@app.get("/api/lancamentos/{username}")
def buscar_lancamentos(username: str):
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()
        cur.execute("""
            SELECT id, tipo, descricao, valor, data, categoria, pagamento 
            FROM financas 
            WHERE username = %s 
            ORDER BY data DESC
        """, (username,))
        
        linhas = cur.fetchall()
        cur.close()
        conn.close()

        lancamentos = []
        for linha in linhas:
            lancamentos.append({
                "id": linha[0],
                "tipo": linha[1],
                "descricao": linha[2],
                "valor": float(linha[3]), # Garante que volta como numero decimal
                "data": linha[4].strftime("%d/%m/%Y"),
                "categoria": linha[5].capitalize(),
                "pagamento": linha[6].capitalize()
            })
            
        return {"status": "sucesso", "dados": lancamentos}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao buscar dados: {e}")

# --- ROTA DE CALCULAR O RESUMO DO PAINEL ---
@app.get("/api/dashboard-stats/{username}")
def get_dashboard_stats(username: str):
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()
        
        # Soma as Receitas
        cur.execute("SELECT SUM(valor) FROM financas WHERE username = %s AND tipo = 'recebimento'", (username,))
        receitas = cur.fetchone()[0]
        receitas = float(receitas) if receitas else 0.0
        
        # Soma as Despesas
        cur.execute("SELECT SUM(valor) FROM financas WHERE username = %s AND tipo = 'gasto'", (username,))
        despesas = cur.fetchone()[0]
        despesas = float(despesas) if despesas else 0.0
        
        cur.close()
        conn.close()

        # Calcula o Saldo
        saldo = receitas - despesas

        return {
            "status": "sucesso", 
            "receitas": receitas, 
            "despesas": despesas, 
            "saldo": saldo
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao calcular: {e}")
    
app.mount("/", StaticFiles(directory=".", html=True), name="static")