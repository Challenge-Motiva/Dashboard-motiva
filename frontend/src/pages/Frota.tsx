import { useMemo, useState } from "react";
import { AtendimentoTag } from "../components/Atendimento";
import { MultiFiltro } from "../components/MultiFiltro";
import { StatusBadge, StatusIcon, ROTULO_NIVEL } from "../components/Status";
import { DIAGNOSTICOS, ESCADAS, ESTACOES, KPIS } from "../data/mock";
import type { Grupo, Nivel } from "../data/types";
import { haQuanto, num, rotuloGrupo } from "../lib/formato";
import { motivo } from "../lib/regras";
import { useStore } from "../lib/store";

const NIVEIS: Nivel[] = ["vermelho", "amarelo", "verde", "cinza"];
const GRUPOS: Grupo[] = ["Critica A", "Critica B", "Nao critica A", "Nao critica B"];
const META_DISP = 98;

/** Conjunto vazio = sem filtro (todos). */
const aceita = (s: Set<string>, v: string) => !s.size || s.has(v);
const alternado = (s: Set<string>, v: string) => {
  const n = new Set(s);
  if (n.has(v)) n.delete(v);
  else n.add(v);
  return n;
};

export function Frota() {
  const [grupos, setGrupos] = useState<Set<string>>(new Set());
  const [estacoes, setEstacoes] = useState<Set<string>>(new Set());
  const [status, setStatus] = useState<Set<string>>(new Set());
  const [todas, setTodas] = useState(false);
  const [comEquipe, setComEquipe] = useState(false);
  const { atendimentos } = useStore();
  // Reprovada volta para a fila, então não conta como "com equipe".
  const emAtendimento = (id: string) => !!atendimentos[id] && atendimentos[id].fase !== "reprovada";
  const qtdComEquipe = ESCADAS.filter((e) => emAtendimento(e.escada_id)).length;

  const filtradas = useMemo(
    () =>
      ESCADAS.filter((e) => aceita(grupos, e.grupo) && aceita(estacoes, e.estacao) && aceita(status, e.status) && (!comEquipe || emAtendimento(e.escada_id))).sort(
        (a, b) => b.score_criticidade - a.score_criticidade,
      ),
    [grupos, estacoes, status, comEquipe, atendimentos],
  );

  const contagem = (nivel: Nivel, lista = ESCADAS) => lista.filter((e) => e.status === nivel).length;
  const ranking = todas ? filtradas : filtradas.slice(0, 10);
  const temFiltro = grupos.size + estacoes.size + status.size > 0 || comEquipe;
  const alternarStatus = (n: Nivel) => setStatus((s) => alternado(s, n));
  const chips = [
    ...[...grupos].map((g) => ({ chave: `g-${g}`, rotulo: rotuloGrupo(g), tirar: () => setGrupos((s) => alternado(s, g)) })),
    ...[...estacoes].map((e) => ({ chave: `e-${e}`, rotulo: e, tirar: () => setEstacoes((s) => alternado(s, e)) })),
    ...(comEquipe ? [{ chave: "equipe", rotulo: "Com equipe", tirar: () => setComEquipe(false) }] : []),
    ...[...status].map((n) => ({
      chave: `s-${n}`,
      rotulo: (
        <>
          <StatusIcon nivel={n as Nivel} size={12} /> {ROTULO_NIVEL[n as Nivel]}
        </>
      ),
      tirar: () => alternarStatus(n as Nivel),
    })),
  ];

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
        <Kpi rotulo="Intervenção recomendada" valor={String(contagem("vermelho"))} nivel="vermelho" nota="escadas em vermelho" ativo={status.has("vermelho")} onClick={() => alternarStatus("vermelho")} />
        <Kpi rotulo="Em atenção" valor={String(contagem("amarelo"))} nivel="amarelo" nota="escadas em amarelo" ativo={status.has("amarelo")} onClick={() => alternarStatus("amarelo")} />
        <Kpi rotulo="Sem dados" valor={String(contagem("cinza"))} nivel="cinza" nota="sem leitura > 60 min" ativo={status.has("cinza")} onClick={() => alternarStatus("cinza")} />
        <Kpi rotulo="MTBF" valor={`${num(KPIS.mtbf_h, 0)} h`} nota="entre corretivas · fictício" />
        <Kpi rotulo="MTTR" valor={`${num(KPIS.mttr_h, 1)} h`} nota="por corretiva · fictício" />
      </section>

      <section className="filters" aria-label="Filtros">
        <MultiFiltro rotulo="Grupo" todos="Todos" opcoes={GRUPOS.map((g) => ({ valor: g, rotulo: rotuloGrupo(g) }))} selecionados={grupos} onChange={setGrupos} />
        <MultiFiltro
          rotulo="Estação"
          todos="Todas"
          opcoes={ESTACOES.map((s) => ({ valor: s.nome, rotulo: s.nome }))}
          selecionados={estacoes}
          onChange={setEstacoes}
        />
        <MultiFiltro
          rotulo="Status"
          todos="Todos"
          opcoes={NIVEIS.map((n) => ({
            valor: n,
            rotulo: (
              <>
                <StatusIcon nivel={n} size={12} /> {ROTULO_NIVEL[n]}
              </>
            ),
          }))}
          selecionados={status}
          onChange={setStatus}
        />
        <div className="multi">
          <span className="multi-label">Atendimento</span>
          <button className={`multi-btn multi-toggle ${comEquipe ? "has" : ""}`} aria-pressed={comEquipe} onClick={() => setComEquipe((v) => !v)} disabled={!qtdComEquipe && !comEquipe}>
            Com equipe <span className="mono muted">{qtdComEquipe}</span>
          </button>
        </div>
        {temFiltro && (
          <button
            className="btn-secondary"
            onClick={() => {
              setGrupos(new Set());
              setEstacoes(new Set());
              setStatus(new Set());
              setComEquipe(false);
            }}
          >
            Limpar filtros
          </button>
        )}
      </section>
      {chips.length > 0 && (
        <ul className="active-chips" aria-label="Filtros ativos">
          {chips.map((c) => (
            <li key={c.chave}>
              <button className="chip-x" onClick={c.tirar} aria-label="Remover filtro">
                {c.rotulo}
                <span aria-hidden="true">×</span>
              </button>
            </li>
          ))}
        </ul>
      )}

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
                      <a href={`#/escada/${e.escada_id}`} className="id-btn" onClick={(ev) => ev.stopPropagation()}>
                        {e.escada_id}
                      </a>
                      <div className="muted small">
                        {e.estacao} · {rotuloGrupo(e.grupo)}
                      </div>
                    </td>
                    <td>
                      <div className="status-cell">
                        <StatusBadge nivel={e.status} curto />
                        {atendimentos[e.escada_id] && <AtendimentoTag at={atendimentos[e.escada_id]} />}
                      </div>
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
            <span className="muted">clique para marcar uma ou várias</span>
          </div>
          <ul className="stations">
            {ESTACOES.map((s) => {
              const lista = ESCADAS.filter((e) => e.estacao === s.nome && aceita(grupos, e.grupo));
              const marcada = estacoes.has(s.nome);
              const pior = NIVEIS.find((n) => contagem(n, lista) > 0) ?? "verde";
              return (
                <li key={s.sigla}>
                  <button
                    className={`station ${marcada ? "active" : ""} station-${pior}`}
                    onClick={() => setEstacoes((sel) => alternado(sel, s.nome))}
                    aria-pressed={marcada}
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

function Kpi({ rotulo, valor, nota, nivel, ativo, onClick }: { rotulo: string; valor: string; nota: string; nivel?: Nivel; ativo?: boolean; onClick?: () => void }) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag className={`kpi ${onClick ? "kpi-click" : ""} ${ativo ? "kpi-on" : ""}`} onClick={onClick} aria-pressed={onClick ? !!ativo : undefined}>
      <span className="kpi-label">
        {nivel && <StatusIcon nivel={nivel} size={14} />}
        {rotulo}
      </span>
      <span className="kpi-value">{valor}</span>
      <span className="kpi-note">{nota}</span>
    </Tag>
  );
}
