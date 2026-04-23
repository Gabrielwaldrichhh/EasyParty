-- Recriar enum com novos valores (PostgreSQL não permite ALTER ENUM remover valores)
ALTER TYPE "Category" RENAME TO "Category_old";

CREATE TYPE "Category" AS ENUM (
  'PARTY',
  'SHOW',
  'SPORTS',
  'FESTIVAL',
  'THEATER',
  'WORKSHOP',
  'GASTRONOMY',
  'NETWORKING',
  'RELIGIOUS',
  'OTHER'
);

-- Migrar coluna: valores antigos → novos (usando cast via text)
ALTER TABLE "events"
  ALTER COLUMN "category" DROP DEFAULT,
  ALTER COLUMN "category" TYPE "Category"
    USING CASE "category"::text
      WHEN 'PARTY'      THEN 'PARTY'::"Category"
      WHEN 'EVENT'      THEN 'OTHER'::"Category"
      WHEN 'RESTAURANT' THEN 'GASTRONOMY'::"Category"
      WHEN 'GATHERING'  THEN 'NETWORKING'::"Category"
      ELSE 'OTHER'::"Category"
    END,
  ALTER COLUMN "category" SET DEFAULT 'PARTY';

DROP TYPE "Category_old";

-- Adicionar coluna customCategory
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "customCategory" TEXT;
