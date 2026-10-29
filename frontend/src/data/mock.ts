/**
 * DADOS FICTÍCIOS. Gerados de forma determinística (semente fixa) só para o protótipo.
 * Os formatos seguem o contrato do dashboard: para trocar pela API Java, basta
 * substituir este módulo mantendo as mesmas exportações.
 */
import { AGORA, isoLocal } from "../lib/formato";
import { diagnosticar, scoreCriticidade, type Diagnostico } from "../lib/regras";
import type { Alerta, Equipe, EscadaRolante, Estacao, Grupo, Leitura, OrdemServico, Sinal } from "./types";

function mulberry32(a: number) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(20261011);
const gauss = () => {
  let u = 0;
  let v = 0;
  while (!u) u = rnd();
  while (!v) v = rnd();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
};
const pick = <T,>(xs: T[]) => xs[Math.floor(rnd() * xs.length)];

// Estações reais da Linha 4-Amarela, na ordem da linha (as mesmas do grafo de Dynamic Programming).
export const ESTACOES: Estacao[] = [
  { sigla: "LUZ", nome: "Luz", ordem: 1 },
  { sigla: "REP", nome: "República", ordem: 2 },
  { sigla: "HIG", nome: "Higienópolis-Mackenzie", ordem: 3 },
  { sigla: "PAU", nome: "Paulista", ordem: 4 },
  { sigla: "OSF", nome: "Oscar Freire", ordem: 5 },
  { sigla: "FRA", nome: "Fradique Coutinho", ordem: 6 },
  { sigla: "FAL", nome: "Faria Lima", ordem: 7 },
  { sigla: "PIN", nome: "Pinheiros", ordem: 8 },
  { sigla: "BUT", nome: "Butantã", ordem: 9 },
  { sigla: "SPM", nome: "São Paulo-Morumbi", ordem: 10 },
  { sigla: "VSO", nome: "Vila Sônia", ordem: 11 },
];
const QTD_POR_ESTACAO = [4, 4, 3, 5, 3, 3, 4, 4, 3, 4, 3]; // 40 escadas na amostra

// Amostra de 40 mantendo a proporção real 47 / 35 / 94 / 21 (de 197).
const POOL: Record<Grupo, number> = { "Critica A": 10, "Critica B": 7, "Nao critica A": 19, "Nao critica B": 4 };

const ACESSOS = ["Rua - mezanino", "Mezanino - plataforma", "Plataforma - mezanino", "Mezanino - rua", "Transferência"];
const FABRICANTES = ["Fabricante A", "Fabricante B", "Fabricante C"];

export const EQUIPES: Equipe[] = [
  { equipe_id: "EQ-01", nome: "Equipe 1", base: "BASE", turno: "diurno", especialidade: "Mecânica geral", tecnicos: ["Carla Souza", "Diego Martins", "Paulo Reis"] },
  { equipe_id: "EQ-02", nome: "Equipe 2", base: "BASE", turno: "diurno", especialidade: "Elétrica e comandos", tecnicos: ["Juliana Prado", "Marcos Lima"] },
  { equipe_id: "EQ-03", nome: "Equipe 3", base: "BASE", turno: "noturno", especialidade: "Mecânica pesada (motor e redutor)", tecnicos: ["André Nunes", "Beatriz Rocha", "Felipe Costa"] },
  { equipe_id: "EQ-04", nome: "Equipe 4", base: "BASE", turno: "noturno", especialidade: "Elétrica e lubrificação", tecnicos: ["Larissa Gomes", "Thiago Alves"] },
];

interface Desvio {
  sinal: Sinal;
  inicioH: number;
  alvo: number;
  /** degrau: mudança brusca (ex.: rolamento), em vez de rampa gradual. */
  degrau?: boolean;
}

