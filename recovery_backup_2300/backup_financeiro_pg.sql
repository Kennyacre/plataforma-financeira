--
-- PostgreSQL database cluster dump
--

\restrict PM7jr9XkLabew2SoR55VXRIBEJlpt0iuN3VEPQthAh3Qam3tBK8isHoGSXHi3Zw

SET default_transaction_read_only = off;

SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;

--
-- Drop databases (except postgres and template1)
--

DROP DATABASE "TN_INFO_DATABASE";
DROP DATABASE saas_db;




--
-- Drop roles
--

DROP ROLE postgres;


--
-- Roles
--

CREATE ROLE postgres;
ALTER ROLE postgres WITH SUPERUSER INHERIT CREATEROLE CREATEDB LOGIN REPLICATION BYPASSRLS PASSWORD 'SCRAM-SHA-256$4096:c/Nz5FX4oX6NBlhJmGhGOQ==$+KkAm8egrPlwowK+CWdSyY8QMj/Ae0bg7FI9RWGaw18=:AbuI3HoWeT+sSz03+6nFPbkiRL484NLGsivUbaivV1M=';

--
-- User Configurations
--








\unrestrict PM7jr9XkLabew2SoR55VXRIBEJlpt0iuN3VEPQthAh3Qam3tBK8isHoGSXHi3Zw

--
-- Databases
--

--
-- Database "template1" dump
--

--
-- PostgreSQL database dump
--

\restrict FfxUhBbXiVgKze9fS54CajdudEA0Ucf2SaX9p35NW0FVMpz3qH83xlNQEqsutKU

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

UPDATE pg_catalog.pg_database SET datistemplate = false WHERE datname = 'template1';
DROP DATABASE template1;
--
-- Name: template1; Type: DATABASE; Schema: -; Owner: postgres
--

CREATE DATABASE template1 WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'en_US.utf8';


ALTER DATABASE template1 OWNER TO postgres;

\unrestrict FfxUhBbXiVgKze9fS54CajdudEA0Ucf2SaX9p35NW0FVMpz3qH83xlNQEqsutKU
\connect template1
\restrict FfxUhBbXiVgKze9fS54CajdudEA0Ucf2SaX9p35NW0FVMpz3qH83xlNQEqsutKU

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

--
-- Name: DATABASE template1; Type: COMMENT; Schema: -; Owner: postgres
--

COMMENT ON DATABASE template1 IS 'default template for new databases';


--
-- Name: template1; Type: DATABASE PROPERTIES; Schema: -; Owner: postgres
--

ALTER DATABASE template1 IS_TEMPLATE = true;


\unrestrict FfxUhBbXiVgKze9fS54CajdudEA0Ucf2SaX9p35NW0FVMpz3qH83xlNQEqsutKU
\connect template1
\restrict FfxUhBbXiVgKze9fS54CajdudEA0Ucf2SaX9p35NW0FVMpz3qH83xlNQEqsutKU

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

--
-- Name: DATABASE template1; Type: ACL; Schema: -; Owner: postgres
--

REVOKE CONNECT,TEMPORARY ON DATABASE template1 FROM PUBLIC;
GRANT CONNECT ON DATABASE template1 TO PUBLIC;


--
-- PostgreSQL database dump complete
--

\unrestrict FfxUhBbXiVgKze9fS54CajdudEA0Ucf2SaX9p35NW0FVMpz3qH83xlNQEqsutKU

--
-- Database "TN_INFO_DATABASE" dump
--

--
-- PostgreSQL database dump
--

\restrict RVdXuXjlfoI5siwtuimiCKaTNMqUQSsnGmZhwqOYf9lv4HiIGWasKsqQ0H6FBeJ

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

--
-- Name: TN_INFO_DATABASE; Type: DATABASE; Schema: -; Owner: postgres
--

CREATE DATABASE "TN_INFO_DATABASE" WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'en_US.utf8';


ALTER DATABASE "TN_INFO_DATABASE" OWNER TO postgres;

\unrestrict RVdXuXjlfoI5siwtuimiCKaTNMqUQSsnGmZhwqOYf9lv4HiIGWasKsqQ0H6FBeJ
\connect "TN_INFO_DATABASE"
\restrict RVdXuXjlfoI5siwtuimiCKaTNMqUQSsnGmZhwqOYf9lv4HiIGWasKsqQ0H6FBeJ

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
-- Name: faturas id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.faturas ALTER COLUMN id SET DEFAULT nextval('public.faturas_id_seq'::regclass);


