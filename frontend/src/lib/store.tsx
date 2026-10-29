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

export interface ParadaOrdem {
  escada_id: string;
  nivel: "amarelo" | "vermelho";
  estacao: string;
  /** Minutos desde o início do turno. */
  chegada: number;
  saida: number;
  /** Ausente = equipe acionada, ainda sem retorno. */
  fase?: Exclude<FaseAtendimento, "acionada">;
  concluida_em?: string;
  validada_por?: string;
  validada_em?: string;
  nota?: string;
}

/**
 * Ciclo de cada escada despachada: a equipe conclui (no protótipo, simulado por botão)
 * e o gestor valida ou reprova. Reprovada volta para a fila do plano.
 */
export type FaseAtendimento = "acionada" | "concluida" | "validada" | "reprovada";

export interface Atendimento {
  fase: FaseAtendimento;
  ordem_id: string;
  equipe_id: string;
  parada: ParadaOrdem;
}

/** Ordem despachada para uma equipe. Uma equipe pode receber várias ordens em sequência no mesmo turno. */
export interface OrdemAprovada {
  ordem_id: string;
  por: string;
  em: string;
  equipe_id: string;
  /** BASE na 1ª ordem; nas seguintes, a estação onde a equipe terminou a ordem anterior. */
  origem: string;
  paradas: ParadaOrdem[];
  /** Minutos desde o início do turno: saída da origem e retorno à base. */
  inicio: number;
  fim: number;
}

interface Estado {
  decisoes: Record<string, Decisao>;
  ordens: OrdemAprovada[];
}

const CHAVE = "motiva-escadas-v4"; // v4: ordens de uma mesma equipe emendam na anterior, sem voltar à base

function carregar(): Estado {
  try {
    const raw = localStorage.getItem(CHAVE);
    if (raw) return JSON.parse(raw) as Estado;
  } catch {
    /* armazenamento indisponível: segue só em memória */
  }
  return { decisoes: {}, ordens: [] };
}

interface Ctx {
  alertas: Alerta[];
  ordens: OrdemAprovada[];
  decidir: (id: string, status: Decisao["status"], justificativa: string) => void;
  desfazer: (id: string) => void;
  acionarEquipe: (equipe_id: string, origem: string, paradas: ParadaOrdem[], inicio: number, fim: number) => void;
  cancelarOrdem: (ordem_id: string) => void;
  /** Atendimento mais recente de cada escada que já foi para uma equipe. */
  atendimentos: Record<string, Atendimento>;
  registrarConclusao: (ordem_id: string, escada_id: string) => void;
  validarReparo: (ordem_id: string, escada_id: string, aprovado: boolean, nota: string) => void;
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
    const atendimentos: Record<string, Atendimento> = {};
    for (const o of estado.ordens)
      for (const p of o.paradas) atendimentos[p.escada_id] = { fase: p.fase ?? "acionada", ordem_id: o.ordem_id, equipe_id: o.equipe_id, parada: p };
    const mudarParada = (ordem_id: string, escada_id: string, f: (p: ParadaOrdem) => ParadaOrdem) =>
      setEstado((s) => ({
        ...s,
        ordens: s.ordens.map((o) => (o.ordem_id !== ordem_id ? o : { ...o, paradas: o.paradas.map((p) => (p.escada_id === escada_id ? f(p) : p)) })),
      }));
    return {
      alertas,
      ordens: estado.ordens,
      atendimentos,
      registrarConclusao: (ordem_id, escada_id) => mudarParada(ordem_id, escada_id, (p) => ({ ...p, fase: "concluida", concluida_em: isoLocal(new Date()) })),
      validarReparo: (ordem_id, escada_id, aprovado, nota) =>
        mudarParada(ordem_id, escada_id, (p) => ({ ...p, fase: aprovado ? "validada" : "reprovada", validada_por: GESTOR, validada_em: isoLocal(new Date()), nota })),
      // Ordens já despachadas não são revogadas por novas decisões: as escadas novas entram numa próxima ordem.
      decidir: (id, status, justificativa) =>
        setEstado((s) => ({
          ...s,
          decisoes: { ...s.decisoes, [id]: { status, justificativa, decidido_por: GESTOR, decidido_em: isoLocal(new Date()) } },
        })),
      desfazer: (id) =>
        setEstado((s) => {
          const { [id]: _removida, ...resto } = s.decisoes;
          return { ...s, decisoes: resto };
        }),
      acionarEquipe: (equipe_id, origem, paradas, inicio, fim) =>
        setEstado((s) => ({
          ...s,
          ordens: [
            ...s.ordens,
            { ordem_id: `ORD-${String(s.ordens.length + 1).padStart(2, "0")}-${Date.now() % 10000}`, por: GESTOR, em: isoLocal(new Date()), equipe_id, origem, paradas, inicio, fim },
          ],
        })),
      cancelarOrdem: (ordem_id) => setEstado((s) => ({ ...s, ordens: s.ordens.filter((o) => o.ordem_id !== ordem_id) })),
      reiniciar: () => setEstado({ decisoes: {}, ordens: [] }),
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
