import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { ALERTAS_INICIAIS } from "../data/mock";
import type { Alerta } from "../data/types";
import { isoLocal } from "./formato";

/** Gestor simulado (login real fica para depois). */
export const GESTOR = "Roberto Almeida";

interface Decisao {
  status: "confirmado" | "descartado";
  decidido_por: string;
  decidido_em: string;
  justificativa: string;
}

interface PlanoAprovado {
  por: string;
  em: string;
  horas: number;
  escadas: string[];
}

interface Estado {
  decisoes: Record<string, Decisao>;
  plano: PlanoAprovado | null;
}

const CHAVE = "motiva-escadas-v1";

function carregar(): Estado {
  try {
    const raw = localStorage.getItem(CHAVE);
    if (raw) return JSON.parse(raw) as Estado;
  } catch {
    /* armazenamento indisponível: segue só em memória */
  }
  return { decisoes: {}, plano: null };
}

interface Ctx {
  alertas: Alerta[];
  plano: PlanoAprovado | null;
  decidir: (id: string, status: Decisao["status"], justificativa: string) => void;
  desfazer: (id: string) => void;
  aprovarPlano: (horas: number, escadas: string[]) => void;
  cancelarPlano: () => void;
  reiniciar: () => void;
}

const StoreCtx = createContext<Ctx | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<Estado>(carregar);

  useEffect(() => {
    try {
      localStorage.setItem(CHAVE, JSON.stringify(estado));
    } catch {
      /* ignora */
    }
  }, [estado]);

  const valor = useMemo<Ctx>(() => {
    const alertas = ALERTAS_INICIAIS.map((a) => (estado.decisoes[a.alerta_id] ? { ...a, ...estado.decisoes[a.alerta_id] } : a));
    return {
      alertas,
      plano: estado.plano,
      decidir: (id, status, justificativa) =>
        setEstado((s) => ({
          ...s,
          plano: null, // qualquer nova decisão invalida o plano aprovado
          decisoes: { ...s.decisoes, [id]: { status, justificativa, decidido_por: GESTOR, decidido_em: isoLocal(new Date()) } },
        })),
      desfazer: (id) =>
        setEstado((s) => {
          const { [id]: _removida, ...resto } = s.decisoes;
          return { ...s, plano: null, decisoes: resto };
        }),
      aprovarPlano: (horas, escadas) => setEstado((s) => ({ ...s, plano: { por: GESTOR, em: isoLocal(new Date()), horas, escadas } })),
      cancelarPlano: () => setEstado((s) => ({ ...s, plano: null })),
      reiniciar: () => setEstado({ decisoes: {}, plano: null }),
    };
  }, [estado]);

  return <StoreCtx.Provider value={valor}>{children}</StoreCtx.Provider>;
}

export function useStore(): Ctx {
  const c = useContext(StoreCtx);
  if (!c) throw new Error("useStore fora do StoreProvider");
  return c;
}

export function useRota(): string {
  const [h, setH] = useState(() => window.location.hash.slice(1) || "/");
  useEffect(() => {
    const f = () => {
      setH(window.location.hash.slice(1) || "/");
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", f);
    return () => window.removeEventListener("hashchange", f);
  }, []);
  return h;
}
