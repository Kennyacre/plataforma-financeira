import streamlit as st
import pandas as pd
import altair as alt
import gspread
from google.oauth2.service_account import Credentials
import json
import time
import calendar
from datetime import datetime, date
from dateutil.relativedelta import relativedelta

st.set_page_config(page_title="Plataforma SaaS", layout="wide")

# ==========================================
# ⚙️ CONFIGURAÇÕES DA SUA MARCA E PAGAMENTO (WHITE-LABEL)
# ==========================================
NOME_SAAS = "MT Connect Stays" # Altere para o nome da sua empresa
LOGO_URL = "https://cdn-icons-png.flaticon.com/512/2942/2942269.png" # Link de uma imagem PNG para a sua logo
CHAVE_PIX = "seu-email-ou-cpf@pix.com.br"
NOME_RECEBEDOR = "Kenny / MT Connect"
# ==========================================

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
    aba_usuarios_db = planilha.worksheet("Usuarios")
except Exception as e:
    st.error(f"🚨 Falha na conexão com a Base de Dados. Detalhe: {e}")
    st.stop()

# --- 2. CONTROLE DE SESSÃO ---
if "logado" not in st.session_state:
    st.session_state.logado = False
    st.session_state.usuario = "" 
    st.session_state.nivel = ""
if "tela_atual" not in st.session_state:
    st.session_state.tela_atual = "login"
if "edit_user" not in st.session_state:
    st.session_state.edit_user = ""
if "edit_conta" not in st.session_state:
    st.session_state.edit_conta = ""

# ==========================================
# ROTA 1: TELA INICIAL (LOGIN E CADASTRO)
# ==========================================
if not st.session_state.logado:
    st.markdown("""
        <style>
        .stApp { background-color: #1e2532 !important; }
        div[data-testid="stForm"] { background-color: transparent !important; border: none !important; padding: 0 !important; box-shadow: none !important; }
        .stApp h1, .stApp h2 { color: #ffffff !important; font-weight: 700 !important; font-family: 'Segoe UI', sans-serif !important; }
        .stApp p, .stApp label, .stApp span { color: #cbd5e1 !important; font-family: 'Segoe UI', sans-serif !important; }
        .stTextInput input { background-color: #1a202c !important; color: #ffffff !important; border: 1px solid #334155 !important; border-radius: 8px !important; padding: 12px 15px !important; }
        .stTextInput input:focus { border-color: #3b82f6 !important; box-shadow: 0 0 0 1px #3b82f6 !important; }
        button[kind="primary"] { background-color: #2563eb !important; color: white !important; border: none !important; border-radius: 8px !important; font-weight: 600 !important; padding: 10px 0 !important; margin-top: 15px !important; }
        button[kind="primary"]:hover { background-color: #1d4ed8 !important; }
        button[kind="secondary"] { background-color: transparent !important; color: #3b82f6 !important; border: none !important; box-shadow: none !important; font-weight: 600 !important; }
        button[kind="secondary"]:hover { color: #60a5fa !important; text-decoration: underline !important; background-color: transparent !important; }
        .link-azul { color: #3b82f6 !important; text-decoration: none; font-size: 14px; font-weight: 500; }
        </style>
        """, unsafe_allow_html=True)

    col1, col2, col3 = st.columns([1, 1.2, 1])
    
    with col2:
        st.write(""); st.write("")
        
        if st.session_state.tela_atual == "login":
            # Aplicação do Branding (Marca)
            st.markdown(f"<div style='text-align: center;'><img src='{LOGO_URL}' width='60'></div>", unsafe_allow_html=True)
            st.markdown(f"<h2 style='text-align: center; margin-bottom: 5px;'>{NOME_SAAS}</h2>", unsafe_allow_html=True)
            st.markdown("<p style='text-align: center; margin-bottom: 30px;'>Acesse a sua plataforma financeira</p>", unsafe_allow_html=True)
            
            with st.form("form_login_dark"):
                login_input = st.text_input("✉️ E-mail ou Login")
                senha_input = st.text_input("🔒 Senha", type="password")
                
                c_chk, c_links = st.columns([1, 1])
                with c_chk: st.checkbox("Lembrar-me")
                with c_links:
                    st.markdown('<div style="text-align: right; margin-top: 5px;"><a href="#" class="link-azul">Esqueceu a senha?</a></div>', unsafe_allow_html=True)
                
                btn_login = st.form_submit_button("Entrar", type="primary")

                if btn_login:
                    df_users = pd.DataFrame(aba_usuarios_db.get_all_records())
                    if "Email" not in df_users.columns: df_users["Email"] = ""
                    user_match = df_users[((df_users["Usuario"].astype(str) == login_input) | (df_users["Email"].astype(str) == login_input)) & (df_users["Senha"].astype(str) == senha_input)]
                    
                    if not user_match.empty:
                        # O SISTEMA AGORA PERMITE O LOGIN MESMO BLOQUEADO (PAYWALL)
                        st.session_state.logado = True
                        st.session_state.usuario = user_match.iloc[0]["Usuario"]
                        st.session_state.nivel = user_match.iloc[0]["Nivel"]
                        st.rerun()
                    else: st.error("❌ Credenciais incorretas.")
            
            c_bt1, c_bt2, c_bt3 = st.columns([0.5, 2, 0.5])
            if c_bt2.button("Criar uma nova conta", type="secondary", use_container_width=True):
                st.session_state.tela_atual = "cadastro"; st.rerun()

        elif st.session_state.tela_atual == "cadastro":
            st.markdown(f"<div style='text-align: center;'><img src='{LOGO_URL}' width='50'></div>", unsafe_allow_html=True)
            st.markdown("<h2 style='text-align: center; margin-bottom: 5px;'>Criar Conta</h2>", unsafe_allow_html=True)
            st.markdown("<p style='text-align: center; margin-bottom: 30px;'>Registe-se para usar o sistema</p>", unsafe_allow_html=True)
            
            with st.form("form_cadastro_dark"):
                c_nome = st.text_input("👤 Nome Completo")
                c_email = st.text_input("✉️ Seu E-mail")
                c_tel = st.text_input("📞 Nº telemóvel com WhatsApp")
                c_senha = st.text_input("🔒 Crie a sua Senha", type="password")
                c_senha_confirma = st.text_input("🔒 Confirme a sua Senha", type="password")
                btn_cadastrar = st.form_submit_button("Finalizar Registo", type="primary")

                if btn_cadastrar:
                    if not c_nome or not c_email or not c_senha: st.warning("⚠️ Preencha os campos.")
                    elif c_senha != c_senha_confirma: st.error("❌ As senhas não coincidem.")
                    else:
                        df_u = pd.DataFrame(aba_usuarios_db.get_all_records())
                        if "Email" not in df_u.columns: df_u["Email"] = ""
                        if c_email in df_u["Email"].astype(str).values: st.error("❌ E-mail já registado.")
                        else:
                            aba_usuarios_db.append_row([c_email, c_senha, "Cliente", "Ativo", "0", "", c_nome, c_email, c_tel])
                            st.success("✅ Conta criada! Já pode entrar."); time.sleep(2); st.session_state.tela_atual = "login"; st.rerun()
            c_bt1, c_bt2, c_bt3 = st.columns([1, 1, 1])
            if c_bt2.button("← Voltar", type="secondary", use_container_width=True):
                st.session_state.tela_atual = "login"; st.rerun()