--
-- Name: financeiro id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.financeiro ALTER COLUMN id SET DEFAULT nextval('public.financeiro_id_seq'::regclass);


--
-- Data for Name: faturas; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.faturas (id, usuario_login, descricao, valor, vencimento, status) FROM stdin;
\.


--
-- Data for Name: financeiro; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.financeiro (id, descricao, valor, tipo, usuario_login) FROM stdin;
\.


--
-- Name: faturas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.faturas_id_seq', 1, true);


--
-- Name: financeiro_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.financeiro_id_seq', 1, false);


--
-- Name: faturas faturas_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.faturas
    ADD CONSTRAINT faturas_pkey PRIMARY KEY (id);


--
-- Name: financeiro financeiro_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.financeiro
    ADD CONSTRAINT financeiro_pkey PRIMARY KEY (id);


--
-- PostgreSQL database dump complete
--

\unrestrict RVdXuXjlfoI5siwtuimiCKaTNMqUQSsnGmZhwqOYf9lv4HiIGWasKsqQ0H6FBeJ

--
-- Database "postgres" dump
--

--
-- PostgreSQL database dump
--

\restrict Rrglpca04JtR6ZXw9CCKPivfHFbT5ZaVVpenprLKXJSB6UGUQ5UB6orpUhrzVd8

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

DROP DATABASE postgres;
--
-- Name: postgres; Type: DATABASE; Schema: -; Owner: postgres
--

CREATE DATABASE postgres WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'en_US.utf8';


ALTER DATABASE postgres OWNER TO postgres;

\unrestrict Rrglpca04JtR6ZXw9CCKPivfHFbT5ZaVVpenprLKXJSB6UGUQ5UB6orpUhrzVd8
\connect postgres
\restrict Rrglpca04JtR6ZXw9CCKPivfHFbT5ZaVVpenprLKXJSB6UGUQ5UB6orpUhrzVd8

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

--
-- Name: DATABASE postgres; Type: COMMENT; Schema: -; Owner: postgres
--

COMMENT ON DATABASE postgres IS 'default administrative connection database';


--
-- PostgreSQL database dump complete
--

\unrestrict Rrglpca04JtR6ZXw9CCKPivfHFbT5ZaVVpenprLKXJSB6UGUQ5UB6orpUhrzVd8

--
-- Database "saas_db" dump
--

--
-- PostgreSQL database dump
--

\restrict 9npL8EpPdv4ceyjwq4ESRAbMQZ35G1PsfYTIXMYpS93pbMHoifp6yajFg54DfXl

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

--
-- Name: saas_db; Type: DATABASE; Schema: -; Owner: postgres
--

CREATE DATABASE saas_db WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'en_US.utf8';


ALTER DATABASE saas_db OWNER TO postgres;

\unrestrict 9npL8EpPdv4ceyjwq4ESRAbMQZ35G1PsfYTIXMYpS93pbMHoifp6yajFg54DfXl
\connect saas_db
\restrict 9npL8EpPdv4ceyjwq4ESRAbMQZ35G1PsfYTIXMYpS93pbMHoifp6yajFg54DfXl

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
    usuario text NOT NULL,
    nome_cartao text NOT NULL,
    limite_total real NOT NULL,
    dia_fechamento integer NOT NULL
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
-- Name: compras_cartao; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.compras_cartao (
    id integer NOT NULL,
    cartao_id integer NOT NULL,
    descricao text NOT NULL,
    valor_total real NOT NULL,
    parcelas integer NOT NULL,
    parcelas_pagas integer DEFAULT 0,
    data_compra text NOT NULL
);


ALTER TABLE public.compras_cartao OWNER TO postgres;

--
-- Name: compras_cartao_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.compras_cartao_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.compras_cartao_id_seq OWNER TO postgres;

--
-- Name: compras_cartao_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.compras_cartao_id_seq OWNED BY public.compras_cartao.id;


--
-- Name: config_global; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.config_global (
    chave text NOT NULL,
    valor text
);


ALTER TABLE public.config_global OWNER TO postgres;

