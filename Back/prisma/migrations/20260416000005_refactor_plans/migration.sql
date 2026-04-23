-- Simplifica stripePlan para os 2 planos reais: 'free' e 'pro'
-- (coluna já existe como TEXT default 'free', sem necessidade de ALTER TYPE)

-- Adiciona coluna boostCredits: quantos boosts o usuário Pro ainda pode usar este ciclo
ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "boostCredits" INTEGER NOT NULL DEFAULT 0;

-- Adiciona tipo de origem ao boosted_events: 'avulso' ou 'pro'
ALTER TABLE "boosted_events"
  ADD COLUMN IF NOT EXISTS "boostType" TEXT NOT NULL DEFAULT 'avulso';
