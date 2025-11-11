# Blog Backend API

## Descrição Curta

Backend em Node.js/TypeScript para gerenciamento de posts de um blog. Expõe uma API REST para leitura pública dos artigos e um painel administrativo protegido por JWT para criação, edição, publicação e remoção de posts com upload de imagens de capa. Utiliza Prisma com PostgreSQL para persistência, validações com Zod e autenticação baseada em tokens.

## Tecnologias Utilizadas

- **Node.js + TypeScript** - runtime principal e tipagem estática.
- **Express 5, cors, body-parser** - criação da API HTTP, middlewares e CORS.
- **Prisma ORM + PostgreSQL** - modelagem relacional (User/Post), migrations e seed.
- **tsx** - execução/observação do código TypeScript sem build manual.
- **Zod** - validação declarativa dos payloads de autenticação e posts.
- **bcryptjs** - hash e verificação de senhas de usuários.
- **jsonwebtoken** - geração e leitura de tokens JWT (`createJWT`, `privateRoute`).
- **Multer + uuid** - upload de imagens para `tmp/` e renomeação segura de capas.
- **slug** - geração de slugs únicos para URLs de posts.

## Como Funciona

O servidor (`src/server.ts`) inicia o Express, serve arquivos estáticos de `public/`, aplica CORS/body-parser e registra três grupos de rotas:

- `src/routes/main.ts` expõe endpoints públicos (`/api/posts`, `/api/posts/:slug`, `/api/posts/:slug/related`, `/api/ping`).
- `src/routes/auth.ts` lida com `/api/auth/signup|signin|validate`, usando `zod` e `createToken`.
- `src/routes/admin.ts` agrupa CRUD de posts. Todas as rotas passam por `privateRoute`, que lê o JWT do header Authorization, usa `verifyRequeste`/`readJWT` e carrega o usuário (sem senha) no request.

Os controllers orquestram serviços e utilidades:

- `services/post.ts` abstrai Prisma (`prisma.post.*`) para listar posts paginados, buscar por slug, gerar slugs, subir/remover capas (move o arquivo de `tmp/` para `public/images/covers` via `fs.promises.rename`) e publicar/excluir registros.
- `services/user.ts` cria usuários (garantindo e-mails únicos), valida credenciais com bcrypt e expõe `getUserById`, utilizado após cada operação para trazer o autor.
- `services/auth.ts` centraliza a criação/validação de tokens. `privateRoute` injeta `req.user` (tipado em `types/extended-request.ts`) para ser consumido nos controllers administrativos.
- `utils/cover-to-url.ts` formata o caminho público da capa usando `BASE_URL`.

O esquema Prisma (`prisma/schema.prisma`) contém os modelos `User` e `Post` com enum `PostStatus`. Há um seed (`prisma/seed.ts`) que cria/atualiza um usuário administrativo usando variáveis `SEED_USER_*`.

## Rodando o Projeto Localmente

### Pré-requisitos

- Node.js 20 LTS (ou superior) e npm 10+.
- PostgreSQL 14+ com um banco criado (ex.: `blog`).
- Git e um terminal com suporte a comandos do Node.

### Instalação

```bash
git clone https://github.com/<pierrepaulo>/blog.git
cd blog-backend
npm install
```

### Configuração das variáveis de ambiente

1. Duplique o arquivo de exemplo:
   ```bash
   cp .env.example .env
   ```
   > No Windows, use `copy .env.example .env`.
2. Ajuste os valores conforme o seu ambiente. Exemplo:
   ```env
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/blog?schema=public"
   JWT_KEY="uma_chave_bem_segura"
   BASE_URL="http://localhost:4444"
   # Opcional: sobrescreva SEED_USER_EMAIL/NAME/PASSWORD antes de rodar o seed
   ```
3. Garante que as pastas `public/images/covers` e `tmp` existam para receber uploads.

### Banco de dados e seed

```bash
npx prisma migrate dev --name init     # aplica/gera migrations no PostgreSQL
npx prisma db seed                     # cria/atualiza o usuário administrador padrão
```

Use `npx prisma studio` se quiser inspecionar os dados via interface web.

### Execução

```bash
npm run dev
```

O servidor ficará acessível em `http://localhost:4444`. Alguns endpoints úteis para validar a instância:

- `GET /api/ping` - health check.
- `POST /api/auth/signup` e `POST /api/auth/signin` - cria usuário e retorna `{ user, token }`.
- `POST /api/auth/validate` - confirma o token (header `Authorization: Bearer <token>`).
- `GET /api/admin/posts` - requer token válido e lista posts paginados.
- `POST /api/admin/posts` - cria post com multipart form (`cover` + campos `title/tags/body`).

Os uploads são salvos primeiro em `tmp/` (Multer) e, após validação do `mimetype`, movidos para `public/images/covers`. A API pública (`/api/posts` e `/api/posts/:slug`) sempre retorna URLs completas de capa via `coverToUrl`, permitindo consumo em aplicações front-end.

---

Com esses passos o ambiente local estará pronto para desenvolver novas features, ajustar o schema Prisma ou integrar o backend a um frontend/cliente HTTP.
