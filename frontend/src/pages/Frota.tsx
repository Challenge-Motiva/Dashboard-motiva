import { useMemo, useState } from "react";
import { StatusBadge, StatusIcon, ROTULO_NIVEL } from "../components/Status";
import { DIAGNOSTICOS, ESCADAS, ESTACOES, KPIS } from "../data/mock";
import type { Grupo, Nivel } from "../data/types";
import { haQuanto, num, rotuloGrupo } from "../lib/formato";
import { motivo } from "../lib/regras";

const NIVEIS: Nivel[] = ["vermelho", "amarelo", "verde", "cinza"];
const GRUPOS: Grupo[] = ["Critica A", "Critica B", "Nao critica A", "Nao critica B"];
const META_DISP = 98;

export function Frota() {
  const [grupo, setGrupo] = useState<string>("");
  const [estacao, setEstacao] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [todas, setTodas] = useState(false);

  const filtradas = useMemo(
    () =>
      ESCADAS.filter((e) => (!grupo || e.grupo === grupo) && (!estacao || e.estacao === estacao) && (!status || e.status === status)).sort(
        (a, b) => b.score_criticidade - a.score_criticidade,
      ),
    [grupo, estacao, status],
  );

  const contagem = (nivel: Nivel, lista = ESCADAS) => lista.filter((e) => e.status === nivel).length;
  const ranking = todas ? filtradas : filtradas.slice(0, 10);
  const temFiltro = grupo || estacao || status;

  return (
    <>
      <header className="page-head">
        <div>
          <h1>Visão geral da frota</h1>
          <p className="sub">
            Linha 4-Amarela · amostra de {ESCADAS.length} escadas (proporção real dos 4 grupos de 197)
          </p>
        </div>
      </header>

      <section className="kpis" aria-label="Indicadores">
        <Kpi rotulo="Disponibilidade (30 dias)" valor={`${num(KPIS.disponibilidade, 2)}%`} nota={`Meta ${META_DISP}% · fictício`} />
        <Kpi rotulo="Intervenção recomendada" valor={String(contagem("vermelho"))} nivel="vermelho" nota="escadas em vermelho" onClick={() => setStatus("vermelho")} />
        <Kpi rotulo="Em atenção" valor={String(contagem("amarelo"))} nivel="amarelo" nota="escadas em amarelo" onClick={() => setStatus("amarelo")} />
        <Kpi rotulo="Sem dados" valor={String(contagem("cinza"))} nivel="cinza" nota="sem leitura > 60 min" onClick={() => setStatus("cinza")} />
        <Kpi rotulo="MTBF" valor={`${num(KPIS.mtbf_h, 0)} h`} nota="entre corretivas · fictício" />
        <Kpi rotulo="MTTR" valor={`${num(KPIS.mttr_h, 1)} h`} nota="por corretiva · fictício" />
      </section>

      <section className="filters" aria-label="Filtros">
        <label>
          Grupo
          <select value={grupo} onChange={(e) => setGrupo(e.target.value)}>
            <option value="">Todos</option>
            {GRUPOS.map((g) => (
              <option key={g} value={g}>
                {rotuloGrupo(g)}
              </option>
            ))}
          </select>
        </label>
        <label>
          Estação
          <select value={estacao} onChange={(e) => setEstacao(e.target.value)}>
            <option value="">Todas</option>
            {ESTACOES.map((s) => (
              <option key={s.sigla} value={s.nome}>
                {s.nome}
              </option>
            ))}
          </select>
        </label>
        <label>
          Status
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Todos</option>
            {NIVEIS.map((n) => (
              <option key={n} value={n}>
                {ROTULO_NIVEL[n]}
              </option>
            ))}
          </select>
        </label>
        {temFiltro && (
          <button
            className="btn-ghost"
            onClick={() => {
              setGrupo("");
              setEstacao("");
              setStatus("");
            }}
          >
            Limpar filtros
          </button>
        )}
      </section>

      <div className="frota-grid">
        <section className="panel">
          <div className="panel-head">
            <h2>{todas ? "Escadas por prioridade" : "Top 10 por prioridade"}</h2>
            <span className="muted">{filtradas.length} escadas no filtro</span>
          </div>
          <div className="table-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Escada</th>
                  <th>Status</th>
                  <th>Motivo</th>
                  <th className="num">Score</th>
                  <th>Última leitura</th>
                </tr>
              </thead>
              <tbody>
                {ranking.map((e, i) => (
                  <tr key={e.escada_id} className="row-link" onClick={() => (location.hash = `/escada/${e.escada_id}`)}>
                    <td className="muted mono">{i + 1}</td>
                    <td>
                      <a href={`#/escada/${e.escada_id}`} className="mono strong">
                        {e.escada_id}
                      </a>
                      <div className="muted small">
                        {e.estacao} · {rotuloGrupo(e.grupo)}
                      </div>
                    </td>
                    <td>
                      <StatusBadge nivel={e.status} curto />
                    </td>
                    <td className="motivo">{motivo(DIAGNOSTICOS[e.escada_id])}</td>
                    <td className="num mono">{num(e.score_criticidade, 2)}</td>
                    <td className={`small ${e.status === "cinza" ? "warn-text" : "muted"}`}>{haQuanto(e.ultima_leitura)}</td>
                  </tr>
                ))}
                {!ranking.length && (
                  <tr>
                    <td colSpan={6} className="empty">
                      Nenhuma escada neste filtro.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {filtradas.length > 10 && (
            <button className="btn-ghost" onClick={() => setTodas((v) => !v)}>
              {todas ? "Mostrar só o top 10" : `Ver todas as ${filtradas.length}`}
            </button>
          )}
        </section>

        <section className="panel">
          <div className="panel-head">
            <h2>Estações</h2>
            <span className="muted">clique para filtrar</span>
          </div>
          <ul className="stations">
            {ESTACOES.map((s) => {
              const lista = ESCADAS.filter((e) => e.estacao === s.nome && (!grupo || e.grupo === grupo));
              const pior = NIVEIS.find((n) => contagem(n, lista) > 0) ?? "verde";
              return (
                <li key={s.sigla}>
                  <button
                    className={`station ${estacao === s.nome ? "active" : ""} station-${pior}`}
                    onClick={() => setEstacao(estacao === s.nome ? "" : s.nome)}
                    aria-pressed={estacao === s.nome}
                  >
                    <span className="station-name">
                      <span className="mono muted">{s.sigla}</span> {s.nome}
                    </span>
                    <span className="station-counts">
                      {NIVEIS.map((n) =>
                        contagem(n, lista) ? (
                          <span key={n} className="count" title={ROTULO_NIVEL[n]}>
                            <StatusIcon nivel={n} size={12} />
                            {contagem(n, lista)}
                          </span>
                        ) : null,
                      )}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </>
  );
}

function Kpi({ rotulo, valor, nota, nivel, onClick }: { rotulo: string; valor: string; nota: string; nivel?: Nivel; onClick?: () => void }) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag className={`kpi ${onClick ? "kpi-click" : ""}`} onClick={onClick}>
      <span className="kpi-label">
        {nivel && <StatusIcon nivel={nivel} size={14} />}
        {rotulo}
      </span>
      <span className="kpi-value">{valor}</span>
      <span className="kpi-note">{nota}</span>
    </Tag>
  );
}
