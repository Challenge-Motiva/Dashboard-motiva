/**
 * Versão provisória de planejar_turno(base, horas). A versão oficial vem da
 * disciplina de Dynamic Programming; esta mantém a mesma assinatura e o mesmo
 * grafo para o protótipo poder ser trocado sem mudar a tela.
 */
import { ESTACOES } from "../data/mock";
import type { Alerta, EscadaRolante } from "../data/types";

export const BASE = "BASE";
export const NOME_BASE = "Base de manutenção (Pátio Vila Sônia)";

/** Tempo de deslocamento entre estações vizinhas, em minutos (FICTÍCIO). */
const TRECHOS_MIN = [3, 2, 3, 2, 2, 3, 2, 4, 3, 3];

type Grafo = Record<string, { para: string; min: number }[]>;

export const GRAFO: Grafo = (() => {
  const g: Grafo = { [BASE]: [] };
  for (const e of ESTACOES) g[e.nome] = [];
  const liga = (a: string, b: string, min: number) => {
    g[a].push({ para: b, min });
    g[b].push({ para: a, min });
  };
  for (let i = 0; i < ESTACOES.length - 1; i++) liga(ESTACOES[i].nome, ESTACOES[i + 1].nome, TRECHOS_MIN[i]);
  liga(BASE, "Vila Sônia", 6);
  return g;
})();

export function dijkstra(origem: string): { dist: Record<string, number>; prev: Record<string, string | null> } {
  const dist: Record<string, number> = {};
  const prev: Record<string, string | null> = {};
  for (const v of Object.keys(GRAFO)) {
    dist[v] = Infinity;
    prev[v] = null;
  }
  dist[origem] = 0;
  const abertos = new Set(Object.keys(GRAFO));
  while (abertos.size) {
    let u = "";
    for (const v of abertos) if (!u || dist[v] < dist[u]) u = v;
    abertos.delete(u);
    for (const { para, min } of GRAFO[u]) {
      if (dist[u] + min < dist[para]) {
        dist[para] = dist[u] + min;
        prev[para] = u;
      }
    }
  }
  return { dist, prev };
}

export function rota(origem: string, destino: string): { caminho: string[]; minutos: number } {
  const { dist, prev } = dijkstra(origem);
  const caminho: string[] = [];
  for (let v: string | null = destino; v; v = prev[v]) caminho.unshift(v);
  return { caminho, minutos: dist[destino] };
}

/** Tempo de atendimento estimado por nível (FICTÍCIO, a calibrar com o histórico de OS). */
export const ATENDIMENTO_MIN = { vermelho: 90, amarelo: 45 };

export interface Parada {
  escada: EscadaRolante;
  alertas: Alerta[];
  nivel: "amarelo" | "vermelho";
  caminho: string[];
  deslocamento: number;
  chegada: number;
  saida: number;
}

export interface Plano {
  paradas: Parada[];
  adiadas: { escada: EscadaRolante; alertas: Alerta[] }[];
  retorno: { caminho: string[]; minutos: number };
  totalMin: number;
}

/**
 * Atende as escadas com alerta confirmado em ordem de criticidade, enquanto
 * couber no turno (incluindo a volta à base). O que não couber fica adiado.
 */
export function planejarTurno(
  base: string,
  horas: number,
  confirmados: Alerta[],
  escadas: Record<string, EscadaRolante>,
): Plano {
  const porEscada = new Map<string, Alerta[]>();
  for (const a of confirmados) porEscada.set(a.escada_id, [...(porEscada.get(a.escada_id) ?? []), a]);
  const fila = [...porEscada.entries()]
    .map(([id, alertas]) => ({ escada: escadas[id], alertas }))
    .sort((a, b) => b.escada.score_criticidade - a.escada.score_criticidade);

  const limite = horas * 60;
  const paradas: Parada[] = [];
  const adiadas: Plano["adiadas"] = [];
  let t = 0;
  let atual = base;
  for (const item of fila) {
    const ida = rota(atual, item.escada.estacao);
    const volta = rota(item.escada.estacao, base);
    const nivel = item.alertas.some((a) => a.nivel === "vermelho") ? "vermelho" : "amarelo";
    const serv = ATENDIMENTO_MIN[nivel];
    if (t + ida.minutos + serv + volta.minutos > limite) {
      adiadas.push(item);
      continue;
    }
    const chegada = t + ida.minutos;
    paradas.push({ ...item, nivel, caminho: ida.caminho, deslocamento: ida.minutos, chegada, saida: chegada + serv });
    t = chegada + serv;
    atual = item.escada.estacao;
  }
  const retorno = rota(atual, base);
  return { paradas, adiadas, retorno, totalMin: t + retorno.minutos };
}
