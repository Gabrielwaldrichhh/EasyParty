# EasyParty — Guia de Deploy (Vercel + Railway)

## Visão Geral

```
Vercel  →  Frontend (React/Vite)
Railway →  Backend (Node/Express) + PostgreSQL
```

---

## 1. Railway — Backend + Banco de Dados

### 1.1 Criar projeto no Railway

1. Acesse [railway.app](https://railway.app) → New Project
2. **Add PostgreSQL** → Railway provisiona o banco automaticamente
3. **Deploy from GitHub** → selecione o repositório, pasta `EasyParty/Back`

### 1.2 Variáveis de Ambiente (Settings → Variables)

| Variável | Valor | Obrigatório |
|----------|-------|-------------|
| `DATABASE_URL` | Gerada automaticamente pelo Railway PostgreSQL | ✅ |
| `JWT_SECRET` | String aleatória 64 chars: `openssl rand -hex 64` | ✅ |
| `NODE_ENV` | `production` | ✅ |
| `FRONTEND_URL` | URL do Vercel, ex: `https://easyparty.vercel.app` | ✅ |
| `PORT` | `3000` (Railway detecta automaticamente via Dockerfile) | opcional |
| `CLOUDINARY_CLOUD_NAME` | Seu cloud name no Cloudinary | ✅ |
| `CLOUDINARY_API_KEY` | API key do Cloudinary | ✅ |
| `CLOUDINARY_API_SECRET` | API secret do Cloudinary | ✅ |
| `STRIPE_SECRET_KEY` | `sk_live_...` (produção) ou `sk_test_...` (teste) | ✅ |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` — ver seção 1.3 abaixo | ✅ |
| `STRIPE_PRICE_BOOST_AVULSO` | ID do Price no Stripe para boost R$9,99 | ✅ |
| `STRIPE_PRICE_PRO` | ID do Price no Stripe para Pro R$29,99/mês | ✅ |
| `RESEND_API_KEY` | API key do [resend.com](https://resend.com) — e-mails de recuperação de senha. Gratuito até 3k e-mails/mês | recomendado |

### 1.3 Configurar Webhook do Stripe

1. Acesse [dashboard.stripe.com/webhooks](https://dashboard.stripe.com/webhooks)
2. Clique em **Add endpoint**
3. URL: `https://SEU-PROJETO.railway.app/billing/webhook`
4. Eventos para escutar:
   - `checkout.session.completed`
   - `customer.subscription.deleted`
   - `customer.subscription.updated`
5. Copie o **Signing secret** (`whsec_...`) → cole em `STRIPE_WEBHOOK_SECRET` no Railway

### 1.4 Rodar Migrations

Após o primeiro deploy, abrir o terminal do Railway (ou via CLI):

```bash
npx prisma migrate deploy
```

> O Railway executa o Dockerfile que já roda `npx prisma generate`.
> As migrations devem ser rodadas manualmente na primeira vez.

### 1.5 URL do Backend

Após deploy, copie a URL gerada (ex: `https://easyparty-production.up.railway.app`).
Você vai precisar dela para configurar o Vercel.

---

## 2. Vercel — Frontend

### 2.1 Criar projeto no Vercel

1. Acesse [vercel.com](https://vercel.com) → New Project
2. Importe o repositório GitHub
3. **Root Directory**: `EasyParty/Front`
4. **Framework Preset**: Vite
5. **Build Command**: `npm run build`
6. **Output Directory**: `dist`

### 2.2 Variáveis de Ambiente (Settings → Environment Variables)

| Variável | Valor |
|----------|-------|
| `VITE_API_URL` | URL do Railway, ex: `https://easyparty-production.up.railway.app` |

> Também adicione ao arquivo `Front/.env.production` localmente para builds locais de produção.

### 2.3 Configurar redirecionamento SPA

Crie o arquivo `Front/public/vercel.json`:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

---

## 3. Cloudinary — Upload de Imagens

1. Crie conta em [cloudinary.com](https://cloudinary.com) (plano gratuito: 25 créditos/mês)
2. Acesse Settings → API Keys
3. Copie `Cloud Name`, `API Key`, `API Secret`
4. Cole nas variáveis do Railway

---

## 4. Checklist Pré-Lançamento

- [ ] `DATABASE_URL` configurada no Railway
- [ ] `JWT_SECRET` com 64 chars aleatórios
- [ ] `FRONTEND_URL` aponta para o Vercel
- [ ] `VITE_API_URL` no Vercel aponta para o Railway
- [ ] Webhook Stripe configurado com URL de produção
- [ ] `STRIPE_WEBHOOK_SECRET` copiado do painel Stripe
- [ ] `npx prisma migrate deploy` executado no Railway
- [ ] Health check respondendo: `GET /health` → `{ "status": "ok" }`
- [ ] Testar login/registro
- [ ] Testar criação de evento
- [ ] Testar upload de imagem
- [ ] Testar pagamento (modo teste Stripe)

---

## 5. Comandos Úteis

```bash
# Gerar JWT_SECRET seguro
openssl rand -hex 64

# Rodar migrations em produção
npx prisma migrate deploy

# Ver logs no Railway
railway logs

# Conectar ao banco de produção
railway connect PostgreSQL
```

---

## 6. Custos Mensais Estimados (MVP)

| Serviço | Plano | Custo |
|---------|-------|-------|
| Vercel | Hobby | Gratuito |
| Railway | Starter | ~$5/mês (primeiro mês grátis) |
| Cloudinary | Free | Gratuito (25 créditos/mês) |
| Stripe | — | 3,89% + R$0,39 por transação |
| **Total** | | **~$5/mês** |
