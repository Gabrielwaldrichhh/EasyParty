import { useEffect, useRef, useState } from "react";
import { socialProofService, type SocialProof } from "../services/socialProofService";
import type { Event } from "../types";

/**
 * Busca os social proofs de todos os eventos em UMA ÚNICA request batch
 * e mantém atualizados com polling a cada 60s.
 *
 * Retorna Map<eventId, SocialProof>.
 */
export function useHype(events: Event[]) {
  const [proofs, setProofs] = useState<Map<string, SocialProof>>(new Map());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const idsKey = events.map(e => e.id).sort().join(',');
  const idsKeyRef = useRef('');

  useEffect(() => {
    if (!idsKey) return;
    // Não refetch se a lista não mudou e já temos dados
    if (idsKey === idsKeyRef.current && proofs.size > 0) return;
    idsKeyRef.current = idsKey;

    const ids = events.map(e => e.id);

    async function fetchBatch() {
      try {
        const map = await socialProofService.getBatch(ids);
        setProofs(prev => {
          // Merge: mantém entradas de eventos que não estão nesse batch
          const next = new Map(prev);
          for (const [id, p] of map) next.set(id, p);
          return next;
        });
      } catch { /* silencia — hype degrada graciosamente sem dados */ }
    }

    fetchBatch();

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(fetchBatch, 60_000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey]);

  return proofs;
}
