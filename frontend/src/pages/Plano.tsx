import { useEffect, useMemo, useRef, useState } from "react";
import { AcoesAtendimento, AtendimentoTag } from "../components/Atendimento";
import { StatusIcon } from "../components/Status";
import { LIMITE_POR_SINAL } from "../data/limites";
import { ESCADA_POR_ID, EQUIPES, IDS_HISTORICO } from "../data/mock";
import type { Equipe } from "../data/types";
import { dataHora, rotuloGrupo } from "../lib/formato";
import { type OrdemAprovada, type ParadaOrdem, useStore } from "../lib/store";
import { ATENDIMENTO_MIN, BASE, horaTurno, NOME_BASE, planejarTurno, type Plano as PlanoTurno } from "../lib/turno";

const hhmm = horaTurno;
const nomeNo = (n: string) => (n === BASE ? "Base" : n);
const ordinal = (n: number) => `${n}ª ordem`;

/** Última parada da equipe no turno: a próxima ordem sai dali, sem voltar à base no meio. */
function ultimaParada(ordens: OrdemAprovada[], equipe_id: string): ParadaOrdem | null {
  const dela = ordens.filter((o) => o.equipe_id === equipe_id);
  if (!dela.length) return null;
  const paradas = dela[dela.length - 1].paradas;
  return paradas[paradas.length - 1] ?? null;
}

