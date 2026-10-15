import { useMemo, useState } from "react";
import { StatusIcon } from "../components/Status";
import { LIMITE_POR_SINAL } from "../data/limites";
import { ESCADA_POR_ID, EQUIPES, IDS_HISTORICO } from "../data/mock";
import { dataHora, rotuloGrupo } from "../lib/formato";
import { useStore } from "../lib/store";
import { ATENDIMENTO_MIN, BASE, NOME_BASE, planejarTurno } from "../lib/turno";

const INICIO_TURNO_MIN = 22 * 60; // turno noturno, fora do horário de pico

const hhmm = (min: number) => {
  const t = (INICIO_TURNO_MIN + min) % (24 * 60);
  return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
};
const nomeNo = (n: string) => (n === BASE ? "Base" : n);

export function Plano() {
  const { alertas, plano: aprovado, aprovarPlano, cancelarPlano } = useStore();
  const [horas, setHoras] = useState(aprovado?.horas ?? 6);
  const confirmados = alertas.filter((a) => a.status === "confirmado" && !IDS_HISTORICO.has(a.alerta_id));
  const plano = useMemo(() => planejarTurno(BASE, horas, confirmados, ESCADA_POR_ID), [horas, confirmados]);

  if (!confirmados.length) {
    return (
      <>
        <Cabecalho />
        <div className="panel empty">
          Nenhum alerta confirmado ainda. O plano só é montado a partir de alertas que o gestor confirmou.{" "}
          <a href="#/alertas">Ir para a central de alertas</a>
        </div>
      </>
    );
  }

  return (
    <>
      <Cabecalho />
      <section className="filters">
        <label>
          Base
          <select disabled>
            <option>{NOME_BASE}</option>
          </select>
        </label>
        <label>
          Duração do turno
          <select
            value={horas}
            onChange={(e) => {
              setHoras(Number(e.target.value));
              if (aprovado) cancelarPlano();
            }}
          >
            {[2, 4, 6, 8].map((h) => (
              <option key={h} value={h}>
                {h} h (22:00 – {hhmm(h * 60)})
              </option>
            ))}
          </select>
        </label>
        <span className="muted small">
          Atendimento estimado: {ATENDIMENTO_MIN.vermelho} min (vermelho), {ATENDIMENTO_MIN.amarelo} min (amarelo) · fictício
        </span>
      </section>

      <div className="two-col plan-cols">
        <section className="panel">
          <div className="panel-head">
            <h2>Ordem de atendimento</h2>
            <span className="muted small">
              {plano.paradas.length} parada{plano.paradas.length !== 1 ? "s" : ""} · {Math.floor(plano.totalMin / 60)} h {plano.totalMin % 60} min com retorno
            </span>
          </div>
          <ol className="stops">
            <li className="stop stop-base">
              <span className="stop-time mono">{hhmm(0)}</span>
              <span>Saída da {NOME_BASE}</span>
            </li>
            {plano.paradas.map((p, i) => (
              <li key={p.escada.escada_id} className="stop">
                <span className="stop-time mono">{hhmm(p.chegada)}</span>
                <div className="stop-body">
                  <div className="stop-title">
                    <span className="mono muted">{i + 1}.</span>
                    <StatusIcon nivel={p.nivel} size={14} />
                    <a href={`#/escada/${p.escada.escada_id}`} className="mono strong">
                      {p.escada.escada_id}
                    </a>
                    <span className="muted small">
                      {p.escada.estacao} · {rotuloGrupo(p.escada.grupo)}
                    </span>
                  </div>
                  <div className="small">{p.alertas.map((a) => LIMITE_POR_SINAL[a.sinal].rotulo).join(", ")}</div>
                  <div className="muted small">
                    Rota: {p.caminho.map(nomeNo).join(" → ")} ({p.deslocamento} min) · atendimento até {hhmm(p.saida)}
                  </div>
                </div>
              </li>
            ))}
            <li className="stop stop-base">
              <span className="stop-time mono">{hhmm(plano.totalMin)}</span>
              <span>
                Retorno à base ({plano.retorno.minutos} min)
              </span>
            </li>
          </ol>
          {plano.adiadas.length > 0 && (
            <div className="deferred">
              <h3>Não cabem neste turno</h3>
              <ul>
                {plano.adiadas.map((d) => (
                  <li key={d.escada.escada_id}>
                    <a href={`#/escada/${d.escada.escada_id}`} className="mono">
                      {d.escada.escada_id}
                    </a>{" "}
                    <span className="muted small">{d.escada.estacao} · fica para o próximo turno</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        <section className="panel">
          <h2>Aprovação do gestor</h2>
          {aprovado ? (
            <div className="approved">
              <p>
                <strong>Plano aprovado</strong> por {aprovado.por} em {dataHora(aprovado.em)}.
              </p>
              <p className="small">
                {EQUIPES[0].nome} acionada para {aprovado.escadas.length} escada{aprovado.escadas.length !== 1 ? "s" : ""} (simulado; notificação real fica para depois).
              </p>
              <button className="btn-ghost" onClick={cancelarPlano}>
                Revogar aprovação
              </button>
            </div>
          ) : (
            <>
              <p className="small">
                O plano é uma recomendação, gerada pela ordem de criticidade e pela menor rota (Dijkstra) a partir da base. A equipe só é acionada depois da sua aprovação.
              </p>
              <button className="btn" disabled={!plano.paradas.length} onClick={() => aprovarPlano(horas, plano.paradas.map((p) => p.escada.escada_id))}>
                Aprovar plano e acionar {EQUIPES[0].nome.split(" (")[0]}
              </button>
            </>
          )}
          <hr />
          <p className="muted small">
            Versão provisória de <code>planejar_turno(base, horas)</code>. A função oficial vem da disciplina de Dynamic Programming, com o mesmo grafo de estações da Linha 4. Tempos de deslocamento fictícios.
          </p>
        </section>
      </div>
    </>
  );
}

function Cabecalho() {
  return (
    <header className="page-head">
      <div>
        <h1>Plano do turno</h1>
        <p className="sub">Escadas com alerta confirmado, em ordem de atendimento, com rota a partir da base de manutenção.</p>
      </div>
    </header>
  );
}
