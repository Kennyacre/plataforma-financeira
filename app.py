import streamlit as st
import pandas as pd
import altair as alt
import gspread
from google.oauth2.service_account import Credentials
import json
import time
from datetime import datetime, date
from dateutil.relativedelta import relativedelta

st.set_page_config(page_title="Plataforma SaaS", layout="wide")

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
    st.error(f"🚨 Falha na conexão com o Banco de Dados. Detalhe: {e}")
    st.stop()

# --- 2. CONTROLE DE SESSÃO ---
if "logado" not in st.session_state:
    st.session_state.logado = False
    st.session_state.usuario = "" # Agora será o Email
    st.session_state.nivel = ""
if "tela_atual" not in st.session_state:
    st.session_state.tela_atual = "login"

# ==========================================
# ROTA 1: TELA INICIAL (LOGIN E CADASTRO - LIGHT MODE)
# ==========================================
if not st.session_state.logado:
    # --- CSS: DESIGN MODERNO CLARO PARA LOGIN ---
    st.markdown("""
        <style>
        .stApp { background-color: #f4f7f6 !important; }
        /* Centraliza e estiliza a caixa do formulário */
        div[data-testid="stForm"] { 
            background-color: #ffffff; 
            padding: 40px; 
            border-radius: 15px; 
            box-shadow: 0px 10px 30px rgba(0,0,0,0.08); 
            border: 1px solid #eaeaea;
        }
        h1, h2, h3, p, label { color: #1e293b !important; font-family: 'Segoe UI', sans-serif; }
        /* Inputs arredondados */
        .stTextInput>div>div>input { 
            border-radius: 8px !important; 
            border: 1px solid #cbd5e1 !important; 
            background-color: #f8fafc !important; 
            color: #334155 !important; 
            padding: 12px 15px !important;
        }
        /* Botão Azulão principal */
        .stButton>button { 
            background-color: #3b82f6 !important; 
            color: white !important; 
            border: none !important; 
            border-radius: 8px !important; 
            font-weight: 600 !important; 
            width: 100% !important; 
            padding: 10px 0 !important;
            transition: 0.3s;
        }
        .stButton>button:hover { background-color: #2563eb !important; }
        /* Link azul de texto */
        .link-text { color: #3b82f6; text-decoration: none; font-weight: 500; cursor: pointer; }
        .link-text:hover { text-decoration: underline; }
        </style>
        """, unsafe_allow_html=True)

    # Centralizando a caixa na tela usando colunas
    col1, col2, col3 = st.columns([1, 1.2, 1])
    
    with col2:
        st.write("") # Espaçamento
        st.write("")
        
        # --- TELA DE LOGIN ---
        if st.session_state.tela_atual == "login":
            st.markdown("<h1 style='text-align: center; margin-bottom: 5px;'>Entrar na sua Conta</h1>", unsafe_allow_html=True)
            st.markdown("<p style='text-align: center; color: #64748b !important; margin-bottom: 25px;'>Bem-vindo de volta! por favor, insira seus dados</p>", unsafe_allow_html=True)
            
            with st.form("form_login_moderno"):
                login_input = st.text_input("✉️ Login (E-mail ou Usuário)", placeholder="Seu e-mail cadastrado")
                senha_input = st.text_input("🔒 Senha", type="password", placeholder="Sua senha secreta")
                
                # Links "Esqueceu a senha" falsos para design
                st.markdown("""
                    <div style="text-align: right; margin-top: -10px; margin-bottom: 15px;">
                        <a href="#" class="link-text" style="font-size: 14px;">Esqueceu a senha?</a><br>
                        <a href="#" class="link-text" style="font-size: 14px;">Reenviar verificação de email</a>
                    </div>
                """, unsafe_allow_html=True)
                
                # Simulador visual de reCAPTCHA nativo
                st.checkbox("Não sou um robô")
                st.write("")
                
                btn_login = st.form_submit_button("Entrar")

                if btn_login:
                    df_users = pd.DataFrame(aba_usuarios_db.get_all_records())
                    if "Email" not in df_users.columns: df_users["Email"] = ""
                    
                    user_match = df_users[
                        ((df_users["Usuario"].astype(str) == login_input) | (df_users["Email"].astype(str) == login_input)) & 
                        (df_users["Senha"].astype(str) == senha_input)
                    ]

                    if not user_match.empty:
                        status = user_match.iloc[0]["Status"]
                        if status.lower() == "ativo":
                            st.session_state.logado = True
                            st.session_state.usuario = user_match.iloc[0]["Usuario"]
                            st.session_state.nivel = user_match.iloc[0]["Nivel"]
                            st.rerun()
                        else:
                            st.error("⛔ Conta bloqueada. Contate o suporte.")
                    else:
                        st.error("❌ Credenciais incorretas.")
            
            # Botão invisível para trocar de tela
            st.write("")
            c_bt1, c_bt2, c_bt3 = st.columns([1, 2, 1])
            if c_bt2.button("Não tem uma conta? Inscrever-se", use_container_width=True):
                st.session_state.tela_atual = "cadastro"
                st.rerun()

        # --- TELA DE CADASTRO ---
        elif st.session_state.tela_atual == "cadastro":
            st.markdown("<h1 style='text-align: center; margin-bottom: 5px;'>Criar Conta</h1>", unsafe_allow_html=True)
            st.markdown("<p style='text-align: center; color: #64748b !important; margin-bottom: 25px;'>Bem-vindo! Por favor, insira seus dados</p>", unsafe_allow_html=True)
            
            with st.form("form_cadastro_moderno"):
                c_nome = st.text_input("👤 Nome Completo", placeholder="Ex: João da Silva")
                c_email = st.text_input("✉️ Seu E-mail", placeholder="joao@email.com")
                c_tel = st.text_input("📞 Nº celular com WhatsApp", placeholder="(00) 00000-0000")
                c_senha = st.text_input("🔒 Crie sua Senha", type="password")
                c_senha_confirma = st.text_input("🔒 Confirme sua Senha", type="password")
                
                st.write("")
                btn_cadastrar = st.form_submit_button("Criar Conta")

                if btn_cadastrar:
                    if not c_nome or not c_email or not c_senha or not c_senha_confirma:
                        st.warning("⚠️ Preencha todos os campos obrigatórios.")
                    elif c_senha != c_senha_confirma:
                        st.error("❌ As senhas digitadas não coincidem.")
                    else:
                        df_u = pd.DataFrame(aba_usuarios_db.get_all_records())
                        if "Email" not in df_u.columns: df_u["Email"] = ""
                        
                        # Usamos o Email como ID do usuário também
                        if c_email in df_u["Email"].astype(str).values:
                            st.error("❌ Esse E-mail já está cadastrado.")
                        else:
                            # Ordem: Usuario | Senha | Nivel | Status | Valor | Vencimento | Nome | Email | Telefone
                            aba_usuarios_db.append_row([c_email, c_senha, "Cliente", "Ativo", "0", "", c_nome, c_email, c_tel])
                            st.success("✅ Conta criada! Você já pode entrar.")
                            time.sleep(2)
                            st.session_state.tela_atual = "login"
                            st.rerun()

            st.write("")
            c_bt1, c_bt2, c_bt3 = st.columns([1, 1, 1])
            if c_bt2.button("Voltar", use_container_width=True):
                st.session_state.tela_atual = "login"
                st.rerun()


