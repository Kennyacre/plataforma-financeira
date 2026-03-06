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

# --- CSS: DESIGN INDUSTRIAL DARK GERAL ---
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
    .stButton>button { background-color: #2e7d32; color: white; border: none; border-radius: 4px; font-weight: bold; width: 100%; transition: 0.3s; text-transform: uppercase; letter-spacing: 1px; }
    .stButton>button:hover { background-color: #4CAF50; }
    </style>
    """, unsafe_allow_html=True)

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
    st.sidebar.markdown("---")

    # ==========================================
    # ROTA A: PAINEL MASTER
    # ==========================================
    if st.session_state.nivel.lower() == "master":
        st.title("👑 Central de Comando SaaS")
        aba_usuarios = planilha.worksheet("Usuarios")
        df_users = pd.DataFrame(aba_usuarios.get_all_records())

        tab1, tab2, tab3 = st.tabs(["📋 Lista de Clientes", "➕ Cadastrar Cliente", "✏️ Editar / Bloquear"])

        with tab1:
            st.markdown("### Visão Geral de Assinantes")
            st.dataframe(df_users, use_container_width=True)

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
                        aba_usuarios.append_row([n_user, n_senha, n_nivel, n_status, str(n_valor), n_venc.strftime('%d/%m/%Y')])
                        st.success("Cliente cadastrado com sucesso!")
                        st.rerun()

        with tab3:
            st.markdown("### Gerenciar ou Bloquear Cliente")
            cliente_sel = st.selectbox("Selecione o Cliente:", [""] + df_users["Usuario"].tolist())
            if cliente_sel:
                row_data = df_users[df_users["Usuario"] == cliente_sel].iloc[0]
                with st.form("editar_cliente"):
                    c1, c2 = st.columns(2)
                    e_senha = c1.text_input("Senha", value=str(row_data.get("Senha", "")))
                    e_nivel = c2.selectbox("Nível", ["Cliente", "Master"], index=0 if row_data.get("Nivel", "") == "Cliente" else 1)
                    e_status = c1.selectbox("Status", ["Ativo", "Bloqueado"], index=0 if row_data.get("Status", "") == "Ativo" else 1)
                    e_valor = c2.number_input("Valor (R$)", value=float(str(row_data.get("Valor", 0)).replace(',','.')), step=10.0)
                    try:
                        venc_formatado = pd.to_datetime(row_data.get("Vencimento", ""), format='%d/%m/%Y').date()
                    except:
                        venc_formatado = date.today()
                    e_venc = st.date_input("Vencimento", value=venc_formatado)

                    if st.form_submit_button("ATUALIZAR DADOS"):
                        celula = aba_usuarios.find(cliente_sel, in_column=1)
                        linha = celula.row
                        aba_usuarios.update_cell(linha, 2, e_senha)
                        aba_usuarios.update_cell(linha, 3, e_nivel)
                        aba_usuarios.update_cell(linha, 4, e_status)
                        aba_usuarios.update_cell(linha, 5, str(e_valor))
                        aba_usuarios.update_cell(linha, 6, e_venc.strftime('%d/%m/%Y'))
                        st.success(f"Dados atualizados!")
                        st.rerun()

    # ==========================================
    # ROTA B: PAINEL DO CLIENTE (GESTOR FINANCEIRO)
    # ==========================================
    else:
        # --- FUNÇÕES DE BANCO DE DADOS DO CLIENTE ---
        def get_aba_cliente():
            nome_aba = f"Dados_{st.session_state.usuario}"
            try:
                return planilha.worksheet(nome_aba)
            except gspread.exceptions.WorksheetNotFound:
                ws = planilha.add_worksheet(title=nome_aba, rows="1000", cols="10")
                ws.append_row(["ID", "Tipo", "Descrição", "Valor", "Status", "Vencimento", "Categoria", "Forma_Pagamento"])
                return ws

        def carregar_dados():
            ws = get_aba_cliente()
            registros = ws.get_all_records()
            df = pd.DataFrame(registros)
            if df.empty:
                df = pd.DataFrame(columns=["ID", "Tipo", "Descrição", "Valor", "Status", "Vencimento", "Categoria", "Forma_Pagamento"])
            else:
                df['Vencimento'] = pd.to_datetime(df['Vencimento'], errors='coerce').fillna(pd.Timestamp.now())
                df['ID'] = df['ID'].astype(str)
                df['Forma_Pagamento'] = df['Forma_Pagamento'].astype(str)
            return df

        def salvar_dados(df_novo):
            ws = get_aba_cliente()
            df_s = df_novo.copy()
            df_s['Vencimento'] = df_s['Vencimento'].dt.strftime('%Y-%m-%d')
            df_s = df_s.fillna("")
            dados_lista = [df_s.columns.tolist()] + df_s.values.tolist()
            ws.clear()
            ws.update(values=dados_lista, range_name='A1')

        # Carrega os dados específicos deste cliente
        df = carregar_dados()
        hoje = date.today()
        
        # Categorias fixas para a V1 do SaaS
        CATEGORIAS = ["Consultoria", "Energia/Enel", "Internet", "Moradia", "Salário", "Serviços", "Outros"]
        PAGAMENTOS = ["Pix", "Cartão", "Dinheiro", "Boleto", "Outros"]

        opcoes_menu = {"📊  Painel Geral": "Painel", "🔮  Previsão": "Previsão", "📅  Calendário": "Calendário", "📝  Novo Lançamento": "Lançar", "📋  Histórico": "Histórico / Editar"}
        escolha = st.sidebar.radio("Navegação", list(opcoes_menu.keys()), label_visibility="collapsed")
        menu = opcoes_menu[escolha]

        if menu == "Painel":
            st.title("Painel de Controle")
            df_m = df[(df['Vencimento'].dt.month == hoje.month) & (df['Vencimento'].dt.year == hoje.year)].copy()
            c1, c2, c3 = st.columns(3)
            ent = df_m[df_m['Tipo']=='Recebimento']['Valor'].sum()
            sai = df_m[df_m['Tipo']=='Gasto']['Valor'].sum()
            c1.metric("Entradas (Mês)", f"R$ {ent:,.2f}")
            c2.metric("Saídas (Mês)", f"R$ {sai:,.2f}")
            c3.metric("Saldo Líquido", f"R$ {ent - sai:,.2f}")
            
            st.markdown("---")
            st.subheader("📅 Próximos Pagamentos")
            pend = df[(df["Status"] == "Pendente") & (df["Tipo"] == "Gasto")].sort_values(by="Vencimento")
            if pend.empty: st.success("Nenhuma conta pendente.")
            else:
                for _, r in pend.head(5).iterrows():
                    dv = r['Vencimento'].date()
                    cor = "#ff5252" if dv < hoje else "#69f0ae"
                    with st.container():
                        c_dt, c_desc, c_val, c_btn = st.columns([1, 3, 2, 1])
                        c_dt.markdown(f"<span style='color:{cor}; font-weight:bold; font-size:1.1em'>{dv.strftime('%d/%m')}</span>", unsafe_allow_html=True)
                        c_desc.markdown(f"**{r['Descrição']}** - <small style='color:#888'>{r['Categoria']}</small>", unsafe_allow_html=True)
                        c_val.markdown(f"**R$ {r['Valor']:,.2f}**")
                        if c_btn.button("PAGAR", key=f"pay_d_{r['ID']}"):
                            df.loc[df['ID'] == r['ID'], 'Status'] = 'Pago'; salvar_dados(df); st.balloons(); time.sleep(0.5); st.rerun()
                    st.markdown("<hr style='margin:5px 0; border-color:#333'>", unsafe_allow_html=True)

        elif menu == "Previsão":
            st.title("🔮 Previsão Futura")
            futuro = df[df['Vencimento'].dt.date > hoje].copy()
            if futuro.empty: st.info("Sem dados futuros.")
            else:
                futuro['Mes_Ano'] = futuro['Vencimento'].dt.strftime('%Y-%m')
                resumo = futuro.groupby(['Mes_Ano', 'Tipo'])['Valor'].sum().reset_index()
                chart = alt.Chart(resumo).mark_bar().encode(
                    x=alt.X('Mes_Ano', title='Mês'), y=alt.Y('Valor', title='Valor (R$)'),
                    color=alt.Color('Tipo', scale=alt.Scale(domain=['Recebimento', 'Gasto'], range=['#4CAF50', '#ff5252'])),
                    tooltip=['Mes_Ano', 'Tipo', 'Valor']
                ).properties(height=300)
                st.altair_chart(chart, use_container_width=True)

        elif menu == "Calendário":
            st.title("Calendário de Vencimentos")
            pend = df[(df["Status"] == "Pendente") & (df["Tipo"] == "Gasto")].sort_values(by="Vencimento")
            if not pend.empty:
                pend['Mes_Ano_Str'] = pend['Vencimento'].dt.strftime('%Y-%m')
                lista_meses = sorted(pend['Mes_Ano_Str'].unique())
            else: lista_meses = []
            c_f1, c_f2, c_f3 = st.columns([1, 1, 1.5])
            sel_mes = c_f1.selectbox("📅 Mês", ["Todos"] + lista_meses)
            sel_cat = c_f2.selectbox("📂 Categoria", ["Todas"] + CATEGORIAS)
            busca_cal = c_f3.text_input("🔍 Buscar Conta", placeholder="Descrição...")
            df_show = pend.copy()
            if sel_mes != "Todos": df_show = df_show[df_show['Mes_Ano_Str'] == sel_mes]
            if sel_cat != "Todas": df_show = df_show[df_show['Categoria'] == sel_cat]
            if busca_cal:
                mask = df_show.apply(lambda x: x.astype(str).str.contains(busca_cal, case=False).any(), axis=1)
                df_show = df_show[mask]
            st.markdown("---")
            m1, m2 = st.columns(2)
            m1.metric("Total na Tela", f"R$ {df_show['Valor'].sum():,.2f}")
            m2.metric("Atrasado (Seleção)", f"R$ {df_show[df_show['Vencimento'].dt.date < hoje]['Valor'].sum():,.2f}")
            st.markdown("---")
            for _, r in df_show.iterrows():
                dv = r['Vencimento'].date()
                cor = "#ff5252" if dv < hoje else "#69f0ae"
                with st.container():
                    c_dt, c_desc, c_val, c_btn = st.columns([1, 3, 2, 1])
                    c_dt.markdown(f"<span style='color:{cor}; font-weight:bold'>{dv.strftime('%d/%m')}</span>", unsafe_allow_html=True)
                    c_desc.markdown(f"**{r['Descrição']}**", unsafe_allow_html=True)
                    c_val.markdown(f"R$ {r['Valor']:,.2f}")
                    if c_btn.button("PAGAR", key=f"pay_c_{r['ID']}"):
                        df.loc[df['ID'] == r['ID'], 'Status'] = 'Pago'; salvar_dados(df); st.balloons(); time.sleep(0.5); st.rerun()

        elif menu == "Lançar":
            st.title("Novo Registro")
            with st.form("lancar", clear_on_submit=True):
                c1, c2 = st.columns(2)
                tipo = c1.selectbox("Tipo", ["Gasto", "Recebimento"])
                desc = c2.text_input("Descrição")
                val = c1.number_input("Valor", min_value=0.0)
                dt = c2.date_input("Data", value=hoje)
                cat, fop = c1.selectbox("Categoria", CATEGORIAS), c2.selectbox("Forma", PAGAMENTOS)
                st.markdown("##### Opções de Repetição")
                r1, r2 = st.columns(2)
                rep = r1.selectbox("Repetir?", ["Não", "Semanal", "Mensal", "Anual"])
                qtd = r2.number_input("Vezes", 1, 60, 1)
                if st.form_submit_button("SALVAR REGISTRO"):
                    novos = []
                    bid = pd.Timestamp.now().strftime('%H%M%S')
                    loop_qtd = qtd if rep != "Não" else 1
                    for i in range(loop_qtd):
                        delta = relativedelta(weeks=i) if rep=="Semanal" else relativedelta(months=i) if rep=="Mensal" else relativedelta(years=i) if rep=="Anual" else relativedelta(days=0)
                        novos.append({"ID": f"{bid}{i}", "Tipo": tipo, "Descrição": desc, "Valor": val, "Status": "Pago" if tipo=="Recebimento" else "Pendente", "Vencimento": pd.to_datetime(dt)+delta, "Categoria": cat, "Forma_Pagamento": fop})
                    df_final = pd.concat([df, pd.DataFrame(novos)])
                    salvar_dados(df_final)
                    st.success(f"Salvo {len(novos)} registros!"); time.sleep(1); st.rerun()

        elif menu == "Histórico / Editar":
            st.title("Histórico")
            df_exibicao = df.copy()
            if not df_exibicao.empty:
                df_exibicao['Mes_Ano_Str'] = df_exibicao['Vencimento'].dt.strftime('%Y-%m')
                lista_meses = sorted(df_exibicao['Mes_Ano_Str'].unique(), reverse=True)
            else: lista_meses = []
            
            col_f1, col_f2, col_f3 = st.columns([1, 1, 1.5])
            with col_f1: sel_mes = st.selectbox("📅 Mês", ["Todos"] + lista_meses)
            with col_f2: sel_cat = st.selectbox("📂 Categoria", ["Todas"] + CATEGORIAS)
            with col_f3: busca = st.text_input("🔍 Busca", placeholder="Texto...")
            
            if sel_mes != "Todos": df_exibicao = df_exibicao[df_exibicao['Mes_Ano_Str'] == sel_mes]
            if sel_cat != "Todas": df_exibicao = df_exibicao[df_exibicao['Categoria'] == sel_cat]
            if busca:
                mask = df_exibicao.apply(lambda x: x.astype(str).str.contains(busca, case=False).any(), axis=1)
                df_exibicao = df_exibicao[mask]
            
            cols_show = [c for c in df_exibicao.columns if c != 'Mes_Ano_Str']
            st.dataframe(df_exibicao[cols_show].sort_values(by="Vencimento", ascending=False), use_container_width=True)
            
            st.markdown("---")
            st.subheader("Editar Registro")
            opcoes = [""] + [f"{r['ID']} | {r['Descrição']}" for _, r in df_exibicao.iterrows()]
            sel = st.selectbox("Selecione ID para Editar:", opcoes)
            
            if sel:
                id_selecionado = sel.split(" | ")[0]
                idx = df[df['ID'] == id_selecionado].index[0]
                with st.form("edit"):
                    c1, c2 = st.columns(2)
                    ed = c1.text_input("Descrição", df.at[idx,'Descrição'])
                    ev = c2.number_input("Valor", float(df.at[idx,'Valor']))
                    c3, c4, c5 = st.columns(3)
                    ec = c3.selectbox("Categoria", CATEGORIAS, index=CATEGORIAS.index(df.at[idx,'Categoria']) if df.at[idx,'Categoria'] in CATEGORIAS else 0)
                    val_atual = str(df.at[idx,'Forma_Pagamento'])
                    idx_pag = PAGAMENTOS.index(val_atual) if val_atual in PAGAMENTOS else 0
                    ef = c4.selectbox("Pagamento", PAGAMENTOS, index=idx_pag)
                    es = c5.selectbox("Status", ["Pago", "Pendente"], index=0 if df.at[idx,'Status']=="Pago" else 1)
                    st.markdown("<br>", unsafe_allow_html=True)
                    b1, b2, b3 = st.columns(3)
                    if b1.form_submit_button("SALVAR"):
                        df.at[idx,'Descrição'] = ed; df.at[idx,'Valor'] = ev; df.at[idx,'Categoria'] = ec; df.at[idx,'Forma_Pagamento'] = ef; df.at[idx,'Status'] = es
                        salvar_dados(df); st.success("Atualizado!"); time.sleep(0.5); st.rerun()
                    if b3.form_submit_button("EXCLUIR"):
                        df = df.drop(idx); salvar_dados(df); st.warning("Excluído!"); time.sleep(0.5); st.rerun()
