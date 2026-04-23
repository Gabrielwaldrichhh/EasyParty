ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "stripeCustomerId"  TEXT,
  ADD COLUMN IF NOT EXISTS "stripePlan"        TEXT    NOT NULL DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS "stripeSubId"       TEXT,
  ADD COLUMN IF NOT EXISTS "planExpiresAt"     TIMESTAMP(3);

CREATE TABLE IF NOT EXISTS "boosted_events" (
  "id"              TEXT         NOT NULL,
  "eventId"         TEXT         NOT NULL,
  "userId"          TEXT         NOT NULL,
  "stripeSessionId" TEXT         NOT NULL,
  "paidAt"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt"       TIMESTAMP(3) NOT NULL,
  CONSTRAINT "boosted_events_pkey" PRIMARY KEY ("id")
);
