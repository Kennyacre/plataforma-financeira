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
app.mount("/", StaticFiles(directory="frontend", html=True), name="frontend")