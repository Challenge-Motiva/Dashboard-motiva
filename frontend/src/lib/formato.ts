/** Relógio simulado: os dados fictícios são gerados até este instante. */
export const AGORA = new Date("2026-10-11T16:45:00");

const pad = (n: number) => String(n).padStart(2, "0");

/** ISO local sem fuso, no formato do contrato de dados (2026-10-11T16:40:00). */
export function isoLocal(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export function minutosDesde(iso: string, ref: Date = AGORA): number {
  return Math.max(0, Math.round((ref.getTime() - new Date(iso).getTime()) / 60000));
}

export function haQuanto(iso: string): string {
  const m = minutosDesde(iso);
  if (m < 60) return `há ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 48) return `há ${h} h`;
  return `há ${Math.floor(h / 24)} dias`;
}

export function num(v: number, casas = 1): string {
  return v.toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas });
}

export function dataHora(iso: string): string {
  const d = new Date(iso);
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function data(iso: string): string {
  const d = new Date(iso);
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

export function rotuloGrupo(g: string): string {
  return g.replace("Critica", "Crítica").replace("Nao critica", "Não crítica");
}