--
-- Name: financeiro; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.financeiro (
    id text NOT NULL,
    usuario text,
    tipo text,
    descricao text,
    valor real,
    status text,
    vencimento text,
    categoria text,
    forma_pagamento text,
    comprovativo text
);


ALTER TABLE public.financeiro OWNER TO postgres;

--
-- Name: metas; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.metas (
    usuario text NOT NULL,
    categoria text NOT NULL,
    limite real
);


ALTER TABLE public.metas OWNER TO postgres;

--
-- Name: pacotes_credito; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pacotes_credito (
    id integer NOT NULL,
    nome text,
    quantidade integer,
    valor real
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
-- Name: pedidos_credito; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pedidos_credito (
    id integer NOT NULL,
    revendedor text,
    quantidade integer,
    valor_total real,
    status text,
    data_pedido text
);


ALTER TABLE public.pedidos_credito OWNER TO postgres;

--
-- Name: pedidos_credito_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.pedidos_credito_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.pedidos_credito_id_seq OWNER TO postgres;

--
-- Name: pedidos_credito_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.pedidos_credito_id_seq OWNED BY public.pedidos_credito.id;


--
-- Name: preferencias; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.preferencias (
    usuario text NOT NULL,
    categorias text,
    pagamentos text
);


ALTER TABLE public.preferencias OWNER TO postgres;

--
-- Name: usuarios; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.usuarios (
    usuario text NOT NULL,
    senha text,
    nivel text,
    status text,
    valor real,
    vencimento text,
    nome text,
    email text,
    telefone text,
    creditos integer DEFAULT 0,
    criado_por text DEFAULT 'admin'::text,
    codigo_id text,
    chave_pix text DEFAULT ''::text,
    titular_pix text DEFAULT ''::text,
    whatsapp text DEFAULT ''::text
);


ALTER TABLE public.usuarios OWNER TO postgres;

--
-- Name: cartoes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cartoes ALTER COLUMN id SET DEFAULT nextval('public.cartoes_id_seq'::regclass);


--
-- Name: compras_cartao id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.compras_cartao ALTER COLUMN id SET DEFAULT nextval('public.compras_cartao_id_seq'::regclass);


--
-- Name: pacotes_credito id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pacotes_credito ALTER COLUMN id SET DEFAULT nextval('public.pacotes_credito_id_seq'::regclass);


--
-- Name: pedidos_credito id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pedidos_credito ALTER COLUMN id SET DEFAULT nextval('public.pedidos_credito_id_seq'::regclass);


--
-- Data for Name: cartoes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.cartoes (id, usuario, nome_cartao, limite_total, dia_fechamento) FROM stdin;
\.


--
-- Data for Name: compras_cartao; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.compras_cartao (id, cartao_id, descricao, valor_total, parcelas, parcelas_pagas, data_compra) FROM stdin;
\.


--
-- Data for Name: config_global; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.config_global (chave, valor) FROM stdin;
nome_saas	TN INFO FINANÇAS
chave_pix	24999681057
titular_pix	tobias
preco_credito	10.00
\.


--
-- Data for Name: financeiro; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.financeiro (id, usuario, tipo, descricao, valor, status, vencimento, categoria, forma_pagamento, comprovativo) FROM stdin;
0235080	usuario	Gasto	TN INFO FINANCES	20	Pendente	2026-03-13	Consultoria	Pix	
0235081	usuario	Gasto	TN INFO FINANCES	20	Pendente	2026-04-13	Consultoria	Pix	
0235082	usuario	Gasto	TN INFO FINANCES	20	Pendente	2026-05-13	Consultoria	Pix	
0235083	usuario	Gasto	TN INFO FINANCES	20	Pendente	2026-06-13	Consultoria	Pix	
0235084	usuario	Gasto	TN INFO FINANCES	20	Pendente	2026-07-13	Consultoria	Pix	
0235085	usuario	Gasto	TN INFO FINANCES	20	Pendente	2026-08-13	Consultoria	Pix	
0235086	usuario	Gasto	TN INFO FINANCES	20	Pendente	2026-09-13	Consultoria	Pix	
0235087	usuario	Gasto	TN INFO FINANCES	20	Pendente	2026-10-13	Consultoria	Pix	
0235088	usuario	Gasto	TN INFO FINANCES	20	Pendente	2026-11-13	Consultoria	Pix	
\.


--
-- Data for Name: metas; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.metas (usuario, categoria, limite) FROM stdin;
\.


--
-- Data for Name: pacotes_credito; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pacotes_credito (id, nome, quantidade, valor) FROM stdin;
1	Pacote Iniciante	5	50
2	Pacote Ouro	15	135
3	Pacote Diamante	30	240
\.


--
-- Data for Name: pedidos_credito; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pedidos_credito (id, revendedor, quantidade, valor_total, status, data_pedido) FROM stdin;
1	revenda	10	100	Rejeitado	08/03/2026 18:53
2	revenda	30	240	Rejeitado	08/03/2026 19:27
3	revenda	5	50	Rejeitado	09/03/2026 00:18
4	revenda	5	50	Pendente	10/03/2026 15:53
5	revenda	5	50	Pendente	11/03/2026 05:19
\.


--
-- Data for Name: preferencias; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.preferencias (usuario, categorias, pagamentos) FROM stdin;
\.


--
-- Data for Name: usuarios; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.usuarios (usuario, senha, nivel, status, valor, vencimento, nome, email, telefone, creditos, criado_por, codigo_id, chave_pix, titular_pix, whatsapp) FROM stdin;
admin	c85d864af00614dd04de7af3b82d2a740288159af0ce66ba4e5cb9da854c4b65	Gerente	Ativo	0	31/12/2099	Administrador	admin@saas.com	000000000	0	admin	#GER-10M0			
cliente	5994471abb01112afcc18159f6cc74b4f511b99806da59b3caf5a9c173cacfc5	Cliente	Ativo	0	12/03/2026	cliente			0	admin	#CLI-6W9K			
joao	c85d864af00614dd04de7af3b82d2a740288159af0ce66ba4e5cb9da854c4b65	Cliente	Ativo	0	12/03/2026	teste			0	admin	#CLI-9I8H			
kennyacre	c85d864af00614dd04de7af3b82d2a740288159af0ce66ba4e5cb9da854c4b65	Gerente	Ativo	0	13/03/2026	tobias		24999681057	0	admin	#GER-57OZ			
\.


--
-- Name: cartoes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.cartoes_id_seq', 3, false);


--
-- Name: compras_cartao_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.compras_cartao_id_seq', 4, false);


--
-- Name: pacotes_credito_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.pacotes_credito_id_seq', 4, false);


--
-- Name: pedidos_credito_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.pedidos_credito_id_seq', 6, false);


--
-- Name: cartoes cartoes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cartoes
    ADD CONSTRAINT cartoes_pkey PRIMARY KEY (id);


--
-- Name: compras_cartao compras_cartao_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.compras_cartao
    ADD CONSTRAINT compras_cartao_pkey PRIMARY KEY (id);


--
-- Name: config_global config_global_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.config_global
    ADD CONSTRAINT config_global_pkey PRIMARY KEY (chave);


--
-- Name: financeiro financeiro_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.financeiro
    ADD CONSTRAINT financeiro_pkey PRIMARY KEY (id);


--
-- Name: metas metas_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.metas
    ADD CONSTRAINT metas_pkey PRIMARY KEY (usuario, categoria);


--
-- Name: pacotes_credito pacotes_credito_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pacotes_credito
    ADD CONSTRAINT pacotes_credito_pkey PRIMARY KEY (id);


--
-- Name: pedidos_credito pedidos_credito_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pedidos_credito
    ADD CONSTRAINT pedidos_credito_pkey PRIMARY KEY (id);


--
-- Name: preferencias preferencias_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.preferencias
    ADD CONSTRAINT preferencias_pkey PRIMARY KEY (usuario);


--
-- Name: usuarios usuarios_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_pkey PRIMARY KEY (usuario);


--
-- Name: compras_cartao compras_cartao_cartao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.compras_cartao
    ADD CONSTRAINT compras_cartao_cartao_id_fkey FOREIGN KEY (cartao_id) REFERENCES public.cartoes(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict 9npL8EpPdv4ceyjwq4ESRAbMQZ35G1PsfYTIXMYpS93pbMHoifp6yajFg54DfXl

--
-- PostgreSQL database cluster dump complete
--

