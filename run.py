import uvicorn
import os
from main import app

if __name__ == "__main__":
    print("\n" + "="*50)
    print(" 🚀 INICIANDO MTCONNECT V2 (MODO DE COMPATIBILIDADE)")
    print("="*50)
    print("\n🌍 Acesse no navegador: http://localhost:8000")
    print("🛠️  Pressione CTRL+C para parar o servidor\n")
    
    uvicorn.run(app, host="0.0.0.0", port=8000)
