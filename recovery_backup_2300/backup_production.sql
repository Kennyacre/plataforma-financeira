--
-- PostgreSQL database dump
--

\restrict 6Md7S8nKZm1N97DhJL0D1NhdyHRiqXEETEbPGqWv8MAxyjatmbqTrR0krQZpyJv

-- Dumped from database version 15.17
-- Dumped by pg_dump version 15.17

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: cartoes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cartoes (
    id integer NOT NULL,
    username character varying(50),
    nome_cartao character varying(100),
    dia_fechamento integer,
    limite_total numeric(15,2),
    fatura_atual numeric(15,2) DEFAULT 0,
    cor_card character varying(20),
    dia_vencimento integer
);


ALTER TABLE public.cartoes OWNER TO postgres;

--
-- Name: cartoes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.cartoes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.cartoes_id_seq OWNER TO postgres;

--
-- Name: cartoes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.cartoes_id_seq OWNED BY public.cartoes.id;


--
-- Name: categorias; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.categorias (
    id integer NOT NULL,
    username character varying(50),
    nome character varying(100),
    tipo character varying(20),
    cor character varying(20) DEFAULT '#3b82f6'::character varying
);


ALTER TABLE public.categorias OWNER TO postgres;

--
-- Name: categorias_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.categorias_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.categorias_id_seq OWNER TO postgres;

--
-- Name: categorias_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.categorias_id_seq OWNED BY public.categorias.id;


--
-- Name: convites; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.convites (
    id integer NOT NULL,
    remetente character varying(255),
    destinatario character varying(255),
    status character varying(50) DEFAULT 'pendente'::character varying
);


ALTER TABLE public.convites OWNER TO postgres;

--
-- Name: convites_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.convites_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.convites_id_seq OWNER TO postgres;

--
-- Name: convites_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.convites_id_seq OWNED BY public.convites.id;


--
-- Name: faturas; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.faturas (
    id integer NOT NULL,
    usuario_login character varying(255),
    descricao character varying(255),
    valor numeric(10,2),
    vencimento date,
    status character varying(50) DEFAULT 'Pendente'::character varying
);


ALTER TABLE public.faturas OWNER TO postgres;

--
-- Name: faturas_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.faturas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.faturas_id_seq OWNER TO postgres;

--
-- Name: faturas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.faturas_id_seq OWNED BY public.faturas.id;


--
-- Name: financas; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.financas (
    id integer NOT NULL,
    username character varying(50),
    tipo character varying(20),
    descricao character varying(255),
    valor numeric(15,2),
    data date,
    categoria character varying(50),
    pagamento character varying(50),
    status character varying(20) DEFAULT 'pago'::character varying
);


ALTER TABLE public.financas OWNER TO postgres;

--
-- Name: financas_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.financas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.financas_id_seq OWNER TO postgres;

--
-- Name: financas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.financas_id_seq OWNED BY public.financas.id;


--
-- Name: financeiro; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.financeiro (
    id integer NOT NULL,
    descricao character varying(255),
    valor numeric(10,2),
    tipo character varying(50),
    usuario_login character varying(255)
);


ALTER TABLE public.financeiro OWNER TO postgres;

--
-- Name: financeiro_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.financeiro_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.financeiro_id_seq OWNER TO postgres;

--
-- Name: financeiro_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.financeiro_id_seq OWNED BY public.financeiro.id;


--
-- Name: formas_pagamento; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.formas_pagamento (
    id integer NOT NULL,
    username character varying(50),
    nome character varying(100)
);


ALTER TABLE public.formas_pagamento OWNER TO postgres;

--
-- Name: formas_pagamento_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.formas_pagamento_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.formas_pagamento_id_seq OWNER TO postgres;

--
-- Name: formas_pagamento_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.formas_pagamento_id_seq OWNED BY public.formas_pagamento.id;


--
-- Name: metas_gastos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.metas_gastos (
    id integer NOT NULL,
    username character varying(50),
    categoria character varying(100),
    limite numeric(15,2)
);


ALTER TABLE public.metas_gastos OWNER TO postgres;

--
-- Name: metas_gastos_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.metas_gastos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.metas_gastos_id_seq OWNER TO postgres;

--
-- Name: metas_gastos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.metas_gastos_id_seq OWNED BY public.metas_gastos.id;


