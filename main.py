from fastapi import FastAPI
from fastapi.responses import FileResponse

from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from core.database import startup_db
from routes import auth, revenda, admin, financeiro 
import os
from dotenv import load_dotenv
load_dotenv()

app = FastAPI(title="API TN INFO MODULAR")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    startup_db()

# Aqui ligamos o motor de Login e os outros!
app.include_router(auth.router)
# app.include_router(revenda.router)  # Arquivado para ideias futuras
app.include_router(admin.router)
app.include_router(financeiro.router)

# --- ROTAS PARA O PWA (Aplicativo Mobile) ---

@app.get("/manifest.json", include_in_schema=False)
async def serve_manifest():
    return FileResponse("manifest.json", media_type="application/manifest+json")

@app.get("/sw.js", include_in_schema=False)
async def serve_sw():
    return FileResponse("sw.js", media_type="application/javascript")

app.mount("/static", StaticFiles(directory="static"), name="static")

# ROTA DE DIAGNÓSTICO TEMPORÁRIA
@app.get("/api/debug", include_in_schema=False)
def debug_system():
    """Diagnóstico completo do sistema - verificar banco e dados"""
    from core.database import get_db_connection
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Usuários
        cur.execute("SELECT username, role, status, deletado FROM usuarios ORDER BY id")
        usuarios = [{"u": r[0], "role": r[1], "status": r[2], "del": r[3]} for r in cur.fetchall()]
        
        # Lançamentos por user
        cur.execute("SELECT username, COUNT(*), MIN(data::text), MAX(data::text) FROM financas GROUP BY username")
        lancamentos = [{"u": r[0], "total": r[1], "min": r[2], "max": r[3]} for r in cur.fetchall()]
        
        # Teste query de lancamentos da dudinha
        cur.execute("SELECT id FROM usuarios WHERE username = 'dudinha' AND deletado IS NOT TRUE")
        dudinha_ok = cur.fetchone() is not None
        
        cur.execute("SELECT id FROM usuarios WHERE username = 'dudinha' AND deletado = FALSE")
        dudinha_ok_old = cur.fetchone() is not None
        
        cur.execute("SELECT COUNT(*) FROM financas WHERE username = 'dudinha'")
        dudinha_financas = cur.fetchone()[0]
        
        # Verificar valores do campo 'tipo'
        cur.execute("SELECT tipo, COUNT(*) FROM financas WHERE username = 'dudinha' GROUP BY tipo")
        tipos = [{"tipo": r[0], "count": r[1]} for r in cur.fetchall()]
        
        # Amostra de 3 lançamentos
        cur.execute("SELECT id, tipo, descricao, valor::text, data::text, categoria, pagamento FROM financas WHERE username = 'dudinha' ORDER BY data DESC LIMIT 3")
        amostra = [{"id": r[0], "tipo": r[1], "desc": r[2], "valor": r[3], "data": r[4], "cat": r[5], "pag": r[6]} for r in cur.fetchall()]
        
        cur.execute("SELECT COUNT(*) FROM cartoes WHERE username = 'dudinha'")
        dudinha_cartoes = cur.fetchone()[0]
        
        cur.close(); conn.close()
        return {
            "status": "ok",
            "db_config": {"host": "db_postgres", "db": "TN_INFO_DATABASE"},
            "usuarios": usuarios,
            "lancamentos_por_user": lancamentos,
            "teste_dudinha": {
                "query_IS_NOT_TRUE": dudinha_ok,
                "query_equal_FALSE": dudinha_ok_old,
                "total_financas": dudinha_financas,
                "total_cartoes": dudinha_cartoes,
                "tipos_no_banco": tipos,
                "amostra_lancamentos": amostra
            }
        }
    except Exception as e:
        return {"status": "ERRO", "erro": str(e)}

app.mount("/", StaticFiles(directory="frontend", html=True), name="frontend")

if __name__ == "__main__":
    import uvicorn
    print("\n🚀 SISTEMA MTCONNECT V2 INICIADO!")
    print("🌍 Acesse: http://localhost:8000")
    uvicorn.run(app, host="0.0.0.0", port=8000)