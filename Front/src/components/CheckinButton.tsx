import { useState } from "react";
import { MapPin, Check, Loader2, Users } from "lucide-react";
import { socialProofService, type SocialProof } from "../services/socialProofService";

interface Props {
  eventId: string;
  /** Atualiza o SocialProofBar/analytics após check-in bem-sucedido */
  onCheckin?: (proof: SocialProof) => void;
}

type State = 'idle' | 'loading' | 'done' | 'already' | 'error';

export function CheckinButton({ eventId, onCheckin }: Props) {
  const [state, setState]           = useState<State>('idle');
  const [validated, setValidated]   = useState(false);
  const [checkinCount, setCount]    = useState<number | null>(null);

  async function handleClick() {
    if (state !== 'idle') return;
    setState('loading');
    try {
      const result = await socialProofService.checkin(eventId);

      if (result.alreadyCheckedIn) {
        setState('already');
        return;
      }

      setValidated(result.locationValidated);
      setCount(result.checkinCount);
      setState('done');
      onCheckin?.(result.proof);
    } catch {
      setState('error');
      setTimeout(() => setState('idle'), 3000);
    }
  }

  // ── Estados visuais ──────────────────────────────────────────────────────

  if (state === 'done') {
    return (
      <div className="flex items-center gap-3 rounded-2xl px-4 py-3 border"
        style={{ background: '#10b98110', borderColor: '#10b98130' }}>
        <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center flex-shrink-0">
          <Check className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
            Check-in confirmado!
          </p>
          <p className="text-[11px] text-muted-foreground">
            {validated
              ? '📍 Localização verificada · você conta como presença real'
              : 'Presença registrada · sem localização'}
            {checkinCount != null && checkinCount > 1 && (
              <span className="ml-1">· {checkinCount} no total</span>
            )}
          </p>
        </div>
      </div>
    );
  }

  if (state === 'already') {
    return (
      <div className="flex items-center gap-2 rounded-2xl px-4 py-3 border border-border">
        <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
        <p className="text-sm text-muted-foreground">Você já fez check-in neste evento</p>
      </div>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={state === 'loading'}
      className="w-full rounded-2xl px-4 py-3 flex items-center gap-3 border transition-all active:scale-[0.98] disabled:opacity-60 group"
      style={{
        background: 'linear-gradient(135deg, #10b98110, #3b82f610)',
        borderColor: '#10b98130',
      }}
    >
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors group-hover:scale-105"
        style={{ background: '#10b981' }}
      >
        {state === 'loading'
          ? <Loader2 className="w-4 h-4 text-white animate-spin" />
          : <MapPin className="w-4 h-4 text-white" />
        }
      </div>
      <div className="flex-1 text-left min-w-0">
        <p className="text-sm font-bold text-foreground">
          {state === 'loading' ? 'Registrando...' : 'Estou aqui'}
        </p>
        <p className="text-[11px] text-muted-foreground">
          {state === 'error'
            ? 'Erro ao registrar — tente novamente'
            : 'Marque sua presença e apareça nos números'}
        </p>
      </div>
      <Users className="w-4 h-4 text-muted-foreground/50 flex-shrink-0" />
    </button>
  );
}
