import type { Event } from "../types";

/**
 * Calcula o score de "hype" de um evento.
 *
 * Escala: 0–100 (pode ultrapassar levemente com boost pago).
 * Não é exibido como número — é usado apenas para ordenação e para
 * classificar o evento num nível de label ("Em alta", "Bombando", etc.).
 *
 * Fatores (peso total = 100 pontos base):
 *   30 pts — timing: ao vivo > começa em breve > futuro próximo > futuro distante
 *   25 pts — pessoas estimadas agora (normalizado por faixa)
 *   20 pts — visualizações recentes (últimas 2h, via socialProof)
 *   15 pts — crescimento: chegadas recentes (textoChegaram)
 *   10 pts — gratuito (remove barreira de entrada)
 *   +15 pts — bônus de boost pago (compite, mas não domina)
 */

export interface HypeInput {
  event: Event;
  /** Retorno de socialProofService.getProof() — pode ser null se ainda não carregou */
  proof?: {
    pessoasAgora: number;
    visualizacoes: number;
    textoChegaram: string | null;
    isLive: boolean;
    isUpcoming: boolean;
  } | null;
  isBoosted?: boolean;
  now?: Date;
}

export type HypeLevel =
  | 'bombando'   // >= 70 — "Bombando agora 🔥"
  | 'alta'       // >= 45 — "Em alta"
  | 'aquecendo'  // >= 25 — "Aquecendo"
  | 'normal';    // < 25  — sem label

export interface HypeResult {
  score: number;
  level: HypeLevel;
  label: string | null;
  /** Cor para o indicador visual */
  color: string;
}

export function calcHype({ event, proof, isBoosted = false, now = new Date() }: HypeInput): HypeResult {
  let score = 0;

  // ── 1. Timing (0–30 pts) ──────────────────────────────────────────────────
  const start = new Date(event.date).getTime();
  const end   = event.endDate
    ? new Date(event.endDate).getTime()
    : start + 3 * 60 * 60 * 1000;
  const t = now.getTime();

  const isLive     = t >= start && t < end;
  const minsToStart = (start - t) / 60_000;
  const isPast     = t >= end;

  if (isPast) {
    score += 0;
  } else if (isLive) {
    // Ao vivo: começa em 30, decai progressivamente até 10 nos últimos 10% do evento
    const progress = (t - start) / (end - start); // 0→1
    score += Math.max(10, 30 - progress * 20);
  } else if (minsToStart <= 30) {
    score += 28;   // vai começar em minutos — alta expectativa
  } else if (minsToStart <= 120) {
    score += 20;
  } else if (minsToStart <= 360) {
    score += 10;
  } else {
    score += 3;
  }

  // ── 2. Pessoas estimadas (0–25 pts) ───────────────────────────────────────
  if (proof) {
    const p = proof.pessoasAgora;
    if (p >= 100)     score += 25;
    else if (p >= 50) score += 20;
    else if (p >= 20) score += 14;
    else if (p >= 10) score += 8;
    else              score += 3;
  } else if (isLive || minsToStart <= 60) {
    // Ainda sem proof — usa estimativa mínima para não penalizar demais
    score += 5;
  }

  // ── 3. Visualizações recentes (0–20 pts) ──────────────────────────────────
  if (proof) {
    const v = proof.visualizacoes;
    if (v >= 200)     score += 20;
    else if (v >= 100) score += 15;
    else if (v >= 50)  score += 10;
    else if (v >= 20)  score += 6;
    else               score += 2;
  }

  // ── 4. Crescimento recente / chegadas (0–15 pts) ──────────────────────────
  if (proof?.textoChegaram) {
    // extrai o número de "+12 chegaram..."
    const match = proof.textoChegaram.match(/\+(\d+)/);
    const n = match ? parseInt(match[1]) : 0;
    if (n >= 20)     score += 15;
    else if (n >= 10) score += 11;
    else if (n >= 5)  score += 7;
    else              score += 3;
  }

  // ── 5. Gratuito remove barreira (0–10 pts) ────────────────────────────────
  if (event.price === 0) score += 10;

  // ── 6. Boost pago (+15 pts bônus, compite com orgânicos) ──────────────────
  if (isBoosted) score += 15;

  score = Math.round(Math.min(score, 115)); // cap leve acima de 100 só p/ boostados

  // ── Nível e label ─────────────────────────────────────────────────────────
  let level: HypeLevel;
  let label: string | null;
  let color: string;

  if (score >= 70) {
    level = 'bombando'; label = '🔥 Bombando agora'; color = '#ef4444';
  } else if (score >= 45) {
    level = 'alta';     label = '📈 Em alta';        color = '#f97316';
  } else if (score >= 25) {
    level = 'aquecendo'; label = '✨ Aquecendo';     color = '#eab308';
  } else {
    level = 'normal'; label = null; color = 'var(--muted-foreground)';
  }

  return { score, level, label, color };
}

/**
 * Ordena eventos por hype score descendente.
 * Recebe um Map de proofs indexado por eventId.
 */
export function sortByHype(
  events: Event[],
  proofs: Map<string, HypeInput['proof']>,
  boostedIds: Set<string> = new Set(),
  now: Date = new Date(),
): Event[] {
  return [...events].sort((a, b) => {
    const sa = calcHype({ event: a, proof: proofs.get(a.id), isBoosted: boostedIds.has(a.id), now }).score;
    const sb = calcHype({ event: b, proof: proofs.get(b.id), isBoosted: boostedIds.has(b.id), now }).score;
    return sb - sa;
  });
}
