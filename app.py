import streamlit as st
import pandas as pd
import altair as alt
import gspread
from google.oauth2.service_account import Credentials
import json
import time
from datetime import datetime, date
from dateutil.relativedelta import relativedelta

st.set_page_config(page_title="Smart Gestão Financeira", layout="wide")

# --- 1. CONEXÃO COM O GOOGLE SHEETS ---
@st.cache_resource
def conectar_google():
    scopes = ["https://www.googleapis.com/auth/spreadsheets", "https://www.googleapis.com/auth/drive"]
    cred_dict = json.loads(st.secrets["GOOGLE_CREDENTIALS"])
    creds = Credentials.from_service_account_info(cred_dict, scopes=scopes)
    cliente = gspread.authorize(creds)
    return cliente.open("Gestor_SaaS")

try:
    planilha = conectar_google()
    aba_usuarios_db = planilha.worksheet("Usuarios")
except Exception as e:
    st.error(f"🚨 Erro de Conexão: {e}")
    st.stop()

# --- 2. CONTROLE DE NAVEGAÇÃO ---
if "logado" not in st.session_state:
    st.session_state.logado = False
    st.session_state.usuario = "" 
    st.session_state.nivel = ""
if "tela_atual" not in st.session_state:
    st.session_state.tela_atual = "login"

# ==========================================
# DESIGN E TELA DE LOGIN (ESTILO SMART GESTÃO)
# ==========================================
if not st.session_state.logado:
    st.markdown("""
        <style>
        /* Fundo da Landing Page */
        .stApp { background-color: #f0f2f5 !important; }
        
        /* Container do Login */
        div[data-testid="stForm"] { 
            background-color: #ffffff !important; 
            padding: 50px 40px !important; 
            border-radius: 12px !important; 
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04) !important;
            border: none !important;
        }
        
        /* Títulos e Labels */
        h1 { color: #004aad !important; font-weight: 800 !important; font-family: 'Inter', sans-serif !important; }
        p { color: #4b5563 !important; font-size: 1.1em !important; }
        label { color: #374151 !important; font-weight: 500 !important; }
        
        /* Inputs */
        input { 
            border: 1px solid #d1d5db !important; 
            border-radius: 6px !important; 
            padding: 12px !important;
        }

        /* Botão Smart Blue */
        button[kind="primary"] { 
            background-color: #004aad !important; 
            border: none !important;
            padding: 12px !important;
            font-weight: bold !important;
            text-transform: uppercase !important;
            letter-spacing: 1px !important;
        }
        button[kind="primary"]:hover { background-color: #003580 !important; }
        
        /* Link Secundário */
        button[kind="secondary"] { 
            background-color: transparent !important; 
            color: #004aad !important; 
            border: none !important;
            text-decoration: underline !important;
        }
        </style>
    """, unsafe_allow_html=True)

    c1, c2, c3 = st.columns([1, 1.2, 1])
    with c2:
        st.write("")
        st.markdown("<h1 style='text-align: center;'>Smart Gestão</h1>", unsafe_allow_html=True)
        
        if st.session_state.tela_atual == "login":
            st.markdown("<p style='text-align: center;'>Acesse sua conta para gerenciar suas finanças</p>", unsafe_allow_html=True)
            with st.form("login_smart"):
                u_input = st.text_input("E-mail ou Usuário")
                p_input = st.text_input("Senha", type="password")
                if st.form_submit_button("Entrar no Painel", type="primary"):
                    df_u = pd.DataFrame(aba_usuarios_db.get_all_records())
                    match = df_u[((df_u["Usuario"].astype(str) == u_input) | (df_u["Email"].astype(str) == u_input)) & (df_u["Senha"].astype(str) == p_input)]
                    if not match.empty:
                        if match.iloc[0]["Status"].lower() == "ativo":
                            st.session_state.logado = True
                            st.session_state.usuario = match.iloc[0]["Usuario"]
                            st.session_state.nivel = match.iloc[0]["Nivel"]
                            st.rerun()
                        else: st.error("Conta suspensa.")
                    else: st.error("Dados incorretos.")
            
            if st.button("Não tem conta? Registre-se aqui", type="secondary"):
                st.session_state.tela_atual = "cadastro"
                st.rerun()

        elif st.session_state.tela_atual == "cadastro":
            st.markdown("<p style='text-align: center;'>Crie sua conta gratuita agora</p>", unsafe_allow_html=True)
            with st.form("cadastro_smart"):
                n = st.text_input("Nome Completo")
                e = st.text_input("E-mail")
                s = st.text_input("Crie uma Senha", type="password")
                sc = st.text_input("Confirme a Senha", type="password")
                if st.form_submit_button("Finalizar Cadastro", type="primary"):
                    if s == sc and e:
                        aba_usuarios_db.append_row([e, s, "Cliente", "Ativo", "0", "", n, e, ""])
                        st.success("Conta criada!")
                        time.sleep(1); st.session_state.tela_atual = "login"; st.rerun()
                    else: st.error("Verifique as senhas.")
            if st.button("Já sou cliente? Entrar", type="secondary"):
                st.session_state.tela_atual = "login"; st.rerun()

# ==========================================
# DASHBOARD (MODO DASHBOARD PROFISSIONAL)
# ==========================================
else:
    st.markdown("""
        <style>
        .stApp { background-color: #f8f9fa !important; }
        /* Sidebar */
        section[data-testid="stSidebar"] { background-color: #ffffff !important; border-right: 1px solid #dee2e6; }
        section[data-testid="stSidebar"] h1, section[data-testid="stSidebar"] p { color: #004aad !important; }
        
        /* Dashboard Cards */
        div[data-testid="stMetric"] { 
            background-color: #ffffff !important; 
            border: 1px solid #edf2f7 !important; 
            border-radius: 10px !important; 
            padding: 20px !important;
            box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1) !important;
        }
        div[data-testid="stMetric"] label { color: #64748b !important; text-transform: uppercase; font-size: 0.8em; letter-spacing: 1px; }
        div[data-testid="stMetricValue"] { color: #1e293b !important; font-weight: bold !important; }

        /* Tabelas */
        div[data-testid="stDataFrame"] { border-radius: 10px !important; overflow: hidden !important; border: 1px solid #e2e8f0 !important; }
        </style>
    """, unsafe_allow_html=True)

    st.sidebar.markdown(f"# Smart Gestão")
    st.sidebar.markdown(f"👤 {st.session_state.usuario}")
    if st.sidebar.button("Sair"):
        st.session_state.logado = False
        st.rerun()

    # Logica de Abas do Cliente (Exemplo)
    if st.session_state.nivel.lower() == "cliente":
        st.title("Resumo Financeiro")
        
        # Simulação de Dados para visualização do design
        c1, c2, c3 = st.columns(3)
        c1.metric("Receitas", "R$ 0,00", "+0%")
        c2.metric("Despesas", "R$ 0,00", "-0%")
        c3.metric("Saldo Atual", "R$ 0,00")
        
        st.markdown("---")
        st.subheader("Últimas Movimentações")
        st.info("Nenhum dado encontrado. Comece adicionando um lançamento no menu lateral.")

    # Painel Master
    else:
        st.title("Painel Administrativo Master")
        st.write("Gerencie seus clientes e planos abaixo.")
