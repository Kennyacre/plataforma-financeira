import streamlit as st
import pandas as pd
import gspread
from google.oauth2.service_account import Credentials
import json
from datetime import date

st.set_page_config(page_title="Gestor SaaS", layout="wide")

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
    st.error(f"🚨 Falha na conexão com o Banco de Dados. Detalhe: {e}")
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
                st.error(f"Erro ao ler banco de dados: {e}")

# --- 4. SISTEMA LOGADO ---
else:
    st.sidebar.title(f"👤 Olá, {st.session_state.usuario}")
    st.sidebar.markdown(f"**Nível:** {st.session_state.nivel}")
    if st.sidebar.button("Sair / Logout"):
        st.session_state.logado = False
        st.rerun()

    # ==========================================
    # ROTA A: PAINEL MASTER (ADMINISTRAÇÃO SaaS)
    # ==========================================
    if st.session_state.nivel.lower() == "master":
        st.title("👑 Central de Comando SaaS")
        
        aba_usuarios = planilha.worksheet("Usuarios")
        df_users = pd.DataFrame(aba_usuarios.get_all_records())

        # Criando as 3 Abas de Administração
        tab1, tab2, tab3 = st.tabs(["📋 Lista de Clientes", "➕ Cadastrar Cliente", "✏️ Editar / Bloquear"])

        # ABA 1: LISTA
        with tab1:
            st.markdown("### Visão Geral de Assinantes")
            st.dataframe(df_users, use_container_width=True)

        # ABA 2: NOVO CLIENTE
        with tab2:
            st.markdown("### Adicionar Novo Cliente")
            with st.form("novo_cliente"):
                c1, c2 = st.columns(2)
                n_user = c1.text_input("Nome de Usuário (Login)")
                n_senha = c2.text_input("Senha")
                n_nivel = c1.selectbox("Nível de Acesso", ["Cliente", "Master"])
                n_status = c2.selectbox("Status da Conta", ["Ativo", "Bloqueado"])
                n_valor = c1.number_input("Valor da Mensalidade (R$)", min_value=0.0, step=10.0)
                n_venc = c2.date_input("Data de Vencimento")
                
                if st.form_submit_button("SALVAR NOVO CLIENTE"):
                    if n_user in df_users["Usuario"].values:
                        st.error("Este nome de usuário já existe! Escolha outro.")
                    elif n_user and n_senha:
                        # Grava na planilha do Google na hora
                        data_str = n_venc.strftime('%d/%m/%Y')
                        aba_usuarios.append_row([n_user, n_senha, n_nivel, n_status, str(n_valor), data_str])
                        st.success("Cliente cadastrado com sucesso!")
                        st.rerun()
                    else:
                        st.warning("Preencha usuário e senha.")

        # ABA 3: EDITAR CLIENTE (O Módulo de Bloqueio/Cobrança)
        with tab3:
            st.markdown("### Gerenciar ou Bloquear Cliente")
            cliente_sel = st.selectbox("Selecione o Cliente:", [""] + df_users["Usuario"].tolist())
            
            if cliente_sel:
                # Localiza os dados atuais do cliente escolhido
                row_data = df_users[df_users["Usuario"] == cliente_sel].iloc[0]
                
                with st.form("editar_cliente"):
                    c1, c2 = st.columns(2)
                    e_senha = c1.text_input("Senha", value=str(row_data.get("Senha", "")))
                    e_nivel = c2.selectbox("Nível", ["Cliente", "Master"], index=0 if row_data.get("Nivel", "") == "Cliente" else 1)
                    
                    e_status = c1.selectbox("Status", ["Ativo", "Bloqueado"], index=0 if row_data.get("Status", "") == "Ativo" else 1)
                    e_valor = c2.number_input("Valor (R$)", value=float(str(row_data.get("Valor", 0)).replace(',','.')), step=10.0)

                    # Tenta converter a data que está na planilha
                    try:
                        venc_formatado = pd.to_datetime(row_data.get("Vencimento", ""), format='%d/%m/%Y').date()
                    except:
                        venc_formatado = date.today()

                    e_venc = st.date_input("Vencimento", value=venc_formatado)

                    if st.form_submit_button("ATUALIZAR DADOS"):
                        # Procura a linha exata no Google Sheets para atualizar
                        celula = aba_usuarios.find(cliente_sel, in_column=1)
                        linha = celula.row
                        
                        # Atualiza as colunas B, C, D, E e F
                        aba_usuarios.update_cell(linha, 2, e_senha)
                        aba_usuarios.update_cell(linha, 3, e_nivel)
                        aba_usuarios.update_cell(linha, 4, e_status)
                        aba_usuarios.update_cell(linha, 5, str(e_valor))
                        aba_usuarios.update_cell(linha, 6, e_venc.strftime('%d/%m/%Y'))
                        
                        st.success(f"Dados do cliente {cliente_sel} atualizados!")
                        st.rerun()

    # ==========================================
    # ROTA B: PAINEL DO CLIENTE (Módulo Financeiro)
    # ==========================================
    else:
        st.title(f"📊 Painel Financeiro - Cliente: {st.session_state.usuario}")
        st.info("Aqui vai entrar o sistema financeiro escuro (Dark Mode) que criamos antes. Ele será carregado em breve!")
