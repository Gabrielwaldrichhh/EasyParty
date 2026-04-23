import { useEffect, useRef, useState } from "react";
import { Users, TrendingUp, Eye } from "lucide-react";
import { socialProofService, type SocialProof } from "../services/socialProofService";

interface Props {
  eventId: string;
  /** Se true, registra uma view (painel de detalhe). Se false, só lê. */
  registerView?: boolean;
}

/**
 * Barra de prova social em tempo real.
 * - Registra view ao montar (quando `registerView=true`)
 * - Faz polling a cada 30s para atualizar os números
 * - Animação de contagem ao receber novos valores
 */
export function SocialProofBar({ eventId, registerView = true }: Props) {
  const [proof, setProof] = useState<SocialProof | null>(null);
  const [bump, setBump] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchFirst() {
      try {
        const data = registerView
          ? await socialProofService.recordView(eventId)
          : await socialProofService.getProof(eventId);
        if (!cancelled) setProof(data);
      } catch {
        // silencia — prova social não é crítica
      }
    }

    async function fetchPoll() {
      try {
        const data = await socialProofService.getProof(eventId);
        if (!cancelled) {
          setProof(prev => {
            if (prev && data.pessoasAgora !== prev.pessoasAgora) {
              setBump(true);
              setTimeout(() => setBump(false), 600);
            }
            return data;
          });
        }
      } catch { /* silencia */ }
    }

    fetchFirst();
    timerRef.current = setInterval(fetchPoll, 30_000);

    return () => {
      cancelled = true;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [eventId, registerView]);

  if (!proof) return null;

  const isActive = proof.isLive || proof.isUpcoming;

  return (
    <div className="flex items-center gap-3 px-4 py-1.5 border-b border-border/30 flex-wrap">
      {/* Pessoas agora */}
      <div className="flex items-center gap-1">
        <div className="relative">
          <Users className="w-3 h-3 text-muted-foreground" />
          {isActive && (
            <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          )}
        </div>
        <span
          className={`text-[11px] font-medium text-muted-foreground ${bump ? 'text-emerald-500' : ''}`}
          style={{ transition: 'color 0.2s' }}
        >
          {proof.textoAgora}
        </span>
      </div>

      {/* Chegaram na última hora */}
      {proof.textoChegaram && (
        <>
          <span className="text-border/60 text-[10px]">·</span>
          <div className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-emerald-500" />
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
              {proof.textoChegaram}
            </span>
          </div>
        </>
      )}

      {/* Visualizações */}
      <span className="text-border/60 text-[10px]">·</span>
      <div className="flex items-center gap-1">
        <Eye className="w-3 h-3 text-muted-foreground" />
        <span className="text-[11px] text-muted-foreground">
          {proof.visualizacoes.toLocaleString('pt-BR')} views
        </span>
      </div>
    </div>
  );
}