# ==========================================
# ROTA 2: SISTEMA LOGADO
# ==========================================
else:
    st.markdown("""
        <style>
        .stApp { background-color: #0f172a !important; }
        section[data-testid="stSidebar"] { background-color: #0b1121 !important; border-right: 1px solid #1e293b; }
        h1, h2, h3 { color: #ffffff !important; font-family: 'Segoe UI', sans-serif; }
        p, label, span { color: #cbd5e1 !important; }
        div[role="radiogroup"] label { padding: 12px 15px; border-radius: 6px; margin-bottom: 5px; background-color: transparent; color: #888888 !important; border: 1px solid transparent; transition: 0.3s; }
        div[role="radiogroup"] label:hover { background-color: #1e293b; color: #ffffff !important; }
        div[role="radiogroup"] label[data-checked="true"] { background-color: #1e293b !important; color: #3b82f6 !important; border-left: 4px solid #3b82f6 !important; font-weight: bold; }
        div[data-testid="stMetric"] { background-color: #1e293b !important; border: 1px solid #334155 !important; border-radius: 8px !important; padding: 15px !important; }
        div[data-testid="stMetric"] label { color: #94a3b8 !important; font-weight: bold !important; font-size: 14px !important; }
        .stTextInput input, .stNumberInput input, .stDateInput input, .stSelectbox>div>div>div { background-color: #1e293b !important; color: #ffffff !important; border: 1px solid #334155 !important; }
        button[kind="primary"] { background-color: #2563eb !important; color: white !important; border: none !important; border-radius: 4px !important; font-weight: bold !important; width: 100% !important; }
        button[kind="primary"]:hover { background-color: #1d4ed8 !important; }
        button[kind="secondary"] { background-color: #1e293b !important; color: #ffffff !important; border: 1px solid #334155 !important; border-radius: 6px !important; padding: 0 !important; min-width: 0 !important; width: 100% !important; height: 36px !important; display: flex !important; justify-content: center !important; align-items: center !important; transition: all 0.2s ease; }
        button[kind="secondary"]:hover { background-color: #334155 !important; border-color: #4b5563 !important; }
        .break-text { word-break: break-all !important; white-space: normal !important; }
        
        /* Estilo da Caixa de Cobrança (Paywall) */
        .paywall-box { background-color: #1e293b; border: 2px dashed #ef4444; border-radius: 12px; padding: 30px; text-align: center; margin-top: 20px; }
        .pix-code { background-color: #0f172a; padding: 15px; border-radius: 8px; font-family: monospace; color: #10b981; font-size: 18px; font-weight: bold; letter-spacing: 1px; border: 1px solid #334155; display: inline-block; margin: 15px 0; }
        </style>
        """, unsafe_allow_html=True)

    # Verifica os dados do utilizador logado em tempo real
    df_users_master = pd.DataFrame(aba_usuarios_db.get_all_records())
    meu_cadastro = df_users_master[df_users_master["Usuario"] == st.session_state.usuario]
    meu_status = meu_cadastro.iloc[0]["Status"].lower() if not meu_cadastro.empty else "bloqueado"

    st.sidebar.markdown(f"<div style='text-align: center;'><img src='{LOGO_URL}' width='40'> <span style='font-weight:bold; font-size:18px; color:white;'>{NOME_SAAS}</span></div><br>", unsafe_allow_html=True)
    st.sidebar.markdown(f"👤 **{st.session_state.usuario}**")
    
    cor_st = "#10b981" if meu_status == "ativo" else "#ef4444"
    st.sidebar.markdown(f"<span style='color:{cor_st}; font-weight:bold;'>Status: {meu_status.upper()}</span>", unsafe_allow_html=True)
    
    st.sidebar.write("")
    if st.sidebar.button("Sair / Logout"):
        st.session_state.logado = False; st.rerun()
    st.sidebar.markdown("---")

    # ==========================================
    # PAINEL MASTER
    # ==========================================
    if st.session_state.nivel.lower() == "master":
        st.title("👑 Central de Comando SaaS")
        df_users = df_users_master.copy()
        
        st.markdown("### 📊 Dashboard de Desempenho (MRR)")
        df_ativos = df_users[df_users['Status'].str.lower() == 'ativo'].copy()
        df_users['ValorNum'] = df_users['Valor'].apply(lambda x: float(str(x).replace(',', '.').strip()) if str(x) != "" else 0.0)
        df_ativos['ValorNum'] = df_ativos['Valor'].apply(lambda x: float(str(x).replace(',', '.').strip()) if str(x) != "" else 0.0)
        
        c_m1, c_m2, c_m3 = st.columns(3)
        c_m1.metric("Clientes Ativos", f"{len(df_ativos)}")
        c_m2.metric("Clientes Bloqueados", f"{len(df_users) - len(df_ativos)}")
        c_m3.metric("Receita Recorrente (MRR)", f"R$ {df_ativos['ValorNum'].sum():,.2f}")
        st.markdown("<br>", unsafe_allow_html=True)
        
        cg1, cg2 = st.columns(2)
        with cg1:
            st.markdown("**Proporção de Clientes**")
            status_cont = df_users['Status'].value_counts().reset_index()
            status_cont.columns = ['Status', 'Total']
            st.altair_chart(alt.Chart(status_cont).mark_arc(innerRadius=60).encode(theta=alt.Theta(field="Total", type="quantitative"), color=alt.Color(field="Status", type="nominal", scale=alt.Scale(domain=['Ativo', 'Bloqueado', 'ativo', 'bloqueado'], range=['#10b981', '#ef4444', '#10b981', '#ef4444'])), tooltip=['Status', 'Total']).properties(height=250), use_container_width=True)
            
        with cg2:
            st.markdown("**Receita por Nível (Apenas Ativos)**")
            if not df_ativos.empty:
                rev_nivel = df_ativos.groupby('Nivel')['ValorNum'].sum().reset_index()
                st.altair_chart(alt.Chart(rev_nivel).mark_bar().encode(x=alt.X('Nivel:N', title=''), y=alt.Y('ValorNum:Q', title='R$'), color=alt.Color('Nivel:N', legend=None, scale=alt.Scale(range=['#3b82f6', '#6366f1'])), tooltip=['Nivel', 'ValorNum']).properties(height=250), use_container_width=True)
        
        st.markdown("---")
        tab1, tab2 = st.tabs(["📋 Gestão de Clientes", "➕ Novo Cliente Master"])

        with tab1:
            if st.session_state.edit_user != "":
                cliente_sel = st.session_state.edit_user
                if st.button("⬅️ Cancelar"): st.session_state.edit_user = ""; st.rerun()
                st.markdown(f"### ✏️ Editando Cliente: <span style='color:#3b82f6;'>{cliente_sel}</span>", unsafe_allow_html=True)
                row_data = df_users[df_users["Usuario"] == cliente_sel].iloc[0]
                with st.form("editar_cliente_inline"):
                    c1, c2, c3 = st.columns(3)
                    e_nome = c1.text_input("Nome", value=str(row_data.get("Nome", ""))); e_email = c2.text_input("E-mail", value=str(row_data.get("Email", ""))); e_tel = c3.text_input("Telefone", value=str(row_data.get("Telefone", "")))
                    c4, c5, c6 = st.columns(3)
                    e_senha = c4.text_input("Senha", value=str(row_data.get("Senha", ""))); e_nivel = c5.selectbox("Nível", ["Cliente", "Master"], index=0 if row_data.get("Nivel", "") == "Cliente" else 1); e_status = c6.selectbox("Status", ["Ativo", "Bloqueado"], index=0 if row_data.get("Status", "") == "Ativo" else 1)
                    c7, c8 = st.columns(2)
                    v_str = str(row_data.get("Valor", "0")).replace(',', '.').strip()
                    e_valor = c7.number_input("Valor (R$)", value=float(v_str) if v_str != "" else 0.0, step=10.0)
                    try: v_f = pd.to_datetime(row_data.get("Vencimento", ""), format='%d/%m/%Y').date()
                    except: v_f = date.today()
                    e_venc = c8.date_input("Vencimento da Assinatura", value=v_f)
                    if st.form_submit_button("SALVAR ALTERAÇÕES", type="primary"):
                        celula = aba_usuarios_db.find(cliente_sel, in_column=1)
                        aba_usuarios_db.update_cell(celula.row, 2, e_senha); aba_usuarios_db.update_cell(celula.row, 3, e_nivel); aba_usuarios_db.update_cell(celula.row, 4, e_status)
                        aba_usuarios_db.update_cell(celula.row, 5, str(e_valor)); aba_usuarios_db.update_cell(celula.row, 6, e_venc.strftime('%d/%m/%Y'))
                        aba_usuarios_db.update_cell(celula.row, 7, e_nome); aba_usuarios_db.update_cell(celula.row, 8, e_email); aba_usuarios_db.update_cell(celula.row, 9, e_tel)
                        st.success(f"Atualizado!"); time.sleep(1); st.session_state.edit_user = ""; st.rerun()
            else:
                c_f1, c_f2, c_f3 = st.columns([2, 1, 1])
                busca = c_f1.text_input("🔍 Pesquisar por utilizador ou nome")
                filtro_status = c_f2.selectbox("Situação", ["Todos", "Ativo", "Bloqueado"])
                c_f3.write(""); c_f3.button("Atualizar")
                
                df_show = df_users.copy()
                if filtro_status != "Todos": df_show = df_show[df_show['Status'].str.lower() == filtro_status.lower()]
                if busca: df_show = df_show[df_show['Usuario'].astype(str).str.contains(busca, case=False) | df_show['Nome'].astype(str).str.contains(busca, case=False)]

                st.markdown("""<div style="display: flex; justify-content: space-between; padding: 12px 15px; background-color: #111827; border-radius: 8px 8px 0 0; border-bottom: 1px solid #1f2937; color: #6b7280; font-weight: 600; font-size: 11px; text-transform: uppercase;"><div style="width: 25%;">USUÁRIO</div><div style="width: 20%;">DATAS</div><div style="width: 15%;">SITUAÇÃO</div><div style="width: 20%;">DETALHES</div><div style="width: 20%; text-align: center;">AÇÕES</div></div>""", unsafe_allow_html=True)
                for _, row in df_show.iterrows():
                    user = str(row.get("Usuario", "-")); email = str(row.get("Email", "-")); nivel = str(row.get("Nivel", "Cliente"))
                    venc = str(row.get("Vencimento", "-")); status = str(row.get("Status", "N/A")); nome = str(row.get("Nome", "Sem Nome"))
                    v_str = str(row.get("Valor", "0")).replace(',', '.').strip(); valor = float(v_str) if v_str != "" else 0.0; tel = str(row.get("Telefone", "-"))
                    cor_bdg = "border: 1px solid #10b981; color: #10b981;" if status.lower() == "ativo" else "border: 1px solid #ef4444; color: #ef4444;"
                    btn_status = "🟢" if status.lower() == "ativo" else "🔴"
                    
                    st.markdown("<div style='border-top: 1px solid #1f2937;'></div>", unsafe_allow_html=True)
                    c1, c2, c3, c4, c5 = st.columns([2.5, 1.5, 1.5, 2.5, 2.0])
                    with c1: st.markdown(f'<div style="padding: 10px 0;"><span style="color: #3b82f6; font-weight: bold; font-size: 15px;">{user}</span><br><span class="break-text" style="color: #6b7280; font-size: 12px;">{email}</span></div>', unsafe_allow_html=True)
                    with c2: st.markdown(f'<div style="padding: 10px 0;"><span style="color: #d1d5db; font-size: 14px;">{venc}</span></div>', unsafe_allow_html=True)
                    with c3: st.markdown(f'<div style="padding: 10px 0;"><span style="{cor_bdg} padding: 2px 8px; border-radius: 4px; font-weight: bold; font-size: 11px;">{status.upper()}</span></div>', unsafe_allow_html=True)
                    with c4: st.markdown(f'<div style="padding: 10px 0;"><span style="color: #d1d5db; font-size: 14px;">R$ {valor:,.2f}</span></div>', unsafe_allow_html=True)
                    with c5:
                        st.markdown("<div style='padding-top: 15px;'></div>", unsafe_allow_html=True)
                        b1, b2, b3 = st.columns([1,1,1])
                        if b1.button("✏️", key=f"edit_{user}"): st.session_state.edit_user = user; st.rerun()
                        if b2.button("🖥️", key=f"ren_{user}"):
                            try: v_atual = pd.to_datetime(venc, format='%d/%m/%Y')
                            except: v_atual = pd.Timestamp.today()
                            novo_v = (v_atual + relativedelta(months=1)).strftime('%d/%m/%Y')
                            aba_usuarios_db.update_cell(aba_usuarios_db.find(user, in_column=1).row, 6, novo_v); st.rerun()
                        if b3.button(btn_status, key=f"stat_{user}"):
                            n_stat = "Bloqueado" if status.lower() == "ativo" else "Ativo"
                            aba_usuarios_db.update_cell(aba_usuarios_db.find(user, in_column=1).row, 4, n_stat); st.rerun()
                st.markdown("<div style='background-color: #111827; padding: 5px; border-radius: 0 0 8px 8px;'></div>", unsafe_allow_html=True)

        with tab2:
            st.markdown("### Cadastrar Cliente Manualmente")
            with st.form("novo_cliente_master"):
                c1, c2, c3 = st.columns(3)
                n_nome = c1.text_input("Nome"); n_email = c2.text_input("E-mail"); n_tel = c3.text_input("Telefone")
                n_user = c1.text_input("Usuário (Login)"); n_senha = c2.text_input("Senha"); n_nivel = c3.selectbox("Nível", ["Cliente", "Master"])
                n_status = c1.selectbox("Status", ["Ativo", "Bloqueado"]); n_valor = c2.number_input("Mensalidade (R$)", min_value=0.0, step=10.0); n_venc = c3.date_input("Data de Vencimento")
                if st.form_submit_button("SALVAR CLIENTE", type="primary"):
                    if n_user in df_users["Usuario"].values: st.error("Usuário já existe!")
                    elif n_user and n_senha:
                        aba_usuarios_db.append_row([n_user, n_senha, n_nivel, n_status, str(n_valor), n_venc.strftime('%d/%m/%Y'), n_nome, n_email, n_tel]); st.success("Sucesso!"); time.sleep(1); st.rerun()

    # ==========================================
    # PAINEL DO CLIENTE E PAYWALL
    # ==========================================
    else:
        # --- A BARREIRA DE PAGAMENTO (PAYWALL) ---
        if meu_status == "bloqueado":
            opcoes_menu = {"💳  Regularizar Assinatura": "Assinatura"}
            st.error("⛔ ACESSO SUSPENSO: Identificámos uma pendência na sua assinatura.")
        else:
            opcoes_menu = {"📊  Painel Geral": "Painel", "🔮  Previsão": "Previsão", "📅  Calendário": "Calendário", "📝  Novo Lançamento": "Lançar", "📋  Histórico": "Histórico", "💳  Minha Assinatura": "Assinatura"}
        
        menu = opcoes_menu[st.sidebar.radio("Navegação", list(opcoes_menu.keys()), label_visibility="collapsed")]

        # TELA DE ASSINATURA E COBRANÇA
        if menu == "Assinatura":
            st.title("💳 Minha Assinatura")
            v_str = str(meu_cadastro.iloc[0]["Valor"]).replace(',','.').strip()
            valor_plano = float(v_str) if v_str != "" else 0.0
            dt_venc = str(meu_cadastro.iloc[0]["Vencimento"])
            
            c1, c2, c3 = st.columns(3)
            c1.metric("Valor do Plano", f"R$ {valor_plano:,.2f}")
            c2.metric("Vencimento", f"{dt_venc}")
            c3.metric("Situação Atual", f"{meu_status.upper()}")
            
            if valor_plano > 0:
                st.markdown(f"""
                <div class="paywall-box">
                    <h2 style="color:white; margin-bottom:10px;">Pagamento via PIX</h2>
                    <p style="color:#94a3b8;">Utilize a chave abaixo para renovar o seu acesso à plataforma {NOME_SAAS}.</p>
                    <div class="pix-code">{CHAVE_PIX}</div>
                    <p style="color:#cbd5e1; font-size:14px;"><strong>Recebedor:</strong> {NOME_RECEBEDOR}</p>
                    <br>
                    <p style="color:#10b981; font-size:13px;">✅ O seu acesso será libertado imediatamente após a confirmação pelo Administrador.</p>
                </div>
                """, unsafe_allow_html=True)
            else:
                st.success("🎉 O seu plano atual é gratuito ou não possui mensalidade configurada.")

        # RESTANTE DO SISTEMA FINANCEIRO DO CLIENTE (Bloqueado se dever)
        elif meu_status == "ativo":
            def get_aba_cliente():
                nome_aba = f"Dados_{st.session_state.usuario}"
                try: return planilha.worksheet(nome_aba)
                except gspread.exceptions.WorksheetNotFound:
                    ws = planilha.add_worksheet(title=nome_aba, rows="1000", cols="10")
                    ws.append_row(["ID", "Tipo", "Descrição", "Valor", "Status", "Vencimento", "Categoria", "Forma_Pagamento"])
                    return ws

            df = pd.DataFrame(get_aba_cliente().get_all_records())
            if df.empty:
                df = pd.DataFrame(columns=["ID", "Tipo", "Descrição", "Valor", "Status", "Vencimento", "Categoria", "Forma_Pagamento"])
                df['Vencimento'] = pd.to_datetime(df['Vencimento'])
            else:
                df['Vencimento'] = pd.to_datetime(df['Vencimento'], errors='coerce').fillna(pd.Timestamp.now())
                df['ID'] = df['ID'].astype(str); df['Forma_Pagamento'] = df['Forma_Pagamento'].astype(str); df['Valor'] = pd.to_numeric(df['Valor'], errors='coerce').fillna(0.0)

            def salvar_dados(df_novo):
                ws = get_aba_cliente(); df_s = df_novo.copy()
                df_s['Vencimento'] = df_s['Vencimento'].dt.strftime('%Y-%m-%d'); df_s = df_s.fillna("")
                ws.clear(); ws.update(values=[df_s.columns.tolist()] + df_s.values.tolist(), range_name='A1')

            hoje = date.today()
            CATEGORIAS = ["Consultoria", "Energia/Enel", "Internet", "Moradia", "Salário", "Serviços", "Outros"]
            PAGAMENTOS = ["Pix", "Cartão", "Dinheiro", "Boleto", "Outros"]

            if menu == "Painel":
                st.title("Painel de Controle")
                if df.empty: st.info("👋 Olá! O seu financeiro está vazio. Vá em **Novo Lançamento**.")
                df_m = df[(df['Vencimento'].dt.month == hoje.month) & (df['Vencimento'].dt.year == hoje.year)].copy()
                ent = df_m[df_m['Tipo']=='Recebimento']['Valor'].sum(); sai = df_m[df_m['Tipo']=='Gasto']['Valor'].sum()
                c1, c2, c3 = st.columns(3)
                c1.metric("Entradas (Mês)", f"R$ {ent:,.2f}"); c2.metric("Saídas (Mês)", f"R$ {sai:,.2f}"); c3.metric("Saldo Líquido", f"R$ {ent - sai:,.2f}")
                st.markdown("---"); st.subheader("📅 Próximos Pagamentos")
                pend = df[(df["Status"] == "Pendente") & (df["Tipo"] == "Gasto")].sort_values(by="Vencimento")
                if pend.empty: st.success("Nenhuma conta pendente.")
                else:
                    for _, r in pend.head(5).iterrows():
                        dv = r['Vencimento'].date()
                        cor = "#ef4444" if dv < hoje else "#10b981"
                        c_dt, c_desc, c_val, c_btn = st.columns([1, 3, 2, 1])
                        c_dt.markdown(f"<span style='color:{cor}; font-weight:bold; font-size:1.1em'>{dv.strftime('%d/%m')}</span>", unsafe_allow_html=True)
                        c_desc.markdown(f"**{r['Descrição']}** - <small style='color:#94a3b8'>{r['Categoria']}</small>", unsafe_allow_html=True)
                        c_val.markdown(f"**R$ {r['Valor']:,.2f}**")
                        if c_btn.button("PAGAR", key=f"pay_d_{r['ID']}"):
                            df.loc[df['ID'] == r['ID'], 'Status'] = 'Pago'; salvar_dados(df); st.balloons(); time.sleep(0.5); st.rerun()

            elif menu == "Previsão":
                st.title("🔮 Previsão Futura")
                futuro = df[df['Vencimento'].dt.date > hoje].copy()
                if futuro.empty: st.info("Sem dados futuros.")
                else:
                    futuro['Mes_Ano'] = futuro['Vencimento'].dt.strftime('%Y-%m')
                    st.altair_chart(alt.Chart(futuro.groupby(['Mes_Ano', 'Tipo'])['Valor'].sum().reset_index()).mark_bar().encode(x='Mes_Ano', y='Valor', color=alt.Color('Tipo', scale=alt.Scale(domain=['Recebimento', 'Gasto'], range=['#10b981', '#ef4444']))).properties(height=300), use_container_width=True)

            elif menu == "Calendário":
                st.title("📅 Calendário de Vencimentos")
                if df.empty: st.info("Sem dados para exibir.")
                else:
                    st.markdown("Círculo <span style='color:#ef4444; font-weight:bold;'>Vermelho</span> = Contas Pendentes | Círculo <span style='color:#10b981; font-weight:bold;'>Verde</span> = Contas Pagas", unsafe_allow_html=True)
                    st.markdown("<br>", unsafe_allow_html=True)
                    df_mes = df[(df['Vencimento'].dt.month == hoje.month) & (df['Vencimento'].dt.year == hoje.year)]
                    cal = calendar.monthcalendar(hoje.year, hoje.month)
                    meses_pt = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"]
                    
                    html_cal = f'<h3 style="text-align:center; color:#3b82f6;">{meses_pt[hoje.month-1]} {hoje.year}</h3>'
                    html_cal += '<table style="width:100%; text-align:center; color:white; border-collapse: collapse; font-size:18px;">'
                    html_cal += '<tr style="background-color:#1f2937;"><th>Seg</th><th>Ter</th><th>Qua</th><th>Qui</th><th>Sex</th><th>Sáb</th><th>Dom</th></tr>'
                    
                    for week in cal:
                        html_cal += '<tr>'
                        for day in week:
                            if day == 0: html_cal += '<td style="border:1px solid #334155; padding:15px;"></td>'
                            else:
                                day_records = df_mes[df_mes['Vencimento'].dt.day == day]
                                if not day_records.empty:
                                    bg_color = '#ef4444' if (day_records['Status'].str.lower() == 'pendente').any() else '#10b981'
                                    html_cal += f'<td style="border:1px solid #334155; padding:15px;"><div style="background-color:{bg_color}; border-radius:50%; width:35px; height:35px; line-height:35px; margin:auto; font-weight:bold;">{day}</div></td>'
                                else: html_cal += f'<td style="border:1px solid #334155; padding:15px; color:#94a3b8;">{day}</td>'
                        html_cal += '</tr>'
                    html_cal += '</table>'
                    st.markdown(html_cal, unsafe_allow_html=True)

            elif menu == "Lançar":
                st.title("Novo Registo")
                with st.form("lancar", clear_on_submit=True):
                    c1, c2 = st.columns(2)
                    tipo = c1.selectbox("Tipo", ["Gasto", "Recebimento"]); desc = c2.text_input("Descrição")
                    val = c1.number_input("Valor", min_value=0.0); dt = c2.date_input("Data", value=hoje)
                    cat, fop = c1.selectbox("Categoria", CATEGORIAS), c2.selectbox("Forma", PAGAMENTOS)
                    rep = st.selectbox("Repetir?", ["Não", "Mensal"]); qtd = st.number_input("Vezes", 1, 60, 1)
                    if st.form_submit_button("SALVAR REGISTRO", type="primary"):
                        novos = []
                        bid = pd.Timestamp.now().strftime('%H%M%S')
                        for i in range(qtd if rep != "Não" else 1):
                            delta = relativedelta(months=i) if rep=="Mensal" else relativedelta(days=0)
                            novos.append({"ID": f"{bid}{i}", "Tipo": tipo, "Descrição": desc, "Valor": val, "Status": "Pago" if tipo=="Recebimento" else "Pendente", "Vencimento": pd.to_datetime(dt)+delta, "Categoria": cat, "Forma_Pagamento": fop})
                        salvar_dados(pd.concat([df, pd.DataFrame(novos)]))
                        st.success("Salvo!"); time.sleep(1); st.rerun()

            elif menu == "Histórico":
                st.title("📋 Histórico e Gestão")
                
                if not df.empty:
                    df_export = df.copy()
                    df_export['Vencimento'] = df_export['Vencimento'].dt.strftime('%d/%m/%Y')
                    csv = df_export.to_csv(index=False, sep=';').encode('utf-8-sig')
                    st.download_button(label="📥 Descarregar Relatório em Excel", data=csv, file_name=f"Relatorio_Financeiro_{hoje.strftime('%d-%m-%Y')}.csv", mime='text/csv')
                st.markdown("---")
                
                if st.session_state.edit_conta != "":
                    idx_edit = df[df['ID'] == st.session_state.edit_conta].index[0]
                    st.markdown(f"### ✏️ Editando Lançamento: <span style='color:#3b82f6;'>{df.at[idx_edit,'Descrição']}</span>", unsafe_allow_html=True)
                    if st.button("⬅️ Cancelar"): st.session_state.edit_conta = ""; st.rerun()
                    with st.form("edit_cliente"):
                        c1, c2 = st.columns(2)
                        ed = c1.text_input("Descrição", df.at[idx_edit,'Descrição']); ev = c2.number_input("Valor", float(df.at[idx_edit,'Valor']))
                        c3, c4, c5 = st.columns(3)
                        ec = c3.selectbox("Categoria", CATEGORIAS, index=CATEGORIAS.index(df.at[idx_edit,'Categoria']) if df.at[idx_edit,'Categoria'] in CATEGORIAS else 0)
                        ef = c4.selectbox("Pagamento", PAGAMENTOS, index=PAGAMENTOS.index(df.at[idx_edit,'Forma_Pagamento']) if df.at[idx_edit,'Forma_Pagamento'] in PAGAMENTOS else 0)
                        es = c5.selectbox("Status", ["Pago", "Pendente"], index=0 if df.at[idx_edit,'Status']=="Pago" else 1)
                        if st.form_submit_button("GUARDAR ALTERAÇÕES", type="primary"):
                            df.at[idx_edit,'Descrição'] = ed; df.at[idx_edit,'Valor'] = ev; df.at[idx_edit,'Categoria'] = ec; df.at[idx_edit,'Forma_Pagamento'] = ef; df.at[idx_edit,'Status'] = es
                            salvar_dados(df); st.session_state.edit_conta = ""; st.success("Atualizado!"); time.sleep(1); st.rerun()
                else:
                    c_f1, c_f2, c_f3 = st.columns([1, 1, 1.5])
                    with c_f1:
                        meses = sorted(df['Vencimento'].dt.strftime('%Y-%m').unique(), reverse=True) if not df.empty else []
                        sel_mes = st.selectbox("📅 Mês", ["Todos"] + meses)
                    with c_f2: sel_cat = st.selectbox("📂 Categoria", ["Todas"] + CATEGORIAS)
                    with c_f3: busca = st.text_input("🔍 Busca", placeholder="Texto...")
                    
                    df_exibicao = df.copy()
                    if sel_mes != "Todos": df_exibicao = df_exibicao[df_exibicao['Vencimento'].dt.strftime('%Y-%m') == sel_mes]
                    if sel_cat != "Todas": df_exibicao = df_exibicao[df_exibicao['Categoria'] == sel_cat]
                    if busca: df_exibicao = df_exibicao[df_exibicao.apply(lambda x: x.astype(str).str.contains(busca, case=False).any(), axis=1)]
                    df_exibicao = df_exibicao.sort_values(by="Vencimento", ascending=False)

                    st.markdown("""<div style="display: flex; justify-content: space-between; padding: 12px 15px; background-color: #111827; border-radius: 8px 8px 0 0; border-bottom: 1px solid #1f2937; color: #6b7280; font-weight: 600; font-size: 11px; text-transform: uppercase;"><div style="width: 30%;">DESCRIÇÃO</div><div style="width: 20%;">VENCIMENTO</div><div style="width: 15%;">CATEGORIA</div><div style="width: 15%;">VALOR</div><div style="width: 20%; text-align: center;">AÇÕES</div></div>""", unsafe_allow_html=True)

                    for _, r in df_exibicao.iterrows():
                        cid = str(r['ID']); desc = str(r['Descrição']); cat = str(r['Categoria']); forma = str(r['Forma_Pagamento'])
                        val = float(r['Valor']); status = str(r['Status']); tipo = str(r['Tipo'])
                        venc = r['Vencimento'].strftime('%d/%m/%Y') if pd.notnull(r['Vencimento']) else ""
                        
                        cor_bdg = "border: 1px solid #10b981; color: #10b981;" if status.lower() == "pago" else "border: 1px solid #ef4444; color: #ef4444;"
                        cor_tipo = "#10b981" if tipo == "Recebimento" else "#ef4444"
                        btn_status = "🟢" if status.lower() == "pago" else "🔴"
                        
                        st.markdown("<div style='border-top: 1px solid #1f2937;'></div>", unsafe_allow_html=True)
                        c1, c2, c3, c4, c5 = st.columns([3, 2, 1.5, 1.5, 2.0])
                        with c1: st.markdown(f'<div style="padding: 10px 0;"><span style="color: {cor_tipo}; font-weight: bold; font-size: 15px;">{desc}</span><br><span style="color: #6b7280; font-size: 11px;">{tipo} via {forma}</span></div>', unsafe_allow_html=True)
                        with c2: st.markdown(f'<div style="padding: 10px 0;"><span style="color: #d1d5db; font-size: 14px;">{venc}</span></div>', unsafe_allow_html=True)
                        with c3: st.markdown(f'<div style="padding: 10px 0;"><span style="background-color: #334155; color: #cbd5e1; padding: 2px 8px; border-radius: 4px; font-size: 11px;">{cat}</span></div>', unsafe_allow_html=True)
                        with c4: st.markdown(f'<div style="padding: 10px 0;"><span style="color: #d1d5db; font-size: 14px;">R$ {val:,.2f}</span><br><span style="{cor_bdg} padding: 1px 6px; border-radius: 4px; font-weight: bold; font-size: 10px;">{status.upper()}</span></div>', unsafe_allow_html=True)
                        with c5:
                            st.markdown("<div style='padding-top: 15px;'></div>", unsafe_allow_html=True)
                            b1, b2, b3 = st.columns([1,1,1])
                            if b1.button("✏️", key=f"e_{cid}"): st.session_state.edit_conta = cid; st.rerun()
                            if b2.button(btn_status, key=f"s_{cid}"):
                                df.loc[df['ID'] == cid, 'Status'] = "Pendente" if status.lower() == "pago" else "Pago"
                                salvar_dados(df); st.rerun()
                            if b3.button("🗑️", key=f"d_{cid}"):
                                df = df[df['ID'] != cid]
                                salvar_dados(df); st.rerun()
                    st.markdown("<div style='background-color: #111827; padding: 5px; border-radius: 0 0 8px 8px;'></div>", unsafe_allow_html=True)
