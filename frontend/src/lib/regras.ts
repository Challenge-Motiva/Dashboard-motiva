import { LIMITES, type Limite } from "../data/limites";
import type { Grupo, Leitura, Nivel, Sinal } from "../data/types";
import { haQuanto, minutosDesde, num } from "./formato";

/** Sem leitura há mais que isso => cinza (sem dados / offline). */
export const MINUTOS_OFFLINE = 60;
/** Média móvel das últimas N leituras, para não alertar por ruído isolado. */
const JANELA = 3;

export interface Avaliacao {
  nivel: "verde" | "amarelo" | "vermelho";
  limite: number;
  /** Fração além do limite violado (0.4 = 40%). Zero quando verde. */
  excesso: number;
  direcao: "acima" | "abaixo";
}

export function avaliar(lim: Limite, v: number): Avaliacao {
  if (lim.tipo === "max") {
    const nivel = v >= lim.vermelho ? "vermelho" : v >= lim.amarelo ? "amarelo" : "verde";
    const limite = nivel === "vermelho" ? lim.vermelho : lim.amarelo;
    return { nivel, limite, excesso: nivel === "verde" ? 0 : (v - limite) / limite, direcao: "acima" };
  }
  if (lim.tipo === "min") {
    const nivel = v <= lim.vermelho ? "vermelho" : v <= lim.amarelo ? "amarelo" : "verde";
    const limite = nivel === "vermelho" ? lim.vermelho : lim.amarelo;
    return { nivel, limite, excesso: nivel === "verde" ? 0 : (limite - v) / limite, direcao: "abaixo" };
  }
  const nom = lim.nominal ?? 0;
  const desvio = Math.abs(v - nom);
  const sentido = v >= nom ? 1 : -1;
  const nivel = desvio >= lim.vermelho ? "vermelho" : desvio >= lim.amarelo ? "amarelo" : "verde";
  const limite = nom + sentido * (nivel === "vermelho" ? lim.vermelho : lim.amarelo);
  return {
    nivel,
    limite,
    excesso: nivel === "verde" ? 0 : Math.abs(v - limite) / limite,
    direcao: sentido > 0 ? "acima" : "abaixo",
  };
}

function suavizado(leituras: Leitura[], lim: Limite, i: number): number {
  const ini = Math.max(0, i - JANELA + 1);
  let s = 0;
  for (let k = ini; k <= i; k++) s += leituras[k][lim.campo];
  return s / (i - ini + 1);
}

export interface Violacao extends Avaliacao {
  sinal: Sinal;
  valor: number;
  desde: string;
}

export interface Diagnostico {
  status: Nivel;
  violacoes: Violacao[];
  ultima: Leitura | null;
}

const PESO: Record<string, number> = { vermelho: 2, amarelo: 1, verde: 0 };

/** Motor de regras: compara a média recente de cada sinal com os limites. */
export function diagnosticar(leituras: Leitura[]): Diagnostico {
  const ultima = leituras.at(-1) ?? null;
  if (!ultima || minutosDesde(ultima.timestamp) > MINUTOS_OFFLINE) {
    return { status: "cinza", violacoes: [], ultima };
  }
  const n = leituras.length - 1;
  const violacoes: Violacao[] = [];
  for (const lim of LIMITES) {
    const valor = suavizado(leituras, lim, n);
    const av = avaliar(lim, valor);
    if (av.nivel === "verde") continue;
    // Volta no tempo até a primeira leitura da sequência fora do limite amarelo.
    let i = n;
    while (i > 0 && avaliar(lim, suavizado(leituras, lim, i - 1)).nivel !== "verde") i--;
    violacoes.push({ ...av, sinal: lim.sinal, valor, desde: leituras[i].timestamp });
  }
  violacoes.sort((a, b) => PESO[b.nivel] - PESO[a.nivel] || b.excesso - a.excesso);
  const status: Nivel = violacoes[0]?.nivel ?? "verde";
  return { status, violacoes, ultima };
}

export const ehCritica = (g: Grupo) => g.startsWith("Critica");

/**
 * Score 0–1. A faixa do nível domina; dentro do mesmo nível, escada crítica
 * vem antes da não crítica; o excesso sobre o limite desempata.
 */
export function scoreCriticidade(d: Diagnostico, grupo: Grupo): number {
  const base = { vermelho: 0.7, amarelo: 0.4, cinza: 0.25, verde: 0.05 }[d.status];
  const crit = ehCritica(grupo) ? 0.15 : 0;
  const exc = Math.min((d.violacoes[0]?.excesso ?? 0) * 2, 1) * 0.1;
  return Math.round((base + crit + exc) * 100) / 100;
}

const ROTULO_SINAL: Record<Sinal, string> = Object.fromEntries(LIMITES.map((l) => [l.sinal, l.rotulo])) as Record<Sinal, string>;

export function textoViolacao(v: Violacao): string {
  const lim = LIMITES.find((l) => l.sinal === v.sinal)!;
  const pct = Math.max(1, Math.round(v.excesso * 100));
  return `${ROTULO_SINAL[v.sinal]} ${pct}% ${v.direcao} do limite ${v.nivel} (${num(v.valor, lim.casas)} contra ${num(v.limite, lim.casas)} ${lim.unidade}), fora do normal ${haQuanto(v.desde)}`;
}

export function motivo(d: Diagnostico): string {
  if (d.status === "cinza") {
    return d.ultima
      ? `Sem leitura ${haQuanto(d.ultima.timestamp)}. Verificar o DispositivoIoT e a rede da estação.`
      : "Nenhuma leitura recebida.";
  }
  if (d.status === "verde") return "Todos os sinais dentro dos limites.";
  const extra = d.violacoes.length > 1 ? ` (+${d.violacoes.length - 1} sinal fora do limite)` : "";
  return textoViolacao(d.violacoes[0]) + extra;
}