/** Cenários plantados para o protótipo mostrar todos os estados. */
interface Cenario {
  grupo: Grupo;
  desvios?: Desvio[];
  offlineMin?: number;
}
const CENARIOS: Record<string, Cenario> = {
  // Vermelho
  "ECR-PAU-03": { grupo: "Critica A", desvios: [{ sinal: "vibracao", inicioH: 74, alvo: 4.6, degrau: true }] },
  "ECR-REP-02": { grupo: "Critica B", desvios: [{ sinal: "temperatura", inicioH: 30, alvo: 86 }] },
  "ECR-OSF-02": { grupo: "Critica B", desvios: [{ sinal: "tensao", inicioH: 20, alvo: 336 }] },
  "ECR-FAL-01": { grupo: "Nao critica A", desvios: [{ sinal: "nivel_oleo", inicioH: 130, alvo: 22 }] },
  "ECR-LUZ-01": { grupo: "Critica A", desvios: [{ sinal: "corrente", inicioH: 14, alvo: 27, degrau: true }] },
  "ECR-SPM-02": { grupo: "Critica B", desvios: [{ sinal: "vibracao", inicioH: 90, alvo: 4.8 }] },
  "ECR-REP-04": { grupo: "Nao critica A", desvios: [{ sinal: "temperatura", inicioH: 26, alvo: 90 }] },
  // Vários sinais ao mesmo tempo (motor sobrecarregado: aquece e puxa mais corrente)
  "ECR-VSO-01": {
    grupo: "Critica A",
    desvios: [
      { sinal: "temperatura", inicioH: 52, alvo: 78 },
      { sinal: "corrente", inicioH: 52, alvo: 23.4 },
    ],
  },
  // Amarelo
  "ECR-PIN-03": { grupo: "Critica A", desvios: [{ sinal: "corrente", inicioH: 48, alvo: 23.2 }] },
  "ECR-FRA-01": { grupo: "Critica A", desvios: [{ sinal: "temperatura", inicioH: 40, alvo: 70 }] },
  "ECR-LUZ-04": { grupo: "Nao critica A", desvios: [{ sinal: "velocidade", inicioH: 36, alvo: 0.474 }] },
  "ECR-HIG-01": { grupo: "Nao critica B", desvios: [{ sinal: "vibracao", inicioH: 60, alvo: 3.4 }] },
  "ECR-PAU-01": { grupo: "Critica A", desvios: [{ sinal: "nivel_oleo", inicioH: 160, alvo: 34 }] },
  "ECR-FAL-03": { grupo: "Critica A", desvios: [{ sinal: "tensao", inicioH: 18, alvo: 354 }] },
  "ECR-HIG-03": { grupo: "Critica B", desvios: [{ sinal: "velocidade", inicioH: 44, alvo: 0.535 }] },
  "ECR-PIN-02": { grupo: "Nao critica A", desvios: [{ sinal: "vibracao", inicioH: 28, alvo: 3.2 }] },
  // Cinza (sem leitura)
  "ECR-BUT-02": { grupo: "Critica B", offlineMin: 160 },
  "ECR-VSO-03": { grupo: "Nao critica A", offlineMin: 410 },
  "ECR-OSF-03": { grupo: "Nao critica B", offlineMin: 85 },
};

/** Intensidade de uso 0–1: picos às 8h e às 18h, quase zero de madrugada. */
function uso(d: Date): number {
  const h = d.getHours() + d.getMinutes() / 60;
  if (h < 4.5) return 0.05;
  const pico = (c: number) => Math.exp(-((h - c) ** 2) / (2 * 1.2 ** 2));
  return Math.min(1, 0.25 + 0.75 * Math.max(pico(8), pico(18)));
}

const HORAS = 168; // 7 dias de leituras horárias

function gerarLeituras(id: string, c?: Cenario): Leitura[] {
  const base = {
    vibracao_mm_s: 1.4 + rnd() * 0.5,
    temperatura_c: 48 + rnd() * 6,
    corrente_a: 14 + rnd() * 2,
    tensao_v: 380,
    nivel_oleo_pct: 78 + rnd() * 14,
    velocidade_m_s: 0.5,
  };
  const atraso = 1 + Math.floor(rnd() * 13); // minutos desde a última leitura
  const out: Leitura[] = [];
  for (let h = HORAS; h >= 0; h--) {
    if (c?.offlineMin && h * 60 < c.offlineMin) break;
    const t = new Date(AGORA.getTime() - (atraso + h * 60) * 60000);
    const u = uso(t);
    const l: Leitura = {
      escada_id: id,
      timestamp: isoLocal(t),
      vibracao_mm_s: base.vibracao_mm_s + 0.35 * u + 0.12 * gauss(),
      temperatura_c: base.temperatura_c + 7 * u + 1.0 * gauss(),
      corrente_a: base.corrente_a + 3 * u + 0.4 * gauss(),
      tensao_v: base.tensao_v + 2.5 * gauss(),
      nivel_oleo_pct: base.nivel_oleo_pct - (HORAS - h) * 0.02 + 0.4 * gauss(),
      velocidade_m_s: base.velocidade_m_s - 0.004 * u + 0.002 * gauss(),
    };
    for (const d of c?.desvios ?? []) {
      if (h >= d.inicioH) continue;
      const campo = {
        vibracao: "vibracao_mm_s",
        temperatura: "temperatura_c",
        corrente: "corrente_a",
        tensao: "tensao_v",
        nivel_oleo: "nivel_oleo_pct",
        velocidade: "velocidade_m_s",
      }[d.sinal] as keyof typeof base;
      const p = d.degrau ? 0.75 + 0.25 * (1 - h / d.inicioH) : Math.pow(1 - h / d.inicioH, 1.3);
      l[campo] += (d.alvo - base[campo]) * p;
    }
    out.push(l);
  }
  return out;
}

