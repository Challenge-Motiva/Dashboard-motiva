import { useEffect, useRef, useState, type ReactNode } from "react";

export interface Opcao {
  valor: string;
  rotulo: ReactNode;
}

/** Filtro de múltipla escolha: botão que abre uma lista de caixas de seleção. Vazio = todos. */
export function MultiFiltro({
  rotulo,
  todos,
  opcoes,
  selecionados,
  onChange,
}: {
  rotulo: string;
  todos: string;
  opcoes: Opcao[];
  selecionados: Set<string>;
  onChange: (s: Set<string>) => void;
}) {
  const [aberto, setAberto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!aberto) return;
    const fora = (ev: MouseEvent) => {
      if (ref.current && !ref.current.contains(ev.target as Node)) setAberto(false);
    };
    const esc = (ev: KeyboardEvent) => ev.key === "Escape" && setAberto(false);
    document.addEventListener("mousedown", fora);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", fora);
      document.removeEventListener("keydown", esc);
    };
  }, [aberto]);

  const alternar = (v: string) => {
    const s = new Set(selecionados);
    if (s.has(v)) s.delete(v);
    else s.add(v);
    onChange(s);
  };

  const resumo =
    selecionados.size === 0
      ? todos
      : selecionados.size === 1
        ? opcoes.find((o) => selecionados.has(o.valor))?.rotulo
        : `${selecionados.size} selecionados`;

  return (
    <div className="multi" ref={ref}>
      <span className="multi-label">{rotulo}</span>
      <button type="button" className={`multi-btn ${selecionados.size ? "has" : ""}`} aria-expanded={aberto} aria-haspopup="listbox" onClick={() => setAberto((a) => !a)}>
        <span className="multi-resumo">{resumo}</span>
        <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
          <path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        </svg>
      </button>
      {aberto && (
        <div className="multi-pop" role="listbox" aria-multiselectable="true" aria-label={rotulo}>
          {opcoes.map((o) => (
            <label key={o.valor} className="multi-opt">
              <input type="checkbox" checked={selecionados.has(o.valor)} onChange={() => alternar(o.valor)} />
              <span>{o.rotulo}</span>
            </label>
          ))}
          <div className="multi-foot">
            <button type="button" className="btn-ghost small" onClick={() => onChange(new Set(opcoes.map((o) => o.valor)))}>
              Marcar todos
            </button>
            <button type="button" className="btn-ghost small" disabled={!selecionados.size} onClick={() => onChange(new Set())}>
              Limpar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