--
-- Name: pacotes_credito; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pacotes_credito (
    id integer NOT NULL,
    nome character varying(100),
    creditos integer,
    valor numeric(15,2)
);


ALTER TABLE public.pacotes_credito OWNER TO postgres;

--
-- Name: pacotes_credito_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.pacotes_credito_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.pacotes_credito_id_seq OWNER TO postgres;

--
-- Name: pacotes_credito_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.pacotes_credito_id_seq OWNED BY public.pacotes_credito.id;


--
-- Name: solicitacoes_credito; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.solicitacoes_credito (
    id integer NOT NULL,
    username character varying(50),
    quantidade integer,
    status character varying(20) DEFAULT 'Pendente'::character varying,
    data_solicitacao timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.solicitacoes_credito OWNER TO postgres;

--
-- Name: solicitacoes_credito_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.solicitacoes_credito_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.solicitacoes_credito_id_seq OWNER TO postgres;

--
-- Name: solicitacoes_credito_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.solicitacoes_credito_id_seq OWNED BY public.solicitacoes_credito.id;


--
-- Name: usuarios; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.usuarios (
    id integer NOT NULL,
    username character varying(50),
    password character varying(100),
    email character varying(255),
    role character varying(20),
    creditos integer DEFAULT 0,
    revendedor character varying(50),
    vencimento date,
    deletado boolean DEFAULT false,
    status character varying(20) DEFAULT 'ativo'::character varying,
    nome_completo character varying(100),
    is_premium boolean DEFAULT false,
    reset_senha boolean DEFAULT false
);


ALTER TABLE public.usuarios OWNER TO postgres;

--
-- Name: usuarios_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.usuarios_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.usuarios_id_seq OWNER TO postgres;

--
-- Name: usuarios_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.usuarios_id_seq OWNED BY public.usuarios.id;


--
-- Name: cartoes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cartoes ALTER COLUMN id SET DEFAULT nextval('public.cartoes_id_seq'::regclass);


--
-- Name: categorias id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categorias ALTER COLUMN id SET DEFAULT nextval('public.categorias_id_seq'::regclass);


--
-- Name: convites id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.convites ALTER COLUMN id SET DEFAULT nextval('public.convites_id_seq'::regclass);


--
-- Name: faturas id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.faturas ALTER COLUMN id SET DEFAULT nextval('public.faturas_id_seq'::regclass);


--
-- Name: financas id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.financas ALTER COLUMN id SET DEFAULT nextval('public.financas_id_seq'::regclass);


--
-- Name: financeiro id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.financeiro ALTER COLUMN id SET DEFAULT nextval('public.financeiro_id_seq'::regclass);


--
-- Name: formas_pagamento id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.formas_pagamento ALTER COLUMN id SET DEFAULT nextval('public.formas_pagamento_id_seq'::regclass);


--
-- Name: metas_gastos id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.metas_gastos ALTER COLUMN id SET DEFAULT nextval('public.metas_gastos_id_seq'::regclass);


--
-- Name: pacotes_credito id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pacotes_credito ALTER COLUMN id SET DEFAULT nextval('public.pacotes_credito_id_seq'::regclass);


--
-- Name: solicitacoes_credito id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.solicitacoes_credito ALTER COLUMN id SET DEFAULT nextval('public.solicitacoes_credito_id_seq'::regclass);


--
-- Name: usuarios id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios ALTER COLUMN id SET DEFAULT nextval('public.usuarios_id_seq'::regclass);


--
-- Data for Name: cartoes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.cartoes (id, username, nome_cartao, dia_fechamento, limite_total, fatura_atual, cor_card, dia_vencimento) FROM stdin;
5	dudinha	edmais tobias	1	350.00	0.00	#00bd9d	15
6	dudinha	edmais duda	1	680.00	0.00	#e55ff7	15
1	dudinha	nubank	4	400.00	397.70	#572eb8	11
3	dudinha	trickard	8	350.00	349.13	#2f009e	15
2	dudinha	santander	28	260.00	0.00	#d60000	6
\.


--
-- Data for Name: categorias; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.categorias (id, username, nome, tipo, cor) FROM stdin;
1	dudinha	informatica	gasto	#3b82f6
\.


--
-- Data for Name: convites; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.convites (id, remetente, destinatario, status) FROM stdin;
\.


--
-- Data for Name: faturas; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.faturas (id, usuario_login, descricao, valor, vencimento, status) FROM stdin;
\.


--
-- Data for Name: financas; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.financas (id, username, tipo, descricao, valor, data, categoria, pagamento, status) FROM stdin;
44	dudinha	gasto	EDMAI DUDA	89.63	2026-05-07	Vestuário	PIX	pago
68	dudinha	gasto	CRUNCHYROLL	24.99	2026-07-06	Moradia	PIX	pendente
47	dudinha	gasto	CONTAS CELULARES// TIM	99.98	2026-07-07	Outros	PIX	pendente
77	bahvillet	gasto	LUZ	82.00	2026-05-05	Moradia	PIX	pendente
79	bahvillet	gasto	Empréstimo 	250.00	2026-05-07	Outros	PIX	pendente
78	bahvillet	gasto	Perfume	95.00	2026-05-20	Cuidados Pessoais	PIX	pendente
80	bahvillet	gasto	Van	135.00	2026-05-07	Transporte	PIX	pendente
81	bahvillet	gasto	Plano TIM	49.00	2026-05-05	Outros	Boleto	pendente
38	dudinha	gasto	CONTA DE INTERNET	156.59	2026-07-15	Moradia	Boleto	pendente
82	bahvillet	gasto	Agua	6.00	2026-05-06	Moradia	PIX	pendente
60	dudinha	gasto	MEI DUDA	87.05	2026-12-20	Impostos / Taxas	PIX	pendente
52	dudinha	gasto	CONTAS CELULARES// TIM	99.98	2026-12-07	Outros	PIX	pendente
73	dudinha	gasto	CRUNCHYROLL	24.99	2026-12-06	Moradia	PIX	pendente
75	dudinha	gasto	fatura santander	266.17	2026-05-06	Outros	santander	pago
2	dudinha	gasto	UBER AMANDA	145.00	2026-05-07	Educação	PIX	pendente
3	dudinha	gasto	PARCELAMENTO ITÁU	145.07	2026-05-08	Outros	PIX	pendente
61	dudinha	gasto	FACULDADE TOBIAS	214.24	2026-05-10	Educação	PIX	pendente
74	dudinha	gasto	fatura nubank	397.70	2026-05-11	Outros	nubank	pendente
83	dudinha	gasto	CONTA DE LUZ	409.69	2026-05-10	Impostos / Taxas	PIX	pago
76	dudinha	gasto	fatura tricard	349.13	2026-05-15	Alimentação	trickard	pendente
67	dudinha	gasto	CRUNCHYROLL	24.99	2026-06-06	Moradia	PIX	pendente
46	dudinha	gasto	CONTAS CELULARES// TIM	99.98	2026-06-07	Outros	PIX	pendente
4	dudinha	gasto	PARCELAMENTO ITÁU	145.07	2026-06-08	Outros	PIX	pendente
62	dudinha	gasto	FACULDADE TOBIAS	214.24	2026-06-10	Educação	PIX	pendente
55	dudinha	gasto	MEI DUDA	87.05	2026-07-20	Impostos / Taxas	PIX	pendente
37	dudinha	gasto	CONTA DE INTERNET	156.59	2026-06-15	Moradia	Boleto	pendente
54	dudinha	gasto	MEI DUDA	87.05	2026-06-20	Impostos / Taxas	PIX	pendente
48	dudinha	gasto	CONTAS CELULARES// TIM	99.98	2026-08-07	Outros	PIX	pendente
69	dudinha	gasto	CRUNCHYROLL	24.99	2026-08-06	Moradia	PIX	pendente
56	dudinha	gasto	MEI DUDA	87.05	2026-08-20	Impostos / Taxas	PIX	pendente
39	dudinha	gasto	CONTA DE INTERNET	156.59	2026-08-15	Moradia	Boleto	pendente
70	dudinha	gasto	CRUNCHYROLL	24.99	2026-09-06	Moradia	PIX	pendente
49	dudinha	gasto	CONTAS CELULARES// TIM	99.98	2026-09-07	Outros	PIX	pendente
40	dudinha	gasto	CONTA DE INTERNET	156.59	2026-09-15	Moradia	Boleto	pendente
57	dudinha	gasto	MEI DUDA	87.05	2026-09-20	Impostos / Taxas	PIX	pendente
71	dudinha	gasto	CRUNCHYROLL	24.99	2026-10-06	Moradia	PIX	pendente
50	dudinha	gasto	CONTAS CELULARES// TIM	99.98	2026-10-07	Outros	PIX	pendente
41	dudinha	gasto	CONTA DE INTERNET	156.59	2026-10-15	Moradia	Boleto	pendente
58	dudinha	gasto	MEI DUDA	87.05	2026-10-20	Impostos / Taxas	PIX	pendente
72	dudinha	gasto	CRUNCHYROLL	24.99	2026-11-06	Moradia	PIX	pendente
51	dudinha	gasto	CONTAS CELULARES// TIM	99.98	2026-11-07	Outros	PIX	pendente
42	dudinha	gasto	CONTA DE INTERNET	156.59	2026-11-15	Moradia	Boleto	pendente
36	dudinha	gasto	CONTA DE INTERNET	156.59	2026-05-15	Moradia	Boleto	pendente
85	dudinha	gasto	IPTU	96.88	2026-05-11	Moradia	PIX	pago
63	dudinha	gasto	TOALHA/CREME	150.00	2026-05-08	Vestuário	PIX	pago
59	dudinha	gasto	MEI DUDA	87.05	2026-11-20	Impostos / Taxas	PIX	pago
53	dudinha	gasto	MEI DUDA	87.05	2026-05-20	Impostos / Taxas	PIX	pago
43	dudinha	gasto	EDMAIS TOBIAS 	94.37	2026-05-13	Vestuário	PIX	pago
84	dudinha	gasto	CONTA DE AGUA	35.50	2026-05-07	Moradia	PIX	pago
86	dudinha	gasto	CANVA	35.00	2026-05-04	Outros	PIX	pago
66	dudinha	gasto	CRUNCHYROLL	24.99	2026-05-06	Moradia	PIX	pago
88	dudinha	gasto	Pagamento Fatura: santander	266.17	2026-05-01	Outros	Saldo em Conta	pago
45	dudinha	gasto	CONTAS CELULARES// TIM	124.00	2026-05-07	Outros	PIX	pendente
89	dudinha	recebimento	RESCISÃO DUDA	2679.68	2026-05-01	Outros	Transferência	pago
90	dudinha	recebimento	SALARIO TOBIAS	1500.00	2026-05-07	Outros	PIX	pendente
122	dudinha	gasto	PADARIA	34.00	2026-05-01	Moradia	PIX	pago
155	dudinha	gasto	lazer 	50.00	2026-05-01	Lazer e Viagens	PIX	pago
156	dudinha	gasto	placa mae gordinho	150.00	2026-05-06	informatica	PIX	pendente
87	dudinha	gasto	GÁS	129.99	2026-05-01	Moradia	PIX	pago
157	usuario	gasto	TN INFO FINANCES	20.00	2026-03-13	Consultoria	Pix	pendente
158	usuario	gasto	TN INFO FINANCES	20.00	2026-04-13	Consultoria	Pix	pendente
159	usuario	gasto	TN INFO FINANCES	20.00	2026-05-13	Consultoria	Pix	pendente
160	usuario	gasto	TN INFO FINANCES	20.00	2026-06-13	Consultoria	Pix	pendente
161	usuario	gasto	TN INFO FINANCES	20.00	2026-07-13	Consultoria	Pix	pendente
162	usuario	gasto	TN INFO FINANCES	20.00	2026-08-13	Consultoria	Pix	pendente
163	usuario	gasto	TN INFO FINANCES	20.00	2026-09-13	Consultoria	Pix	pendente
164	usuario	gasto	TN INFO FINANCES	20.00	2026-10-13	Consultoria	Pix	pendente
165	usuario	gasto	TN INFO FINANCES	20.00	2026-11-13	Consultoria	Pix	pendente
\.


--
-- Data for Name: financeiro; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.financeiro (id, descricao, valor, tipo, usuario_login) FROM stdin;
\.


--
-- Data for Name: formas_pagamento; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.formas_pagamento (id, username, nome) FROM stdin;
\.


--
-- Data for Name: metas_gastos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.metas_gastos (id, username, categoria, limite) FROM stdin;
\.


--
-- Data for Name: pacotes_credito; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pacotes_credito (id, nome, creditos, valor) FROM stdin;
\.


--
-- Data for Name: solicitacoes_credito; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.solicitacoes_credito (id, username, quantidade, status, data_solicitacao) FROM stdin;
\.


--
-- Data for Name: usuarios; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.usuarios (id, username, password, email, role, creditos, revendedor, vencimento, deletado, status, nome_completo, is_premium, reset_senha) FROM stdin;
1	admin	451630	\N	admin	0	\N	\N	f	ativo	\N	f	f
2	cliente_teste	password123	\N	cliente	0	\N	2026-05-20	t	ativo	\N	f	f
3	contascasa	451630	tobiasramos.15@gmail.com	cliente	0	\N	2026-05-20	f	ativo	familia	f	f
5	bahvillet	bt231198	barbarateixeira2311@gmail.com	cliente	0	\N	2030-12-31	f	ativo	Barbara Villet	t	f
4	dudinha	123456	dudinhacf14@gmail.com	cliente	0	\N	2099-12-31	f	ativo	Duda	t	f
6	cliente	5994471abb01112afcc18159f6cc74b4f511b99806da59b3caf5a9c173cacfc5		cliente	0	\N	2026-03-12	f	ativo	cliente	f	f
7	joao	c85d864af00614dd04de7af3b82d2a740288159af0ce66ba4e5cb9da854c4b65		cliente	0	\N	2026-03-12	f	ativo	teste	f	f
8	kennyacre	c85d864af00614dd04de7af3b82d2a740288159af0ce66ba4e5cb9da854c4b65		admin	0	\N	2026-03-13	f	ativo	tobias	f	f
\.


--
-- Name: cartoes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.cartoes_id_seq', 6, true);


--
-- Name: categorias_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.categorias_id_seq', 1, true);


--
-- Name: convites_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.convites_id_seq', 1, false);


--
-- Name: faturas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.faturas_id_seq', 1, true);


--
-- Name: financas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.financas_id_seq', 165, true);


--
-- Name: financeiro_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.financeiro_id_seq', 1, false);


--
-- Name: formas_pagamento_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.formas_pagamento_id_seq', 1, false);


--
-- Name: metas_gastos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.metas_gastos_id_seq', 1, false);


--
-- Name: pacotes_credito_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.pacotes_credito_id_seq', 1, false);


--
-- Name: solicitacoes_credito_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.solicitacoes_credito_id_seq', 1, false);


--
-- Name: usuarios_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.usuarios_id_seq', 8, true);


--
-- Name: cartoes cartoes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cartoes
    ADD CONSTRAINT cartoes_pkey PRIMARY KEY (id);


--
-- Name: categorias categorias_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categorias
    ADD CONSTRAINT categorias_pkey PRIMARY KEY (id);


--
-- Name: convites convites_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.convites
    ADD CONSTRAINT convites_pkey PRIMARY KEY (id);


--
-- Name: faturas faturas_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.faturas
    ADD CONSTRAINT faturas_pkey PRIMARY KEY (id);


--
-- Name: financas financas_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.financas
    ADD CONSTRAINT financas_pkey PRIMARY KEY (id);


--
-- Name: financeiro financeiro_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.financeiro
    ADD CONSTRAINT financeiro_pkey PRIMARY KEY (id);


--
-- Name: formas_pagamento formas_pagamento_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.formas_pagamento
    ADD CONSTRAINT formas_pagamento_pkey PRIMARY KEY (id);


--
-- Name: metas_gastos metas_gastos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.metas_gastos
    ADD CONSTRAINT metas_gastos_pkey PRIMARY KEY (id);


--
-- Name: metas_gastos metas_gastos_username_categoria_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.metas_gastos
    ADD CONSTRAINT metas_gastos_username_categoria_key UNIQUE (username, categoria);


--
-- Name: pacotes_credito pacotes_credito_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pacotes_credito
    ADD CONSTRAINT pacotes_credito_pkey PRIMARY KEY (id);


--
-- Name: solicitacoes_credito solicitacoes_credito_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.solicitacoes_credito
    ADD CONSTRAINT solicitacoes_credito_pkey PRIMARY KEY (id);


--
-- Name: usuarios usuarios_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id);


--
-- Name: usuarios usuarios_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_username_key UNIQUE (username);


--
-- PostgreSQL database dump complete
--

\unrestrict 6Md7S8nKZm1N97DhJL0D1NhdyHRiqXEETEbPGqWv8MAxyjatmbqTrR0krQZpyJv

