import { SignalChart } from "../components/SignalChart";
import { StatusBadge, StatusIcon } from "../components/Status";
import { LIMITES, LIMITE_POR_SINAL } from "../data/limites";
import { DIAGNOSTICOS, ESCADA_POR_ID, LEITURAS, ORDENS } from "../data/mock";
import { data, dataHora, haQuanto, num, rotuloGrupo } from "../lib/formato";
import { avaliar, motivo, textoViolacao } from "../lib/regras";
import { useStore } from "../lib/store";

export function Escada({ id }: { id: string }) {
  const { alertas } = useStore();
  const e = ESCADA_POR_ID[id];
  if (!e) {
    return (
      <div className="panel empty">
        Escada {id} não encontrada. <a href="#/">Voltar à frota</a>
      </div>
    );
  }
  const diag = DIAGNOSTICOS[id];
  const leituras = LEITURAS[id];
  const meusAlertas = alertas.filter((a) => a.escada_id === id).sort((a, b) => b.aberto_em.localeCompare(a.aberto_em));
  const minhasOS = ORDENS.filter((o) => o.escada_id === id);
  const abertos = meusAlertas.filter((a) => a.status === "aberto").length;

  return (
    <>
      <nav className="crumbs">
        <a href="#/">Frota</a> / <span>{e.estacao}</span> / <span className="mono">{e.escada_id}</span>
      </nav>

      <header className="page-head">
        <div>
          <h1 className="mono">{e.escada_id}</h1>
          <dl className="ident">
            <div>
              <dt>Estação</dt>
              <dd>{e.estacao}</dd>
            </div>
            <div>
              <dt>Acesso</dt>
              <dd>{e.acesso}</dd>
            </div>
            <div>
              <dt>Grupo</dt>
              <dd>{rotuloGrupo(e.grupo)}</dd>
            </div>
            <div>
              <dt>Fabricante</dt>
              <dd>{e.fabricante}</dd>
            </div>
            <div>
              <dt>Score</dt>
              <dd className="mono">{num(e.score_criticidade, 2)}</dd>
            </div>
          </dl>
        </div>
      </header>

      <section className={`status-block status-${e.status}`}>
        <StatusIcon nivel={e.status} size={28} />
        <div>
          <div className="status-line">
            <StatusBadge nivel={e.status} />
            <span className="muted small">Última leitura {haQuanto(e.ultima_leitura)} ({dataHora(e.ultima_leitura)})</span>
          </div>
          <p className="status-motivo">{motivo(diag)}</p>
          {diag.violacoes.length > 1 && (
            <ul className="violacoes">
              {diag.violacoes.slice(1).map((v) => (
                <li key={v.sinal}>
                  <StatusIcon nivel={v.nivel} size={12} /> {textoViolacao(v)}
                </li>
              ))}
            </ul>
          )}
          {abertos > 0 && (
            <a className="btn" href={`#/alertas?escada=${id}`}>
              Avaliar {abertos} alerta{abertos > 1 ? "s" : ""} na central
            </a>
          )}
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2>Sinais monitorados · últimos 7 dias</h2>
          <span className="muted small">
            Faixas: <span className="legend legend-verde">normal</span> <span className="legend legend-amarelo">atenção</span>{" "}
            <span className="legend legend-vermelho">intervenção</span> · limites provisórios
          </span>
        </div>
        <div className="charts">
          {LIMITES.map((l) => {
            const ult = leituras.at(-1);
            const v = ult ? ult[l.campo] : null;
            const nv = v === null || e.status === "cinza" ? "cinza" : avaliar(l, v).nivel;
            return (
              <figure key={l.sinal} className="chart-card">
                <figcaption>
                  <span>
                    <strong>{l.rotulo}</strong> <span className="muted small">· {l.monitora}</span>
                  </span>
                  <span className="chart-now">
                    <StatusIcon nivel={nv} size={12} />
                    <span className="mono">{v === null ? "–" : `${num(v, l.casas)} ${l.unidade}`}</span>
                  </span>
                </figcaption>
                <SignalChart leituras={leituras} limite={LIMITE_POR_SINAL[l.sinal]} />
                <details className="table-view">
                  <summary>Ver dados (últimas 12 leituras)</summary>
                  <table className="tbl compact">
                    <tbody>
                      {leituras
                        .slice(-12)
                        .reverse()
                        .map((r) => (
                          <tr key={r.timestamp}>
                            <td className="muted">{dataHora(r.timestamp)}</td>
                            <td className="num mono">
                              {num(r[l.campo], l.casas)} {l.unidade}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </details>
              </figure>
            );
          })}
        </div>
      </section>

      <div className="two-col">
        <section className="panel">
          <h2>Histórico de alertas</h2>
          <div className="table-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Alerta</th>
                  <th>Sinal</th>
                  <th className="num">Valor / limite</th>
                  <th>Aberto em</th>
                  <th>Decisão</th>
                </tr>
              </thead>
              <tbody>
                {meusAlertas.map((a) => {
                  const l = LIMITE_POR_SINAL[a.sinal];
                  return (
                    <tr key={a.alerta_id}>
                      <td className="mono">
                        <StatusIcon nivel={a.nivel} size={12} /> {a.alerta_id}
                      </td>
                      <td>{l.rotulo}</td>
                      <td className="num mono">
                        {num(a.valor, l.casas)} / {num(a.limite, l.casas)} {l.unidade}
                      </td>
                      <td className="muted small">{dataHora(a.aberto_em)}</td>
                      <td className="small">
                        {a.status === "aberto" ? (
                          <a href={`#/alertas?escada=${id}`}>Aguardando gestor</a>
                        ) : (
                          <span title={a.justificativa ?? ""}>
                            {a.status === "confirmado" ? "Confirmado" : "Descartado"} por {a.decidido_por}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {!meusAlertas.length && (
                  <tr>
                    <td colSpan={5} className="empty">
                      Sem alertas registrados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="panel">
          <h2>Histórico de manutenções</h2>
          <div className="table-wrap scroll-y">
            <table className="tbl">
              <thead>
                <tr>
                  <th>OS</th>
                  <th>Tipo</th>
                  <th>Descrição</th>
                  <th>Data</th>
                </tr>
              </thead>
              <tbody>
                {minhasOS.map((o) => (
                  <tr key={o.os_id}>
                    <td className="mono">{o.os_id}</td>
                    <td>
                      <span className={`tag ${o.tipo === "corretiva" ? "tag-strong" : ""}`}>{o.tipo === "corretiva" ? "Corretiva" : `Preventiva ${o.rotina}`}</span>
                    </td>
                    <td className="small">{o.descricao}</td>
                    <td className="muted small">{data(o.aberta_em)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="muted small">Histórico fictício para o protótipo.</p>
        </section>
      </div>

      <section className="panel not-monitored">
        <h2>Não monitorado pelos dados atuais</h2>
        <p className="small">
          Estes itens <strong>não</strong> aparecem no dataset e continuam dependendo de inspeção física e das preventivas obrigatórias:
        </p>
        <ul className="chips">
          <li>Corrimão</li>
          <li>Freio</li>
          <li>Trincas estruturais</li>
          <li>Roletes danificados</li>
        </ul>
        <p className="muted small">Roadmap: kit de retrofit multimarca com sensores adicionais (fora do MVP).</p>
      </section>
    </>
  );
}
