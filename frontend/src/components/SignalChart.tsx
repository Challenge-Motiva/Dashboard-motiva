import { useEffect, useRef, useState } from "react";
import type { Limite } from "../data/limites";
import type { Leitura } from "../data/types";
import { AGORA, dataHora, num } from "../lib/formato";
import { avaliar } from "../lib/regras";
import { StatusIcon } from "./Status";

const ALTURA = 150;
const M = { top: 8, right: 44, bottom: 22, left: 40 };
const JANELA_MS = 7 * 86400000;

interface Faixa {
  de: number;
  ate: number;
  nivel: "verde" | "amarelo" | "vermelho";
}

function faixas(l: Limite): Faixa[] {
  const [lo, hi] = l.escala;
  if (l.tipo === "max")
    return [
      { de: lo, ate: l.amarelo, nivel: "verde" },
      { de: l.amarelo, ate: l.vermelho, nivel: "amarelo" },
      { de: l.vermelho, ate: hi, nivel: "vermelho" },
    ];
  if (l.tipo === "min")
    return [
      { de: lo, ate: l.vermelho, nivel: "vermelho" },
      { de: l.vermelho, ate: l.amarelo, nivel: "amarelo" },
      { de: l.amarelo, ate: hi, nivel: "verde" },
    ];
  const n = l.nominal ?? 0;
  return [
    { de: lo, ate: n - l.vermelho, nivel: "vermelho" },
    { de: n - l.vermelho, ate: n - l.amarelo, nivel: "amarelo" },
    { de: n - l.amarelo, ate: n + l.amarelo, nivel: "verde" },
    { de: n + l.amarelo, ate: n + l.vermelho, nivel: "amarelo" },
    { de: n + l.vermelho, ate: hi, nivel: "vermelho" },
  ];
}

function limitesVisiveis(l: Limite): number[] {
  if (l.tipo !== "faixa") return [l.amarelo, l.vermelho];
  const n = l.nominal ?? 0;
  return [n - l.vermelho, n - l.amarelo, n + l.amarelo, n + l.vermelho];
}

export function SignalChart({ leituras, limite }: { leituras: Leitura[]; limite: Limite }) {
  const ref = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(480);
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(260, e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const t0 = AGORA.getTime() - JANELA_MS;
  const [lo, hi] = limite.escala;
  const iw = w - M.left - M.right;
  const ih = ALTURA - M.top - M.bottom;
  const x = (ts: string) => M.left + ((new Date(ts).getTime() - t0) / JANELA_MS) * iw;
  const y = (v: number) => M.top + (1 - (Math.min(hi, Math.max(lo, v)) - lo) / (hi - lo)) * ih;

  const pts = leituras.filter((l) => new Date(l.timestamp).getTime() >= t0);
  const d = pts.map((p, i) => `${i ? "L" : "M"}${x(p.timestamp).toFixed(1)},${y(p[limite.campo]).toFixed(1)}`).join("");

  const dias: Date[] = [];
  for (let k = 0; k <= 7; k++) {
    const dd = new Date(t0 + k * 86400000);
    dd.setHours(0, 0, 0, 0);
    if (dd.getTime() > t0) dias.push(dd);
  }
  const ticksY = [lo, (lo + hi) / 2, hi];

  function onMove(ev: React.PointerEvent<SVGSVGElement>) {
    if (!pts.length) return;
    const r = ev.currentTarget.getBoundingClientRect();
    const px = ev.clientX - r.left;
    let best = 0;
    let bd = Infinity;
    pts.forEach((p, i) => {
      const dx = Math.abs(x(p.timestamp) - px);
      if (dx < bd) {
        bd = dx;
        best = i;
      }
    });
    setHover(best);
  }

  const hp = hover !== null ? pts[hover] : null;
  const hv = hp ? hp[limite.campo] : 0;
  const hn = hp ? avaliar(limite, hv).nivel : "verde";
  const ultimo = pts.at(-1);

  return (
    <div className="chart" ref={ref}>
      <svg
        width={w}
        height={ALTURA}
        role="img"
        aria-label={`${limite.rotulo} nos últimos 7 dias`}
        onPointerMove={onMove}
        onPointerLeave={() => setHover(null)}
      >
        {faixas(limite).map((f, i) => (
          <rect key={i} x={M.left} width={iw} y={y(f.ate)} height={Math.max(0, y(f.de) - y(f.ate))} className={`band band-${f.nivel}`} />
        ))}
        {ticksY.map((v) => (
          <g key={v}>
            <line x1={M.left} x2={M.left + iw} y1={y(v)} y2={y(v)} className="grid" />
            <text x={M.left - 6} y={y(v) + 4} textAnchor="end" className="tick">
              {num(v, limite.casas > 1 ? 2 : 0)}
            </text>
          </g>
        ))}
        {limitesVisiveis(limite).map((v) => (
          <g key={v}>
            <line x1={M.left} x2={M.left + iw} y1={y(v)} y2={y(v)} className="thresh" />
            <text x={M.left + iw + 4} y={y(v) + 4} className="tick">
              {num(v, limite.casas)}
            </text>
          </g>
        ))}
        {dias.map((dd) => (
          <g key={dd.getTime()}>
            <line x1={x(dd.toISOString())} x2={x(dd.toISOString())} y1={M.top + ih} y2={M.top + ih + 4} className="axis" />
            <text x={x(dd.toISOString())} y={ALTURA - 6} textAnchor="middle" className="tick">
              {`${String(dd.getDate()).padStart(2, "0")}/${String(dd.getMonth() + 1).padStart(2, "0")}`}
            </text>
          </g>
        ))}
        <line x1={M.left} x2={M.left + iw} y1={M.top + ih} y2={M.top + ih} className="axis" />
        <path d={d} className="series" />
        {ultimo && <circle cx={x(ultimo.timestamp)} cy={y(ultimo[limite.campo])} r={4} className="dot" />}
        {hp && (
          <g>
            <line x1={x(hp.timestamp)} x2={x(hp.timestamp)} y1={M.top} y2={M.top + ih} className="crosshair" />
            <circle cx={x(hp.timestamp)} cy={y(hv)} r={4.5} className="dot" />
          </g>
        )}
        {!pts.length && (
          <text x={M.left + iw / 2} y={M.top + ih / 2} textAnchor="middle" className="tick">
            Sem leituras no período
          </text>
        )}
      </svg>
      {hp && (
        <div className="tooltip" style={{ left: Math.min(w - 170, Math.max(0, x(hp.timestamp) + 10)), top: 4 }}>
          <div className="tt-time">{dataHora(hp.timestamp)}</div>
          <div className="tt-val">
            <StatusIcon nivel={hn} size={12} /> {num(hv, limite.casas)} {limite.unidade}
          </div>
        </div>
      )}
    </div>
  );
}
