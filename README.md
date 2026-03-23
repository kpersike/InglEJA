# InglEJA
# 📝 InglEJA - Plataforma de Ensino de Inglês

O **InglEJA** é uma aplicação Full Stack desenvolvida para auxiliar no ensino de inglês, com foco em estudantes do EJA. O projeto utiliza uma arquitetura moderna separando o Frontend (React + Vite) do Backend (Node.js).

## 🛠️ Tecnologias Utilizadas

Este projeto foi construído com as seguintes ferramentas:

* **Frontend:** [React.js](https://reactjs.org/) com [Vite](https://vitejs.dev/) (para maior performance no desenvolvimento).
* **Backend:** [Node.js](https://nodejs.org/) com JavaScript.
* **Banco de Dados:** [PostgreSQL](https://www.postgresql.org/) (Configurado via Docker).
* **Containerização:** [Docker](https://www.docker.com/) & Docker Compose.
* **Padronização:** [ESLint](https://eslint.org/) para qualidade de código.
---
## 📂 Estrutura de Pastas

* `frontend/`: Código fonte da interface (Vite + React).
    * `src/componentes`: Elementos reutilizáveis (Exercícios, etc).
    * `src/páginas`: Telas principais da aplicação.
* `dados/`: Mock de dados em arquivos `.json` (lessons, users) para testes rápidos.
* `server.js`: Servidor principal da API.
* `database.schema.sql`: Script de criação das tabelas do banco de dados.
* `docker-compose.yml`: Orquestração do banco de dados PostgreSQL.
---
## 🚀 Como Rodar o Projeto Localmente

### Pré-requisitos
* Node.js instalado.
* Docker e Docker Compose instalados.

### 1. Clonar o Repositório
```bash
git clone [https://github.com/kpersike/InglEJA.git](https://github.com/kpersike/InglEJA.git)
cd InglEJA
2. Configurar o Banco de Dados
Suba o container do banco de dados em segundo plano:

Bash
docker-compose up -d
3. Rodar o Backend
Na raiz do projeto:

Bash
npm install
node server.js
4. Rodar o Frontend (Vite)
Abra um novo terminal, entre na pasta frontend e inicie o servidor de desenvolvimento:

Bash
cd frontend
npm install
npm run dev
O projeto estará disponível em http://localhost:5173 (ou na porta indicada pelo Vite).

📈 Status de Desenvolvimento
[x] Migração do Frontend para React/Vite.

[x] Organização da estrutura de pastas /src.

[x] Configuração do ambiente Docker para o banco.

[ ] Integração total das rotas do Backend com o banco SQL.

[ ] Implementação do sistema de login de usuários.
