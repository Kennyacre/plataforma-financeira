import streamlit as st
import pandas as pd
import gspread
from google.oauth2.service_account import Credentials
import json

st.set_page_config(page_title="Gestor SaaS", layout="centered")

# --- 1. CONEXÃO SEGURA COM O GOOGLE SHEETS ---
@st.cache_resource
def conectar_google():
    scopes = ["https://www.googleapis.com/auth/spreadsheets", "https://www.googleapis.com/auth/drive"]
    cred_dict = json.loads(st.secrets["GOOGLE_CREDENTIALS"])
    creds = Credentials.from_service_account_info(cred_dict, scopes=scopes)
    cliente = gspread.authorize(creds)
    return cliente.open("Gestor_SaaS")

try:
    planilha = conectar_google()
except Exception as e:
    st.error(f"🚨 Falha na conexão: {e}")
    st.stop()

# --- 2. CONTROLE DE SESSÃO (LOGIN) ---
if "logado" not in st.session_state:
    st.session_state.logado = False
    st.session_state.usuario = ""
    st.session_state.nivel = ""

# --- 3. TELA DE LOGIN ---
if not st.session_state.logado:
    st.title("🦅 Plataforma Gestor Financeiro")
    st.markdown("Faça login para acessar o seu painel.")

    with st.form("form_login"):
        usuario_input = st.text_input("Usuário")
        senha_input = st.text_input("Senha", type="password")
        btn_login = st.form_submit_button("ENTRAR NA PLATAFORMA")

        if btn_login:
            try:
                aba_usuarios = planilha.worksheet("Usuarios")
                df_users = pd.DataFrame(aba_usuarios.get_all_records())
                user_match = df_users[(df_users["Usuario"].astype(str) == usuario_input) & (df_users["Senha"].astype(str) == senha_input)]

                if not user_match.empty:
                    status = user_match.iloc[0]["Status"]
                    if status.lower() == "ativo":
                        st.session_state.logado = True
                        st.session_state.usuario = usuario_input
                        st.session_state.nivel = user_match.iloc[0]["Nivel"]
                        st.rerun()
                    else:
                        st.error("⛔ Conta bloqueada por falta de pagamento. Contate o suporte.")
                else:
                    st.error("❌ Usuário ou senha incorretos.")
            except Exception as e:
                st.error("Aba 'Usuarios' não encontrada na planilha. Crie-a conforme as instruções!")

# --- 4. SISTEMA LOGADO ---
else:
    st.sidebar.title(f"👤 Olá, {st.session_state.usuario}")
    st.sidebar.markdown(f"**Nível de Acesso:** {st.session_state.nivel}")
    if st.sidebar.button("Sair / Logout"):
        st.session_state.logado = False
        st.rerun()

    if st.session_state.nivel.lower() == "master":
        st.title("👑 Painel de Administração SaaS")
        st.success("Bem-vindo à central de controle. Aqui você gerencia quem paga e quem não paga.")
        try:
            df_users = pd.DataFrame(planilha.worksheet("Usuarios").get_all_records())
            st.dataframe(df_users, use_container_width=True)
        except:
            st.warning("Não foi possível carregar os usuários.")

    else:
        st.title(f"📊 Painel Financeiro - Cliente: {st.session_state.usuario}")
        st.info("O Código do Gestor Financeiro entrará aqui! Ele salvará os dados em uma aba exclusiva deste cliente no seu Google Sheets.")