export function Plano() {
  const { alertas, ordens, atendimentos, acionarEquipe, cancelarOrdem } = useStore();
  const [horas, setHoras] = useState(6);
  const confirmados = useMemo(() => alertas.filter((a) => a.status === "confirmado" && !IDS_HISTORICO.has(a.alerta_id)), [alertas]);
  // Escadas que já estão com uma equipe saem do planejamento; reparo reprovado volta para a fila.
  const pendentes = useMemo(() => confirmados.filter((a) => !atendimentos[a.escada_id] || atendimentos[a.escada_id].fase === "reprovada"), [confirmados, atendimentos]);
  const aValidar = Object.values(atendimentos).filter((a) => a.fase === "concluida").length;
  const previa = useMemo(() => planejarTurno(BASE, horas, pendentes, ESCADA_POR_ID), [horas, pendentes]);
  const recomendada = recomendar(previa);
  const [equipe, setEquipe] = useState<string | null>(null);
  const [confirmando, setConfirmando] = useState(false);
  const escolhida = EQUIPES.find((e) => e.equipe_id === (equipe ?? recomendada));
  // Equipe já em campo emenda a nova ordem: sai da última estação atendida, na hora em que termina lá.
  const anterior = escolhida ? ultimaParada(ordens, escolhida.equipe_id) : null;
  const inicio = anterior?.saida ?? 0;
  const origem = anterior?.estacao ?? BASE;
  const plano = useMemo(
    () => planejarTurno(BASE, Math.max(0, horas * 60 - inicio) / 60, pendentes, ESCADA_POR_ID, origem),
    [horas, inicio, origem, pendentes],
  );
  const seq = escolhida ? ordens.filter((o) => o.equipe_id === escolhida.equipe_id).length + 1 : 1;
  const t = (min: number) => hhmm(inicio + min);

  if (!confirmados.length && !ordens.length) {
    return (
      <>
        <Cabecalho />
        <div className="panel empty">
          <p>Nenhum alerta confirmado ainda. O plano só é montado a partir de alertas que o gestor confirmou.</p>
          <a className="btn" href="#/alertas">
            Ir para a central de alertas →
          </a>
        </div>
      </>
    );
  }

  return (
    <>
      <Cabecalho />
      {ordens.length > 0 && (
        <section className="orders" aria-live="polite">
          <h2>
            Equipes em campo{" "}
            <span className="muted small">
              · {ordens.length} ordem{ordens.length !== 1 ? "s" : ""} despachada{ordens.length !== 1 ? "s" : ""}
            </span>
          </h2>
          {aValidar > 0 && (
            <p className="validate-note" role="status">
              <strong>
                {aValidar} reparo{aValidar !== 1 ? "s" : ""} aguardando sua validação.
              </strong>{" "}
              Valide para encerrar o atendimento ou reprove para a escada voltar ao plano.
            </p>
          )}
          {ordens.map((o, i) => {
            const eq = EQUIPES.find((e) => e.equipe_id === o.equipe_id);
            if (!eq) return null;
            const n = ordens.slice(0, i + 1).filter((x) => x.equipe_id === o.equipe_id).length;
            const temSeguinte = ordens.slice(i + 1).some((x) => x.equipe_id === o.equipe_id);
            return (
              <Despacho
                key={o.ordem_id}
                ordem={o}
                equipe={eq}
                n={n}
                seguinte={temSeguinte ? n + 1 : null}
                recente={i === ordens.length - 1}
                onCancelar={() => cancelarOrdem(o.ordem_id)}
              />
            );
          })}
        </section>
      )}

      {!pendentes.length ? (
        <div className="panel empty">
          <p>Todas as escadas com alerta confirmado já estão com uma equipe. Confirme novos alertas para montar a próxima ordem; a mesma equipe pode receber outra.</p>
          <div className="empty-actions">
            <a className="btn" href="#/alertas">
              Ir para a central de alertas →
            </a>
            <a className="btn-secondary" href="#/">
              Visão da frota
            </a>
          </div>
        </div>
      ) : (
        <>
          <section className="filters">
            <label>
              Base
              <select disabled>
                <option>{NOME_BASE}</option>
              </select>
            </label>
            <label>
              Duração do turno
              <select value={horas} onChange={(e) => setHoras(Number(e.target.value))}>
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
                <h2>{ordens.length ? "Próxima ordem" : "Ordem de atendimento"}</h2>
                <span className="muted small">
                  {plano.paradas.length} parada{plano.paradas.length !== 1 ? "s" : ""} · {Math.floor(plano.totalMin / 60)} h {plano.totalMin % 60} min com retorno
                </span>
              </div>
              <ol className="stops">
                <li className="stop stop-base">
                  <span className="stop-time mono">{t(0)}</span>
                  {anterior && escolhida ? (
                    <span>
                      Continua de {origem}
                      <span className="muted small"> · a {escolhida.nome} emenda na {ordinal(seq - 1)}, sem voltar à base</span>
                    </span>
                  ) : (
                    <span>Saída da {NOME_BASE}</span>
                  )}
                </li>
                {plano.paradas.map((p, i) => (
                  <li key={p.escada.escada_id} className="stop">
                    <span className="stop-time mono">{t(p.chegada)}</span>
                    <div className="stop-body">
                      <div className="stop-title">
                        <span className="mono muted">{i + 1}.</span>
                        <StatusIcon nivel={p.nivel} size={14} />
                        <a href={`#/escada/${p.escada.escada_id}`} className="id-btn">
                          {p.escada.escada_id}
                        </a>
                        <span className="muted small">
                          {p.escada.estacao} · {rotuloGrupo(p.escada.grupo)}
                        </span>
                      </div>
                      <div className="small">{p.alertas.map((a) => LIMITE_POR_SINAL[a.sinal].rotulo).join(", ")}</div>
                      <div className="muted small">
                        Rota: {p.caminho.map(nomeNo).join(" → ")} ({p.deslocamento} min) · atendimento até {t(p.saida)}
                      </div>
                    </div>
                  </li>
                ))}
                <li className="stop stop-base">
                  <span className="stop-time mono">{t(plano.totalMin)}</span>
                  <span>Retorno à base ({plano.retorno.minutos} min)</span>
                </li>
              </ol>
              {plano.adiadas.length > 0 && (
                <div className="deferred">
                  <h3>{inicio > 0 ? "Não cabem no tempo que sobra desta equipe" : "Não cabem neste turno"}</h3>
                  <ul>
                    {plano.adiadas.map((d) => (
                      <li key={d.escada.escada_id}>
                        <a href={`#/escada/${d.escada.escada_id}`} className="id-btn">
                          {d.escada.escada_id}
                        </a>{" "}
                        <span className="muted small">
                          {d.escada.estacao} · {inicio > 0 ? "tente outra equipe ou o próximo turno" : "fica para o próximo turno"}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>

            <section className="panel">
              <h2>Aprovação do gestor</h2>
              <ol className="steps">
                <li>
                  <h3>
                    <span className="step-n">1</span> Escolha a equipe
                  </h3>
                  <div className="teams" role="radiogroup" aria-label="Equipe">
                    {EQUIPES.map((eq) => {
                      const qtd = ordens.filter((o) => o.equipe_id === eq.equipe_id).length;
                      const ultima = ultimaParada(ordens, eq.equipe_id);
                      return (
                        <CartaoEquipe
                          key={eq.equipe_id}
                          equipe={eq}
                          selecionada={escolhida?.equipe_id === eq.equipe_id}
                          recomendada={eq.equipe_id === recomendada}
                          fila={ultima ? { qtd, livre: `${hhmm(ultima.saida)} em ${ultima.estacao}`, esgotada: ultima.saida >= horas * 60 } : undefined}
                          onSelect={() => setEquipe(eq.equipe_id)}
                        />
                      );
                    })}
                  </div>
                </li>
                <li>
                  <h3>
                    <span className="step-n">2</span> Confira {seq > 1 ? `a ${ordinal(seq)}` : "o turno"}
                  </h3>
                  <Resumo plano={plano} inicio={inicio} />
                </li>
                <li>
                  <h3>
                    <span className="step-n">3</span> Aprove
                  </h3>
                  <button className="btn btn-big" disabled={!plano.paradas.length || !escolhida} onClick={() => setConfirmando(true)}>
                    Aprovar e acionar {escolhida?.nome ?? "equipe"}
                    {seq > 1 && ` · ${ordinal(seq)}`}
                  </button>
                  <p className="muted small">
                    O plano é uma recomendação (criticidade + menor rota por Dijkstra a partir da base). Nada é enviado antes da sua confirmação. Ordens já despachadas
                    continuam valendo quando você confirma novos alertas.
                  </p>
                </li>
              </ol>
              <hr />
              <p className="muted small">
                Versão provisória de <code>planejar_turno(base, horas)</code>. A função oficial vem da disciplina de Dynamic Programming, com o mesmo grafo de estações da Linha 4. Tempos de deslocamento fictícios.
              </p>
            </section>
          </div>
        </>
      )}

      {confirmando && escolhida && (
        <Confirmacao
          equipe={escolhida}
          plano={plano}
          horas={horas}
          inicio={inicio}
          origem={origem}
          seq={seq}
          onCancel={() => setConfirmando(false)}
          onConfirm={() => {
            acionarEquipe(
              escolhida.equipe_id,
              origem,
              plano.paradas.map((p) => ({ escada_id: p.escada.escada_id, estacao: p.escada.estacao, nivel: p.nivel, chegada: inicio + p.chegada, saida: inicio + p.saida })),
              inicio,
              inicio + plano.totalMin,
            );
            setConfirmando(false);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        />
      )}
    </>
  );
}

/** Sinais mecânicos vão para a equipe de mecânica pesada; elétricos e lubrificação, para a outra. */
const MECANICOS = new Set(["vibracao", "temperatura", "velocidade"]);

function recomendar(plano: PlanoTurno): string {
  const sinais = plano.paradas.flatMap((p) => p.alertas.map((a) => a.sinal));
  const mec = sinais.filter((s) => MECANICOS.has(s)).length;
  return mec >= sinais.length - mec ? "EQ-03" : "EQ-04";
}

function iniciais(nome: string) {
  return nome
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("");
}

interface Fila {
  qtd: number;
  livre: string;
  esgotada: boolean;
}

function CartaoEquipe({
  equipe,
  selecionada,
  recomendada,
  fila,
  onSelect,
}: {
  equipe: Equipe;
  selecionada?: boolean;
  recomendada?: boolean;
  fila?: Fila;
  onSelect?: () => void;
}) {
  const fora = equipe.turno !== "noturno";
  const indisponivel = fora || !!fila?.esgotada;
  const conteudo = (
    <>
      <span className="team-head">
        <strong>{equipe.nome}</strong>
        {recomendada && !fora && <span className="tag tag-brand">Recomendada</span>}
        <span className={`tag ${fora ? "" : "tag-outline"}`}>{fora ? "Fora do turno (diurno)" : fila ? "Em campo · noturno" : "Disponível · noturno"}</span>
      </span>
      <span className="small muted">{equipe.especialidade}</span>
      {fila && (
        <span className="small team-queue">
          {fila.qtd} ordem{fila.qtd !== 1 ? "s" : ""} na fila · {fila.esgotada ? "sem tempo restante no turno" : `livre às ${fila.livre} para a ${ordinal(fila.qtd + 1)}`}
        </span>
      )}
      <span className="team-people">
        {equipe.tecnicos.map((t) => (
          <span key={t} className="avatar sm" title={t}>
            {iniciais(t)}
          </span>
        ))}
        <span className="small muted">{equipe.tecnicos.length} técnicos</span>
      </span>
    </>
  );
  if (!onSelect) return <div className={`team ${selecionada ? "on" : ""}`}>{conteudo}</div>;
  return (
    <button type="button" role="radio" aria-checked={!!selecionada} disabled={indisponivel} className={`team ${selecionada ? "on" : ""} ${indisponivel ? "off" : ""}`} onClick={onSelect}>
      {conteudo}
    </button>
  );
}

function Resumo({ plano, inicio }: { plano: PlanoTurno; inicio: number }) {
  const vermelhas = plano.paradas.filter((p) => p.nivel === "vermelho").length;
  return (
    <div className="summary">
      <div>
        <span className="ev-label">Escadas</span>
        <span className="summary-v">{plano.paradas.length}</span>
      </div>
      <div>
        <span className="ev-label">
          <StatusIcon nivel="vermelho" size={11} /> Intervenção
        </span>
        <span className="summary-v">{vermelhas}</span>
      </div>
      <div>
        <span className="ev-label">
          <StatusIcon nivel="amarelo" size={11} /> Atenção
        </span>
        <span className="summary-v">{plano.paradas.length - vermelhas}</span>
      </div>
      <div>
        <span className="ev-label">Retorno</span>
        <span className="summary-v mono">{hhmm(inicio + plano.totalMin)}</span>
      </div>
      {plano.adiadas.length > 0 && (
        <div>
          <span className="ev-label">Adiadas</span>
          <span className="summary-v">{plano.adiadas.length}</span>
        </div>
      )}
    </div>
  );
}

function Confirmacao({
  equipe,
  plano,
  horas,
  inicio,
  origem,
  seq,
  onCancel,
  onConfirm,
}: {
  equipe: Equipe;
  plano: PlanoTurno;
  horas: number;
  inicio: number;
  origem: string;
  seq: number;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  return (
    <dialog
      ref={ref}
      className="modal"
      aria-labelledby="confirma-titulo"
      onCancel={(ev) => {
        ev.preventDefault();
        onCancel();
      }}
    >
      <h2 id="confirma-titulo">
        Acionar {equipe.nome} {seq > 1 ? `para a ${ordinal(seq)}` : "para o turno"}?
      </h2>
      <p className="small">
        {plano.paradas.length} escada{plano.paradas.length !== 1 ? "s" : ""} · turno de {horas} h · {seq > 1 ? `continua de ${origem}` : "saída da base"} às {hhmm(inicio)}, retorno à base{" "}
        {hhmm(inicio + plano.totalMin)}
        {seq > 1 && " · emenda na ordem anterior, sem voltar à base"}
      </p>
      <ol className="modal-list">
        {plano.paradas.map((p) => (
          <li key={p.escada.escada_id}>
            <span className="mono muted">{hhmm(inicio + p.chegada)}</span>
            <StatusIcon nivel={p.nivel} size={14} />
            <span className="mono strong">{p.escada.escada_id}</span>
            <span className="muted small">{p.alertas.map((a) => LIMITE_POR_SINAL[a.sinal].rotulo).join(", ")}</span>
          </li>
        ))}
      </ol>
      <CartaoEquipe equipe={equipe} selecionada />
      <p className="muted small">A equipe recebe a ordem de atendimento (simulado). O sistema não liga, desliga nem altera nenhuma escada.</p>
      <div className="modal-foot">
        <button className="btn-secondary" onClick={onCancel}>
          Voltar e revisar
        </button>
        <button className="btn btn-big" onClick={onConfirm} autoFocus>
          Confirmar acionamento
        </button>
      </div>
    </dialog>
  );
}

function Despacho({
  ordem,
  equipe,
  n,
  seguinte,
  recente,
  onCancelar,
}: {
  ordem: OrdemAprovada;
  equipe: Equipe;
  n: number;
  /** Número da próxima ordem da mesma equipe, se houver: a equipe segue para ela em vez de voltar à base. */
  seguinte: number | null;
  recente: boolean;
  onCancelar: () => void;
}) {
  const qtd = ordem.paradas.length;
  const termino = seguinte ? ordem.paradas[qtd - 1].saida : ordem.fim;
  return (
    <article className={`dispatch ${recente ? "" : "dispatch-old"}`}>
      <div className="dispatch-head">
        <svg width="36" height="36" viewBox="0 0 40 40" aria-hidden="true">
          <circle cx="20" cy="20" r="19" fill="var(--brand)" />
          <path d="M11.5 20.5l6 6 11-12" stroke="var(--brand-ink)" strokeWidth="3.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <div>
          <h3>
            {equipe.nome} acionada <span className="tag tag-brand">{ordinal(n)}</span>
          </h3>
          <p className="small">
            {qtd} escada{qtd !== 1 ? "s" : ""} · {hhmm(ordem.inicio)} – {hhmm(termino)} · {equipe.tecnicos.join(", ")} · aprovada por {ordem.por} em {dataHora(ordem.em)}
          </p>
        </div>
        {/* A ordem seguinte depende de onde esta termina: só a última de cada equipe pode ser cancelada. */}
        <button className="btn-ghost small dispatch-x" onClick={onCancelar} disabled={!!seguinte} title={seguinte ? `Cancele antes a ${ordinal(seguinte)}` : undefined}>
          Cancelar ordem
        </button>
      </div>
      <ol className="timeline" style={{ gridTemplateColumns: `repeat(${qtd + 2}, minmax(84px, 1fr))` }}>
        <li className="done">
          <span className="tl-dot" aria-hidden="true" />
          <span className="tl-t mono">{hhmm(ordem.inicio)}</span>
          <span className="tl-r">{ordem.origem === BASE ? "Saída da base" : `Continua de ${ordem.origem}`}</span>
        </li>
        {ordem.paradas.map((p) => (
          <li key={p.escada_id} className={p.fase === "concluida" || p.fase === "validada" ? "done" : ""}>
            <span className="tl-dot" aria-hidden="true" />
            <span className="tl-t mono">{hhmm(p.chegada)}</span>
            <span className="tl-r">
              <StatusIcon nivel={p.nivel} size={11} />{" "}
              <a href={`#/escada/${p.escada_id}`} className="mono">
                {p.escada_id}
              </a>
            </span>
          </li>
        ))}
        <li>
          <span className="tl-dot" aria-hidden="true" />
          <span className="tl-t mono">{hhmm(termino)}</span>
          <span className="tl-r">{seguinte ? `Segue para a ${ordinal(seguinte)}` : "Retorno à base"}</span>
        </li>
      </ol>
      <ul className="dispatch-stops">
        {ordem.paradas.map((p) => {
          const at = { fase: p.fase ?? "acionada", ordem_id: ordem.ordem_id, equipe_id: ordem.equipe_id, parada: p } as const;
          return (
            <li key={p.escada_id}>
              <div className="dispatch-stop-head">
                <span className="mono muted">{hhmm(p.chegada)}</span>
                <a href={`#/escada/${p.escada_id}`} className="id-btn">
                  {p.escada_id}
                </a>
                <span className="muted small">{p.estacao}</span>
                <AtendimentoTag at={at} comEquipe={false} />
              </div>
              <AcoesAtendimento at={at} />
            </li>
          );
        })}
      </ul>
    </article>
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
