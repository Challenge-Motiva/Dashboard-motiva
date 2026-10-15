import { useState } from "react";
import { StatusIcon } from "../components/Status";
import { LIMITE_POR_SINAL } from "../data/limites";
import { ESCADA_POR_ID, IDS_HISTORICO } from "../data/mock";
import type { Alerta } from "../data/types";
import { dataHora, haQuanto, num, rotuloGrupo } from "../lib/formato";
import { GESTOR, useStore } from "../lib/store";

const MIN_JUSTIFICATIVA = 10;

/** Ordem da fila: nível do alerta, depois criticidade da escada (crítica antes de não crítica). */
function ordenar(a: Alerta, b: Alerta) {
  const n = (x: Alerta) => (x.nivel === "vermelho" ? 1 : 0);
  return n(b) - n(a) || ESCADA_POR_ID[b.escada_id].score_criticidade - ESCADA_POR_ID[a.escada_id].score_criticidade;
}

export function Alertas({ escadaFiltro }: { escadaFiltro?: string }) {
  const { alertas } = useStore();
  const [aba, setAba] = useState<"abertos" | "decididos">("abertos");
  const filtro = (a: Alerta) => !escadaFiltro || a.escada_id === escadaFiltro;
  const abertos = alertas.filter((a) => a.status === "aberto" && filtro(a)).sort(ordenar);
  const decididos = alertas
    .filter((a) => a.status !== "aberto" && filtro(a))
    .sort((a, b) => (b.decidido_em ?? "").localeCompare(a.decidido_em ?? ""));

  return (
    <>
      <header className="page-head">
        <div>
          <h1>Central de alertas</h1>
          <p className="sub">
            O sistema recomenda; a decisão é do gestor. Nenhuma equipe é acionada sem confirmação com justificativa.
          </p>
        </div>
      </header>

      {escadaFiltro && (
        <div className="filter-chip">
          Mostrando só <span className="mono">{escadaFiltro}</span> · <a href="#/alertas">ver todos</a>
        </div>
      )}

      <div className="tabs" role="tablist">
        <button role="tab" aria-selected={aba === "abertos"} className={aba === "abertos" ? "on" : ""} onClick={() => setAba("abertos")}>
          Fila aberta <span className="pill">{abertos.length}</span>
        </button>
        <button role="tab" aria-selected={aba === "decididos"} className={aba === "decididos" ? "on" : ""} onClick={() => setAba("decididos")}>
          Decididos <span className="pill">{decididos.length}</span>
        </button>
      </div>

      {aba === "abertos" ? (
        <section className="queue">
          {abertos.map((a, i) => (
            <CartaoAlerta key={a.alerta_id} alerta={a} posicao={i + 1} />
          ))}
          {!abertos.length && (
            <div className="panel empty">
              Fila vazia. {decididos.length > 0 && <a href="#/plano">Ver o plano do turno</a>}
            </div>
          )}
        </section>
      ) : (
        <section className="panel">
          <div className="table-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Alerta</th>
                  <th>Escada</th>
                  <th>Sinal</th>
                  <th>Decisão</th>
                  <th>Justificativa</th>
                  <th>Quem / quando</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {decididos.map((a) => (
                  <LinhaDecidida key={a.alerta_id} a={a} />
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </>
  );
}

function CartaoAlerta({ alerta: a, posicao }: { alerta: Alerta; posicao: number }) {
  const { decidir } = useStore();
  const [acao, setAcao] = useState<null | "confirmado" | "descartado">(null);
  const [texto, setTexto] = useState("");
  const e = ESCADA_POR_ID[a.escada_id];
  const l = LIMITE_POR_SINAL[a.sinal];
  const pct = Math.max(1, Math.round((Math.abs(a.valor - a.limite) / a.limite) * 100));
  const direcao = l.tipo === "min" || (l.tipo === "faixa" && a.valor < (l.nominal ?? 0)) ? "abaixo" : "acima";
  const valido = texto.trim().length >= MIN_JUSTIFICATIVA;

  return (
    <article className={`alert-card alert-${a.nivel}`}>
      <div className="alert-rank mono">{posicao}</div>
      <div className="alert-main">
        <div className="alert-top">
          <StatusIcon nivel={a.nivel} size={18} />
          <strong>{a.nivel === "vermelho" ? "Intervenção recomendada" : "Atenção"}</strong>
          <span className="mono muted">{a.alerta_id}</span>
          <a href={`#/escada/${e.escada_id}`} className="mono strong">
            {e.escada_id}
          </a>
          <span className="muted small">
            {e.estacao} · {rotuloGrupo(e.grupo)}
          </span>
        </div>
        <div className="evidence">
          <div>
            <span className="ev-label">Sinal</span>
            <span>{l.rotulo}</span>
          </div>
          <div>
            <span className="ev-label">Valor</span>
            <span className="mono">
              {num(a.valor, l.casas)} {l.unidade}
            </span>
          </div>
          <div>
            <span className="ev-label">Limite ({a.nivel})</span>
            <span className="mono">
              {num(a.limite, l.casas)} {l.unidade}
            </span>
          </div>
          <div>
            <span className="ev-label">Desvio</span>
            <span className="mono">
              {pct}% {direcao}
            </span>
          </div>
          <div>
            <span className="ev-label">Ativo</span>
            <span>
              {haQuanto(a.aberto_em).replace("há ", "")} <span className="muted small">desde {dataHora(a.aberto_em)}</span>
            </span>
          </div>
        </div>

        {acao ? (
          <form
            className="decision"
            onSubmit={(ev) => {
              ev.preventDefault();
              if (valido) decidir(a.alerta_id, acao, texto.trim());
            }}
          >
            <label htmlFor={`j-${a.alerta_id}`}>
              Justificativa para <strong>{acao === "confirmado" ? "confirmar" : "descartar"}</strong> (obrigatória)
            </label>
            <textarea
              id={`j-${a.alerta_id}`}
              value={texto}
              autoFocus
              rows={2}
              placeholder={acao === "confirmado" ? "Ex.: tendência de alta há 3 dias; inspecionar rolamentos fora do pico." : "Ex.: pico isolado por evento; sem tendência."}
              onChange={(ev) => setTexto(ev.target.value)}
            />
            <div className="decision-foot">
              <span className="muted small">
                Registrado como <strong>{GESTOR}</strong> · {valido ? "pronto" : `mínimo ${MIN_JUSTIFICATIVA} caracteres`}
              </span>
              <span className="btns">
                <button type="button" className="btn-ghost" onClick={() => setAcao(null)}>
                  Cancelar
                </button>
                <button type="submit" className={acao === "confirmado" ? "btn" : "btn-secondary"} disabled={!valido}>
                  {acao === "confirmado" ? "Confirmar alerta" : "Descartar alerta"}
                </button>
              </span>
            </div>
          </form>
        ) : (
          <div className="alert-actions">
            <button className="btn" onClick={() => setAcao("confirmado")}>
              Confirmar
            </button>
            <button className="btn-secondary" onClick={() => setAcao("descartado")}>
              Descartar
            </button>
            <span className="muted small">Confirmar envia a escada para o plano do turno, sujeito à sua aprovação final.</span>
          </div>
        )}
      </div>
    </article>
  );
}

function LinhaDecidida({ a }: { a: Alerta }) {
  const { desfazer } = useStore();
  const e = ESCADA_POR_ID[a.escada_id];
  const l = LIMITE_POR_SINAL[a.sinal];
  const historico = IDS_HISTORICO.has(a.alerta_id);
  return (
    <tr>
      <td className="mono">
        <StatusIcon nivel={a.nivel} size={12} /> {a.alerta_id}
      </td>
      <td>
        <a href={`#/escada/${e.escada_id}`} className="mono">
          {e.escada_id}
        </a>
      </td>
      <td>
        {l.rotulo}{" "}
        <span className="muted small mono">
          {num(a.valor, l.casas)}/{num(a.limite, l.casas)}
        </span>
      </td>
      <td>
        <span className={`tag ${a.status === "confirmado" ? "tag-strong" : ""}`}>{a.status === "confirmado" ? "Confirmado" : "Descartado"}</span>
      </td>
      <td className="small">{a.justificativa}</td>
      <td className="muted small">
        {a.decidido_por}
        <br />
        {a.decidido_em ? dataHora(a.decidido_em) : ""}
      </td>
      <td>
        {!historico && (
          <button className="btn-ghost small" onClick={() => desfazer(a.alerta_id)}>
            Desfazer
          </button>
        )}
      </td>
    </tr>
  );
}
