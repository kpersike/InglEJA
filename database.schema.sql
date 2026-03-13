--
-- PostgreSQL database dump
--

\restrict TjdCi35WfufWDGAnucKRHo7S98ihm5RoSlKKJH6bSeEuL3xsAwmIwij3iYYlZ6o

-- Dumped from database version 17.9
-- Dumped by pg_dump version 17.9

-- Started on 2026-03-13 01:24:21

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 2 (class 3079 OID 16751)
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- TOC entry 4866 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 228 (class 1259 OID 16804)
-- Name: exercicios; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.exercicios (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    frase_id uuid,
    tipo_exercicio character varying(50),
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.exercicios OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 16735)
-- Name: frase_palavras; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.frase_palavras (
    id integer NOT NULL,
    frase_id uuid,
    palavra_id integer
);


ALTER TABLE public.frase_palavras OWNER TO postgres;

--
-- TOC entry 224 (class 1259 OID 16734)
-- Name: frase_palavras_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.frase_palavras_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.frase_palavras_id_seq OWNER TO postgres;

--
-- TOC entry 4869 (class 0 OID 0)
-- Dependencies: 224
-- Name: frase_palavras_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.frase_palavras_id_seq OWNED BY public.frase_palavras.id;


--
-- TOC entry 227 (class 1259 OID 16774)
-- Name: frases; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.frases (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    frase_ingles text NOT NULL,
    traducao_portugues text,
    nivel character varying(20),
    audio_url text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp without time zone
);


ALTER TABLE public.frases OWNER TO postgres;

--
-- TOC entry 219 (class 1259 OID 16668)
-- Name: palavras; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.palavras (
    id integer NOT NULL,
    palavra_ingles character varying(100) NOT NULL,
    traducao_portugues character varying(100) NOT NULL,
    exemplo text,
    audio_url text
);


ALTER TABLE public.palavras OWNER TO postgres;

--
-- TOC entry 218 (class 1259 OID 16667)
-- Name: palavras_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.palavras_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.palavras_id_seq OWNER TO postgres;

--
-- TOC entry 4872 (class 0 OID 0)
-- Dependencies: 218
-- Name: palavras_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.palavras_id_seq OWNED BY public.palavras.id;


--
-- TOC entry 223 (class 1259 OID 16718)
-- Name: pontuacao; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pontuacao (
    id integer NOT NULL,
    usuario_id integer,
    pontos integer DEFAULT 0,
    nivel_usuario character varying(50)
);


ALTER TABLE public.pontuacao OWNER TO postgres;

--
-- TOC entry 222 (class 1259 OID 16717)
-- Name: pontuacao_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.pontuacao_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pontuacao_id_seq OWNER TO postgres;

--
-- TOC entry 4874 (class 0 OID 0)
-- Dependencies: 222
-- Name: pontuacao_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.pontuacao_id_seq OWNED BY public.pontuacao.id;


--
-- TOC entry 221 (class 1259 OID 16700)
-- Name: progresso_usuario; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.progresso_usuario (
    id integer NOT NULL,
    acertou boolean,
    data_resposta timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    exercicio_id uuid,
    usuario_id uuid
);


ALTER TABLE public.progresso_usuario OWNER TO postgres;

--
-- TOC entry 220 (class 1259 OID 16699)
-- Name: progresso_usuario_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.progresso_usuario_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.progresso_usuario_id_seq OWNER TO postgres;

--
-- TOC entry 4876 (class 0 OID 0)
-- Dependencies: 220
-- Name: progresso_usuario_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.progresso_usuario_id_seq OWNED BY public.progresso_usuario.id;


