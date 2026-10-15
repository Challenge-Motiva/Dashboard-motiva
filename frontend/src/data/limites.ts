import type { CampoLeitura, Sinal } from "./types";

/**
 * Limites PROVISÓRIOS. Serão substituídos pelos limites derivados da EDA de Data Science.
 * - max: alerta quando o valor sobe acima do limite
 * - min: alerta quando o valor cai abaixo do limite
 * - faixa: alerta quando o desvio absoluto em relação ao nominal passa do limite
 */
export interface Limite {
  sinal: Sinal;
  rotulo: string;
  monitora: string;
  unidade: string;
  campo: CampoLeitura;
  tipo: "max" | "min" | "faixa";
  amarelo: number;
  vermelho: number;
  nominal?: number;
  escala: [number, number];
  casas: number;
}

export const LIMITES: Limite[] = [
  { sinal: "vibracao", rotulo: "Vibração", monitora: "Motor e redutor", unidade: "mm/s", campo: "vibracao_mm_s", tipo: "max", amarelo: 3.0, vermelho: 4.5, escala: [0, 6], casas: 1 },
  { sinal: "temperatura", rotulo: "Temperatura", monitora: "Componentes mecânicos", unidade: "°C", campo: "temperatura_c", tipo: "max", amarelo: 70, vermelho: 85, escala: [30, 100], casas: 1 },
  { sinal: "corrente", rotulo: "Corrente", monitora: "Sistema elétrico", unidade: "A", campo: "corrente_a", tipo: "max", amarelo: 22, vermelho: 26, escala: [5, 30], casas: 1 },
  { sinal: "tensao", rotulo: "Tensão", monitora: "Sistema elétrico", unidade: "V", campo: "tensao_v", tipo: "faixa", nominal: 380, amarelo: 19, vermelho: 38, escala: [320, 440], casas: 0 },
  { sinal: "nivel_oleo", rotulo: "Nível de óleo", monitora: "Lubrificação", unidade: "%", campo: "nivel_oleo_pct", tipo: "min", amarelo: 40, vermelho: 25, escala: [0, 100], casas: 0 },
  { sinal: "velocidade", rotulo: "Velocidade", monitora: "Movimentação dos degraus", unidade: "m/s", campo: "velocidade_m_s", tipo: "faixa", nominal: 0.5, amarelo: 0.02, vermelho: 0.04, escala: [0.44, 0.56], casas: 3 },
];

export const LIMITE_POR_SINAL: Record<Sinal, Limite> = Object.fromEntries(
  LIMITES.map((l) => [l.sinal, l]),
) as Record<Sinal, Limite>;
