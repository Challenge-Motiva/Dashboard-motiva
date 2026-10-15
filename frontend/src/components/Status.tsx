import type { Nivel } from "../data/types";

export const ROTULO_NIVEL: Record<Nivel, string> = {
  verde: "Normal",
  amarelo: "Atenção",
  vermelho: "Intervenção recomendada",
  cinza: "Sem dados",
};

/** Cada estado tem forma própria, para nunca depender só da cor. */
export function StatusIcon({ nivel, size = 16 }: { nivel: Nivel; size?: number }) {
  const cor = `var(--st-${nivel})`;
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true" className="st-icon">
      {nivel === "verde" && (
        <>
          <circle cx="8" cy="8" r="7" fill={cor} />
          <path d="M4.6 8.2l2.2 2.2 4.6-4.8" stroke="#fff" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </>
      )}
      {nivel === "amarelo" && (
        <>
          <path d="M8 1.2l7 12.6H1z" fill={cor} strokeLinejoin="round" />
          <path d="M8 5.6v4" stroke="#1b1b1b" strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="8" cy="11.8" r="1" fill="#1b1b1b" />
        </>
      )}
      {nivel === "vermelho" && (
        <>
          <path d="M5.1 1h5.8L15 5.1v5.8L10.9 15H5.1L1 10.9V5.1z" fill={cor} />
          <path d="M5.5 5.5l5 5M10.5 5.5l-5 5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
        </>
      )}
      {nivel === "cinza" && (
        <>
          <circle cx="8" cy="8" r="6.2" fill="none" stroke={cor} strokeWidth="1.8" strokeDasharray="2.6 1.8" />
          <path d="M5 8h6" stroke={cor} strokeWidth="1.8" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}

export function StatusBadge({ nivel, curto = false }: { nivel: Nivel; curto?: boolean }) {
  const texto = curto && nivel === "vermelho" ? "Intervenção" : ROTULO_NIVEL[nivel];
  return (
    <span className={`badge badge-${nivel}`}>
      <StatusIcon nivel={nivel} size={14} />
      {texto}
    </span>
  );
}
