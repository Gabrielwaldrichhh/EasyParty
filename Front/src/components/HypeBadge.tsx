import { calcHype, type HypeInput } from "../utils/hype";

interface Props extends HypeInput {
  /** "sm" = chip compacto nos cards, "md" = banner no detail panel */
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * Badge de hype — só renderiza quando o nível é >= 'aquecendo'.
 * Não mostra nada para eventos com hype baixo.
 */
export function HypeBadge({ size = 'sm', className = '', ...hypeInput }: Props) {
  const { label, color, level } = calcHype(hypeInput);

  if (!label) return null; // nível 'normal' — sem badge

  if (size === 'md') {
    return (
      <span
        className={`inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full text-white ${className}`}
        style={{ background: color, boxShadow: `0 2px 8px ${color}50` }}
      >
        {label}
      </span>
    );
  }

  // sm — chip compacto
  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white ${className}`}
      style={{
        background: color,
        // pulsa levemente para o nível máximo
        animation: level === 'bombando' ? 'pulse 2s cubic-bezier(0.4,0,0.6,1) infinite' : undefined,
      }}
    >
      {label}
    </span>
  );
}
