-- CreateTable EventView
CREATE TABLE IF NOT EXISTS "event_views" (
    "id"          TEXT NOT NULL,
    "eventId"     TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_views_pkey" PRIMARY KEY ("id")
);

-- CreateTable Checkin
CREATE TABLE IF NOT EXISTS "checkins" (
    "id"                TEXT NOT NULL,
    "eventId"           TEXT NOT NULL,
    "fingerprint"       TEXT NOT NULL,
    "locationValidated" BOOLEAN NOT NULL DEFAULT false,
    "weight"            INTEGER NOT NULL DEFAULT 1,
    "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "checkins_pkey" PRIMARY KEY ("id")
);

-- Unique constraint: 1 check-in por fingerprint por evento
ALTER TABLE "checkins" ADD CONSTRAINT "checkins_eventId_fingerprint_key" UNIQUE ("eventId", "fingerprint");

-- Indexes para performance nas queries de contagem por janela de tempo
CREATE INDEX IF NOT EXISTS "event_views_eventId_createdAt_idx" ON "event_views"("eventId", "createdAt");
CREATE INDEX IF NOT EXISTS "checkins_eventId_createdAt_idx" ON "checkins"("eventId", "createdAt");

-- Foreign Keys
ALTER TABLE "event_views" ADD CONSTRAINT "event_views_eventId_fkey"
    FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "checkins" ADD CONSTRAINT "checkins_eventId_fkey"
    FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