// --- Montagem da frota -----------------------------------------------------

const pool = { ...POOL };
for (const c of Object.values(CENARIOS)) pool[c.grupo]--;
const restantes: Grupo[] = (Object.entries(pool) as [Grupo, number][]).flatMap(([g, n]) => Array<Grupo>(n).fill(g));
for (let i = restantes.length - 1; i > 0; i--) {
  const j = Math.floor(rnd() * (i + 1));
  [restantes[i], restantes[j]] = [restantes[j], restantes[i]];
}

export const ESCADAS: EscadaRolante[] = [];
export const LEITURAS: Record<string, Leitura[]> = {};
export const DIAGNOSTICOS: Record<string, Diagnostico> = {};

ESTACOES.forEach((est, ei) => {
  for (let n = 1; n <= QTD_POR_ESTACAO[ei]; n++) {
    const id = `ECR-${est.sigla}-${String(n).padStart(2, "0")}`;
    const c = CENARIOS[id];
    const grupo = c?.grupo ?? restantes.pop()!;
    const leituras = gerarLeituras(id, c);
    const diag = diagnosticar(leituras);
    LEITURAS[id] = leituras;
    DIAGNOSTICOS[id] = diag;
    ESCADAS.push({
      escada_id: id,
      estacao: est.nome,
      linha: "4-Amarela",
      grupo,
      fabricante: pick(FABRICANTES),
      acesso: ACESSOS[(n - 1) % ACESSOS.length],
      status: diag.status,
      score_criticidade: scoreCriticidade(diag, grupo),
      ultima_leitura: diag.ultima?.timestamp ?? "",
    });
  }
});

export const ESCADA_POR_ID: Record<string, EscadaRolante> = Object.fromEntries(ESCADAS.map((e) => [e.escada_id, e]));

// --- Alertas ---------------------------------------------------------------

let seqAlerta = 120;
const novoIdAlerta = () => `AL-${String(++seqAlerta).padStart(4, "0")}`;

/** Histórico de alertas já decididos (fictício). */
const HISTORICO: Alerta[] = [
  { escada_id: "ECR-PAU-03", sinal: "vibracao", valor: 3.2, limite: 3.0, nivel: "amarelo", status: "descartado", aberto_em: "2026-08-21T07:50:00", decidido_por: "Roberto Almeida", decidido_em: "2026-08-21T09:12:00", justificativa: "Pico isolado no horário de pico; voltou ao normal na leitura seguinte." },
  { escada_id: "ECR-FAL-01", sinal: "nivel_oleo", valor: 38, limite: 40, nivel: "amarelo", status: "confirmado", aberto_em: "2026-09-02T10:00:00", decidido_por: "Roberto Almeida", decidido_em: "2026-09-02T11:30:00", justificativa: "Completar óleo e inspecionar retentor do redutor." },
  { escada_id: "ECR-REP-02", sinal: "temperatura", valor: 72, limite: 70, nivel: "amarelo", status: "confirmado", aberto_em: "2026-09-15T18:20:00", decidido_por: "Roberto Almeida", decidido_em: "2026-09-15T19:05:00", justificativa: "Aquecimento recorrente. Agendar inspeção do motor fora do pico." },
  { escada_id: "ECR-SPM-01", sinal: "corrente", valor: 22.4, limite: 22, nivel: "amarelo", status: "descartado", aberto_em: "2026-09-28T08:05:00", decidido_por: "Roberto Almeida", decidido_em: "2026-09-28T08:40:00", justificativa: "Evento com lotação atípica (jogo no Morumbi). Sem tendência." },
  { escada_id: "ECR-PIN-01", sinal: "vibracao", valor: 4.7, limite: 4.5, nivel: "vermelho", status: "confirmado", aberto_em: "2026-10-03T06:10:00", decidido_por: "Roberto Almeida", decidido_em: "2026-10-03T06:25:00", justificativa: "Rolamento do motor com ruído. Troca realizada na OS-0907." },
  { escada_id: "ECR-LUZ-01", sinal: "corrente", valor: 22.6, limite: 22, nivel: "amarelo", status: "descartado", aberto_em: "2026-10-05T17:55:00", decidido_por: "Roberto Almeida", decidido_em: "2026-10-05T18:30:00", justificativa: "Fluxo alto na saída do show na Luz; corrente normalizou às 19h." },
  { escada_id: "ECR-SPM-02", sinal: "vibracao", valor: 3.1, limite: 3.0, nivel: "amarelo", status: "confirmado", aberto_em: "2026-10-07T08:20:00", decidido_por: "Roberto Almeida", decidido_em: "2026-10-07T09:00:00", justificativa: "Início de tendência de alta. Inspeção de corrente de degraus agendada." },
  { escada_id: "ECR-OSF-03", sinal: "tensao", valor: 358, limite: 361, nivel: "amarelo", status: "descartado", aberto_em: "2026-10-09T12:15:00", decidido_por: "Roberto Almeida", decidido_em: "2026-10-09T12:40:00", justificativa: "Queda de tensão da concessionária na região; afetou a estação inteira." },
].map((a) => ({ ...a, alerta_id: novoIdAlerta() }) as Alerta);
export const IDS_HISTORICO = new Set(HISTORICO.map((a) => a.alerta_id));