--
-- TOC entry 226 (class 1259 OID 16762)
-- Name: usuarios; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.usuarios (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    nome character varying(100) NOT NULL,
    email character varying(150) NOT NULL,
    senha_hash text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.usuarios OWNER TO postgres;

--
-- TOC entry 4685 (class 2604 OID 16738)
-- Name: frase_palavras id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.frase_palavras ALTER COLUMN id SET DEFAULT nextval('public.frase_palavras_id_seq'::regclass);


--
-- TOC entry 4680 (class 2604 OID 16671)
-- Name: palavras id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.palavras ALTER COLUMN id SET DEFAULT nextval('public.palavras_id_seq'::regclass);


--
-- TOC entry 4683 (class 2604 OID 16721)
-- Name: pontuacao id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pontuacao ALTER COLUMN id SET DEFAULT nextval('public.pontuacao_id_seq'::regclass);


--
-- TOC entry 4681 (class 2604 OID 16703)
-- Name: progresso_usuario id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.progresso_usuario ALTER COLUMN id SET DEFAULT nextval('public.progresso_usuario_id_seq'::regclass);


--
-- TOC entry 4709 (class 2606 OID 16810)
-- Name: exercicios exercicios_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exercicios
    ADD CONSTRAINT exercicios_pkey PRIMARY KEY (id);


--
-- TOC entry 4701 (class 2606 OID 16740)
-- Name: frase_palavras frase_palavras_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.frase_palavras
    ADD CONSTRAINT frase_palavras_pkey PRIMARY KEY (id);


--
-- TOC entry 4707 (class 2606 OID 16783)
-- Name: frases frases_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.frases
    ADD CONSTRAINT frases_pkey PRIMARY KEY (id);


--
-- TOC entry 4695 (class 2606 OID 16675)
-- Name: palavras palavras_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.palavras
    ADD CONSTRAINT palavras_pkey PRIMARY KEY (id);


--
-- TOC entry 4699 (class 2606 OID 16724)
-- Name: pontuacao pontuacao_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pontuacao
    ADD CONSTRAINT pontuacao_pkey PRIMARY KEY (id);


--
-- TOC entry 4697 (class 2606 OID 16706)
-- Name: progresso_usuario progresso_usuario_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.progresso_usuario
    ADD CONSTRAINT progresso_usuario_pkey PRIMARY KEY (id);


--
-- TOC entry 4703 (class 2606 OID 16773)
-- Name: usuarios usuarios_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key UNIQUE (email);


--
-- TOC entry 4705 (class 2606 OID 16771)
-- Name: usuarios usuarios_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id);


--
-- TOC entry 4714 (class 2606 OID 16811)
-- Name: exercicios fk_exercicios_frase; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exercicios
    ADD CONSTRAINT fk_exercicios_frase FOREIGN KEY (frase_id) REFERENCES public.frases(id);


--
-- TOC entry 4712 (class 2606 OID 16842)
-- Name: frase_palavras fk_frase_palavra_frase; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.frase_palavras
    ADD CONSTRAINT fk_frase_palavra_frase FOREIGN KEY (frase_id) REFERENCES public.frases(id);


--
-- TOC entry 4713 (class 2606 OID 16847)
-- Name: frase_palavras fk_frase_palavra_palavra; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.frase_palavras
    ADD CONSTRAINT fk_frase_palavra_palavra FOREIGN KEY (palavra_id) REFERENCES public.palavras(id);


--
-- TOC entry 4710 (class 2606 OID 16816)
-- Name: progresso_usuario fk_progresso_exercicio; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.progresso_usuario
    ADD CONSTRAINT fk_progresso_exercicio FOREIGN KEY (exercicio_id) REFERENCES public.exercicios(id);


--
-- TOC entry 4711 (class 2606 OID 16822)
-- Name: progresso_usuario fk_progresso_usuario; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.progresso_usuario
    ADD CONSTRAINT fk_progresso_usuario FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id);


--
-- TOC entry 4865 (class 0 OID 0)
-- Dependencies: 6
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: pg_database_owner
--

GRANT USAGE ON SCHEMA public TO kaik_dev;
GRANT USAGE ON SCHEMA public TO app_team;


--
-- TOC entry 4867 (class 0 OID 0)
-- Dependencies: 228
-- Name: TABLE exercicios; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.exercicios TO kaik_dev;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.exercicios TO app_team;


--
-- TOC entry 4868 (class 0 OID 0)
-- Dependencies: 225
-- Name: TABLE frase_palavras; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.frase_palavras TO kaik_dev;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.frase_palavras TO app_team;


--
-- TOC entry 4870 (class 0 OID 0)
-- Dependencies: 227
-- Name: TABLE frases; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.frases TO kaik_dev;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.frases TO app_team;


--
-- TOC entry 4871 (class 0 OID 0)
-- Dependencies: 219
-- Name: TABLE palavras; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.palavras TO kaik_dev;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.palavras TO app_team;


--
-- TOC entry 4873 (class 0 OID 0)
-- Dependencies: 223
-- Name: TABLE pontuacao; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.pontuacao TO kaik_dev;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.pontuacao TO app_team;


--
-- TOC entry 4875 (class 0 OID 0)
-- Dependencies: 221
-- Name: TABLE progresso_usuario; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.progresso_usuario TO kaik_dev;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.progresso_usuario TO app_team;


--
-- TOC entry 4877 (class 0 OID 0)
-- Dependencies: 226
-- Name: TABLE usuarios; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.usuarios TO kaik_dev;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.usuarios TO app_team;


--
-- TOC entry 2082 (class 826 OID 16649)
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT SELECT,INSERT,DELETE,UPDATE ON TABLES TO kaik_dev;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT SELECT,INSERT,DELETE,UPDATE ON TABLES TO app_team;


-- Completed on 2026-03-13 01:24:22

--
-- PostgreSQL database dump complete
--

\unrestrict TjdCi35WfufWDGAnucKRHo7S98ihm5RoSlKKJH6bSeEuL3xsAwmIwij3iYYlZ6o