# ==========================================
# ROTA 2: SISTEMA LOGADO (DARK MODE)
# ==========================================
else:
    # --- CSS: DESIGN INDUSTRIAL DARK GERAL PARA O DASHBOARD ---
    st.markdown("""
        <style>
        .stApp { background-color: #121212 !important; }
        section[data-testid="stSidebar"] { background-color: #000000 !important; border-right: 1px solid #333; }
        h1, h2, h3 { color: #ffffff !important; font-family: 'Segoe UI', sans-serif; }
        p, label, span { color: #e0e0e0 !important; }
        div[role="radiogroup"] > label > div:first-child { display: none !important; }
        div[role="radiogroup"] label {
            padding: 12px 15px; border-radius: 6px; margin-bottom: 5px;
            background-color: transparent; color: #888888 !important; border: 1px solid transparent; transition: 0.3s;
        }
        div[role="radiogroup"] label:hover { background-color: #1f1f1f; color: #ffffff !important; }
        div[role="radiogroup"] label[data-checked="true"] {
            background-color: #1f1f1f !important; color: #4CAF50 !important; border-left: 4px solid #4CAF50 !important; font-weight: bold;
        }
        div[data-testid="stMetric"] { background-color: #1e1e1e !important; border: 1px solid #333 !important; border-radius: 8px !important; padding: 15px !important; }
        div[data-testid="stMetric"] label { color: #888 !important; }
        div[data-testid="stMetric"] div[data-testid="stMetricValue"] { color: #ffffff !important; }
        div[data-testid="stDataFrame"] { background-color: #1e1e1e !important; border: 1px solid #333; border-radius: 8px; padding: 5px; }
        div[data-testid="stDataFrame"] * { color: #e0e0e0 !important; }
        .stTextInput>div>div>input, .stNumberInput>div>div>input, .stDateInput>div>div>input, .stSelectbox>div>div>div { background-color: #1e1e1e !important; color: #ffffff !important; border: 1px solid #333 !important; }
        .stButton>button { background-color: #2e7d32 !important; color: white !important; border: none !important; border-radius: 4px !important; font-weight: bold !important; width: 100% !important; }
        .stButton>button:hover { background-color: #4CAF50 !important; }
        </style>
        """, unsafe_allow_html=True)

    st.sidebar.title(f"👤 Olá, {st.session_state.usuario}")
    st.sidebar.markdown(f"**Nível:** {st.session_state.nivel}")
    if st.sidebar.button("Sair / Logout"):
        st.session_state.logado = False
        st.rerun()
    st.sidebar.markdown("---")

    # === PAINEL MASTER ===
    if st.session_state.nivel.lower() == "master":
        st.title("👑 Central de Comando SaaS")
        df_users = pd.DataFrame(aba_usuarios_db.get_all_records())
        tab1, tab2, tab3 = st.tabs(["📋 Lista de Clientes", "➕ Cadastrar Master", "✏️ Editar / Bloquear"])

        with tab1:
            st.markdown("### Visão Geral de Assinantes")
            st.dataframe(df_users, use_container_width=True)

        with tab2:
            st.markdown("### Cadastrar Cliente Manualmente")
            with st.form("novo_cliente_master"):
                c1, c2, c3 = st.columns(3)
                n_nome = c1.text_input("Nome")
                n_email = c2.text_input("E-mail")
                n_tel = c3.text_input("Telefone")
                n_user = c1.text_input("Usuário (Login)")
                n_senha = c2.text_input("Senha")
                n_nivel = c3.selectbox("Nível", ["Cliente", "Master"])
                n_status = c1.selectbox("Status", ["Ativo", "Bloqueado"])
                n_valor = c2.number_input("Mensalidade (R$)", min_value=0.0, step=10.0)
                n_venc = c3.date_input("Data de Vencimento")
                if st.form_submit_button("SALVAR CLIENTE"):
                    if n_user in df_users["Usuario"].values:
                        st.error("Usuário já existe!")
                    elif n_user and n_senha:
                        aba_usuarios_db.append_row([n_user, n_senha, n_nivel, n_status, str(n_valor), n_venc.strftime('%d/%m/%Y'), n_nome, n_email, n_tel])
                        st.success("Cliente cadastrado com sucesso!")
                        time.sleep(1); st.rerun()

        with tab3:
            st.markdown("### Gerenciar Cliente (Financeiro e Acesso)")
            cliente_sel = st.selectbox("Selecione o Cliente:", [""] + df_users["Usuario"].tolist())
            if cliente_sel:
                row_data = df_users[df_users["Usuario"] == cliente_sel].iloc[0]
                with st.form("editar_cliente"):
                    c1, c2, c3 = st.columns(3)
                    e_nome = c1.text_input("Nome", value=str(row_data.get("Nome", "")))
                    e_email = c2.text_input("E-mail", value=str(row_data.get("Email", "")))
                    e_tel = c3.text_input("Telefone", value=str(row_data.get("Telefone", "")))
                    c4, c5, c6 = st.columns(3)
                    e_senha = c4.text_input("Senha", value=str(row_data.get("Senha", "")))
                    e_nivel = c5.selectbox("Nível", ["Cliente", "Master"], index=0 if row_data.get("Nivel", "") == "Cliente" else 1)
                    e_status = c6.selectbox("Status", ["Ativo", "Bloqueado"], index=0 if row_data.get("Status", "") == "Ativo" else 1)
                    c7, c8 = st.columns(2)
                    e_valor = c7.number_input("Valor (R$)", value=float(str(row_data.get("Valor", 0)).replace(',','.')), step=10.0)
                    try: venc_formatado = pd.to_datetime(row_data.get("Vencimento", ""), format='%d/%m/%Y').date()
                    except: venc_formatado = date.today()
                    e_venc = c8.date_input("Vencimento da Assinatura", value=venc_formatado)

                    if st.form_submit_button("ATUALIZAR DADOS"):
                        celula = aba_usuarios_db.find(cliente_sel, in_column=1)
                        linha = celula.row
                        aba_usuarios_db.update_cell(linha, 2, e_senha); aba_usuarios_db.update_cell(linha, 3, e_nivel); aba_usuarios_db.update_cell(linha, 4, e_status)
                        aba_usuarios_db.update_cell(linha, 5, str(e_valor)); aba_usuarios_db.update_cell(linha, 6, e_venc.strftime('%d/%m/%Y'))
                        aba_usuarios_db.update_cell(linha, 7, e_nome); aba_usuarios_db.update_cell(linha, 8, e_email); aba_usuarios_db.update_cell(linha, 9, e_tel)
                        st.success(f"Dados atualizados com sucesso!"); time.sleep(1); st.rerun()

    # === PAINEL DO CLIENTE ===
    else:
        def get_aba_cliente():
            nome_aba = f"Dados_{st.session_state.usuario}"
            try: return planilha.worksheet(nome_aba)
            except gspread.exceptions.WorksheetNotFound:
                ws = planilha.add_worksheet(title=nome_aba, rows="1000", cols="10")
                ws.append_row(["ID", "Tipo", "Descrição", "Valor", "Status", "Vencimento", "Categoria", "Forma_Pagamento"])
                return ws

        def carregar_dados():
            ws = get_aba_cliente()
            df = pd.DataFrame(ws.get_all_records())
            if df.empty:
                df = pd.DataFrame(columns=["ID", "Tipo", "Descrição", "Valor", "Status", "Vencimento", "Categoria", "Forma_Pagamento"])
                df['Vencimento'] = pd.to_datetime(df['Vencimento'])
            else:
                df['Vencimento'] = pd.to_datetime(df['Vencimento'], errors='coerce').fillna(pd.Timestamp.now())
                df['ID'] = df['ID'].astype(str); df['Forma_Pagamento'] = df['Forma_Pagamento'].astype(str); df['Valor'] = pd.to_numeric(df['Valor'], errors='coerce').fillna(0.0)
            return df

        def salvar_dados(df_novo):
            ws = get_aba_cliente()
            df_s = df_novo.copy()
            df_s['Vencimento'] = df_s['Vencimento'].dt.strftime('%Y-%m-%d'); df_s = df_s.fillna("")
            ws.clear(); ws.update(values=[df_s.columns.tolist()] + df_s.values.tolist(), range_name='A1')

        df = carregar_dados()
        hoje = date.today()
        CATEGORIAS = ["Consultoria", "Energia/Enel", "Internet", "Moradia", "Salário", "Serviços", "Outros"]
        PAGAMENTOS = ["Pix", "Cartão", "Dinheiro", "Boleto", "Outros"]

        opcoes_menu = {"📊  Painel Geral": "Painel", "🔮  Previsão": "Previsão", "📅  Calendário": "Calendário", "📝  Novo Lançamento": "Lançar", "📋  Histórico": "Histórico / Editar"}
        menu = opcoes_menu[st.sidebar.radio("Navegação", list(opcoes_menu.keys()), label_visibility="collapsed")]

        if menu == "Painel":
            st.title("Painel de Controle")
            if df.empty: st.info("👋 Olá! Seu financeiro está vazio. Vá em **Novo Lançamento**.")
            df_m = df[(df['Vencimento'].dt.month == hoje.month) & (df['Vencimento'].dt.year == hoje.year)].copy()
            c1, c2, c3 = st.columns(3)
            ent = df_m[df_m['Tipo']=='Recebimento']['Valor'].sum()
            sai = df_m[df_m['Tipo']=='Gasto']['Valor'].sum()
            c1.metric("Entradas (Mês)", f"R$ {ent:,.2f}"); c2.metric("Saídas (Mês)", f"R$ {sai:,.2f}"); c3.metric("Saldo Líquido", f"R$ {ent - sai:,.2f}")
            st.markdown("---"); st.subheader("📅 Próximos Pagamentos")
            pend = df[(df["Status"] == "Pendente") & (df["Tipo"] == "Gasto")].sort_values(by="Vencimento")
            if pend.empty: st.success("Nenhuma conta pendente.")
            else:
                for _, r in pend.head(5).iterrows():
                    dv = r['Vencimento'].date()
                    cor = "#ff5252" if dv < hoje else "#69f0ae"
                    c_dt, c_desc, c_val, c_btn = st.columns([1, 3, 2, 1])
                    c_dt.markdown(f"<span style='color:{cor}; font-weight:bold; font-size:1.1em'>{dv.strftime('%d/%m')}</span>", unsafe_allow_html=True)
                    c_desc.markdown(f"**{r['Descrição']}** - <small style='color:#888'>{r['Categoria']}</small>", unsafe_allow_html=True)
                    c_val.markdown(f"**R$ {r['Valor']:,.2f}**")
                    if c_btn.button("PAGAR", key=f"pay_d_{r['ID']}"):
                        df.loc[df['ID'] == r['ID'], 'Status'] = 'Pago'; salvar_dados(df); st.balloons(); time.sleep(0.5); st.rerun()

        elif menu == "Previsão":
            st.title("🔮 Previsão Futura")
            if df.empty: st.info("Sem dados.")
            else:
                futuro = df[df['Vencimento'].dt.date > hoje].copy()
                if futuro.empty: st.info("Sem dados futuros.")
                else:
                    futuro['Mes_Ano'] = futuro['Vencimento'].dt.strftime('%Y-%m')
                    chart = alt.Chart(futuro.groupby(['Mes_Ano', 'Tipo'])['Valor'].sum().reset_index()).mark_bar().encode(
                        x='Mes_Ano', y='Valor', color=alt.Color('Tipo', scale=alt.Scale(domain=['Recebimento', 'Gasto'], range=['#4CAF50', '#ff5252']))
                    ).properties(height=300)
                    st.altair_chart(chart, use_container_width=True)

        elif menu == "Calendário":
            st.title("Calendário")
            st.info("Função de calendário ativa. Utilize os filtros laterais para gerir.")

        elif menu == "Lançar":
            st.title("Novo Registro")
            with st.form("lancar", clear_on_submit=True):
                c1, c2 = st.columns(2)
                tipo = c1.selectbox("Tipo", ["Gasto", "Recebimento"])
                desc = c2.text_input("Descrição")
                val = c1.number_input("Valor", min_value=0.0)
                dt = c2.date_input("Data", value=hoje)
                cat, fop = c1.selectbox("Categoria", CATEGORIAS), c2.selectbox("Forma", PAGAMENTOS)
                rep = st.selectbox("Repetir?", ["Não", "Mensal"]); qtd = st.number_input("Vezes", 1, 60, 1)
                if st.form_submit_button("SALVAR REGISTRO"):
                    novos = []
                    bid = pd.Timestamp.now().strftime('%H%M%S')
                    for i in range(qtd if rep != "Não" else 1):
                        delta = relativedelta(months=i) if rep=="Mensal" else relativedelta(days=0)
                        novos.append({"ID": f"{bid}{i}", "Tipo": tipo, "Descrição": desc, "Valor": val, "Status": "Pago" if tipo=="Recebimento" else "Pendente", "Vencimento": pd.to_datetime(dt)+delta, "Categoria": cat, "Forma_Pagamento": fop})
                    salvar_dados(pd.concat([df, pd.DataFrame(novos)]))
                    st.success("Salvo!"); time.sleep(1); st.rerun()

        elif menu == "Histórico / Editar":
            st.title("Histórico")
            st.dataframe(df, use_container_width=True)
            sel = st.selectbox("Editar ID:", [""] + df['ID'].tolist())
            if sel:
                idx = df[df['ID'] == sel].index[0]
                with st.form("edit"):
                    c1, c2 = st.columns(2)
                    ed = c1.text_input("Descrição", df.at[idx,'Descrição'])
                    ev = c2.number_input("Valor", float(df.at[idx,'Valor']))
                    es = st.selectbox("Status", ["Pago", "Pendente"], index=0 if df.at[idx,'Status']=="Pago" else 1)
                    if st.form_submit_button("SALVAR"):
                        df.at[idx,'Descrição'] = ed; df.at[idx,'Valor'] = ev; df.at[idx,'Status'] = es
                        salvar_dados(df); st.success("Atualizado!"); time.sleep(0.5); st.rerun()
                    if st.form_submit_button("EXCLUIR"):
                        df = df.drop(idx); salvar_dados(df); st.warning("Excluído!"); time.sleep(0.5); st.rerun()