const ABERTOS: Alerta[] = ESCADAS.flatMap((e) =>
  DIAGNOSTICOS[e.escada_id].violacoes.map((v) => ({
    alerta_id: "",
    escada_id: e.escada_id,
    sinal: v.sinal,
    valor: Math.round(v.valor * 1000) / 1000,
    limite: Math.round(v.limite * 1000) / 1000,
    nivel: v.nivel as "amarelo" | "vermelho",
    status: "aberto" as const,
    aberto_em: v.desde,
    decidido_por: null,
    justificativa: null,
  })),
)
  .sort((a, b) => a.aberto_em.localeCompare(b.aberto_em))
  .map((a) => ({ ...a, alerta_id: novoIdAlerta() }));

export const ALERTAS_INICIAIS: Alerta[] = [...HISTORICO, ...ABERTOS];

// --- Ordens de serviço (fictícias) -----------------------------------------

const ROTINAS = ["P1", "P1", "P1", "P6", "P1", "P9"];
export const ORDENS: OrdemServico[] = [];
let seqOS = 880;
for (const e of ESCADAS) {
  const offset = Math.floor(rnd() * 25);
  for (let m = 0; m < 6; m++) {
    const ini = new Date(AGORA.getTime() - (offset + m * 30) * 86400000);
    ini.setHours(1, 0, 0, 0);
    const fim = new Date(ini.getTime() + (2 + Math.floor(rnd() * 3)) * 3600000);
    ORDENS.push({ os_id: `OS-${String(++seqOS).padStart(4, "0")}`, escada_id: e.escada_id, tipo: "preventiva", rotina: ROTINAS[m], aberta_em: isoLocal(ini), fechada_em: isoLocal(fim), descricao: `Preventiva ${ROTINAS[m]} conforme calendário`, equipe: pick(EQUIPES).nome });
  }
  if (rnd() < 0.35) {
    const ini = new Date(AGORA.getTime() - Math.floor(5 + rnd() * 170) * 86400000);
    ini.setHours(6 + Math.floor(rnd() * 14), 0, 0, 0);
    const fim = new Date(ini.getTime() + (1.5 + rnd() * 5) * 3600000);
    ORDENS.push({ os_id: `OS-${String(++seqOS).padStart(4, "0")}`, escada_id: e.escada_id, tipo: "corretiva", rotina: null, aberta_em: isoLocal(ini), fechada_em: isoLocal(fim), descricao: pick(["Parada por atuação do sensor de pente", "Troca de rolamento do motor", "Ajuste de corrente de tração", "Vazamento de óleo no redutor", "Falha na partida"]), equipe: pick(EQUIPES).nome });
  }
}
ORDENS.sort((a, b) => b.aberta_em.localeCompare(a.aberta_em));

// --- KPIs (fictícios, derivados das OS acima) ------------------------------

const corretivas = ORDENS.filter((o) => o.tipo === "corretiva");
const horasOS = (o: OrdemServico) => (new Date(o.fechada_em).getTime() - new Date(o.aberta_em).getTime()) / 3600000;
const limite30d = AGORA.getTime() - 30 * 86400000;
const parada30d = corretivas.filter((o) => new Date(o.aberta_em).getTime() >= limite30d).reduce((s, o) => s + horasOS(o), 0);

export const KPIS = {
  disponibilidade: 100 * (1 - parada30d / (ESCADAS.length * 30 * 20)), // 20 h de operação por dia
  mtbf_h: corretivas.length ? (ESCADAS.length * 180 * 20) / corretivas.length : 0,
  mttr_h: corretivas.length ? corretivas.reduce((s, o) => s + horasOS(o), 0) / corretivas.length : 0,
};
