// Nomes alinhados com DDD Java e Database: Estacao, EscadaRolante, Leitura, Alerta, OrdemServico, Equipe.

export type Nivel = "verde" | "amarelo" | "vermelho" | "cinza";
export type Grupo = "Critica A" | "Critica B" | "Nao critica A" | "Nao critica B";
export type Sinal = "vibracao" | "temperatura" | "corrente" | "tensao" | "nivel_oleo" | "velocidade";

export interface Estacao {
  sigla: string;
  nome: string;
  ordem: number;
}

export interface EscadaRolante {
  escada_id: string;
  estacao: string;
  linha: string;
  grupo: Grupo;
  fabricante: string;
  acesso: string;
  status: Nivel;
  score_criticidade: number;
  ultima_leitura: string;
}

export interface Leitura {
  escada_id: string;
  timestamp: string;
  vibracao_mm_s: number;
  temperatura_c: number;
  corrente_a: number;
  tensao_v: number;
  nivel_oleo_pct: number;
  velocidade_m_s: number;
}

export type CampoLeitura = Exclude<keyof Leitura, "escada_id" | "timestamp">;

export interface Alerta {
  alerta_id: string;
  escada_id: string;
  sinal: Sinal;
  valor: number;
  limite: number;
  nivel: "amarelo" | "vermelho";
  status: "aberto" | "confirmado" | "descartado";
  aberto_em: string;
  decidido_por: string | null;
  decidido_em?: string | null;
  justificativa: string | null;
}

export interface OrdemServico {
  os_id: string;
  escada_id: string;
  tipo: "preventiva" | "corretiva";
  rotina: string | null;
  aberta_em: string;
  fechada_em: string;
  descricao: string;
  equipe: string;
}

export interface Equipe {
  equipe_id: string;
  nome: string;
  base: string;
  turno: "diurno" | "noturno";
  especialidade: string;
  tecnicos: string[];
}
