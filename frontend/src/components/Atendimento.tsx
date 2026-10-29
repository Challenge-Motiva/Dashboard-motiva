import { useState } from "react";
import { EQUIPES } from "../data/mock";
import { dataHora } from "../lib/formato";
import { type Atendimento, type FaseAtendimento, useStore } from "../lib/store";

export const ROTULO_FASE: Record<FaseAtendimento, string> = {
  acionada: "Equipe acionada",
  concluida: "Reparo concluído · validar",
  validada: "Reparo validado",
  reprovada: "Reparo reprovado",
};

const nomeEquipe = (id: string) => EQUIPES.find((e) => e.equipe_id === id)?.nome ?? id;

/** Estado do atendimento, separado do status do sensor: a escada continua vermelha até as leituras melhorarem. */
export function AtendimentoTag({ at, comEquipe = true }: { at: Atendimento; comEquipe?: boolean }) {
  return (
    <span className={`at-tag at-${at.fase}`}>
      <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
        {at.fase === "acionada" && <circle cx="6" cy="6" r="4" fill="none" stroke="currentColor" strokeWidth="2" />}
        {at.fase === "concluida" && <circle cx="6" cy="6" r="4.5" fill="currentColor" />}
        {at.fase === "validada" && <path d="M2 6.3l2.6 2.6L10 3.4" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />}
        {at.fase === "reprovada" && <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />}
      </svg>
      {ROTULO_FASE[at.fase]}
      {comEquipe && at.fase !== "reprovada" && <span className="at-team">· {nomeEquipe(at.equipe_id)}</span>}
    </span>
  );
}

/** Botões do ciclo: conclusão (simula o retorno do técnico) e validação pelo gestor. */
export function AcoesAtendimento({ at }: { at: Atendimento }) {
  const { registrarConclusao, validarReparo } = useStore();
  const [reprovando, setReprovando] = useState(false);
  const [nota, setNota] = useState("");
  const { ordem_id, parada } = at;

  if (at.fase === "acionada") {
    return (
      <div className="at-actions">
        <button className="btn-secondary small" onClick={() => registrarConclusao(ordem_id, parada.escada_id)}>
          Equipe concluiu o reparo (simulado)
        </button>
        <span className="muted small">No sistema real, vem do registro do técnico em campo.</span>
      </div>
    );
  }
  if (at.fase === "concluida") {
    return reprovando ? (
      <form
        className="at-actions"
        onSubmit={(ev) => {
          ev.preventDefault();
          validarReparo(ordem_id, parada.escada_id, false, nota.trim());
        }}
      >
        <input className="at-nota" value={nota} onChange={(e) => setNota(e.target.value)} placeholder="Motivo (ex.: vibração ainda alta)" autoFocus required />
        <button className="btn small" type="submit">
          Reprovar e replanejar
        </button>
        <button className="btn-ghost small" type="button" onClick={() => setReprovando(false)}>
          Voltar
        </button>
      </form>
    ) : (
      <div className="at-actions">
        <button className="btn small" onClick={() => validarReparo(ordem_id, parada.escada_id, true, "")}>
          Validar reparo
        </button>
        <button className="btn-secondary small" onClick={() => setReprovando(true)}>
          Reprovar
        </button>
        <span className="muted small">
          Equipe concluiu em {dataHora(parada.concluida_em!)}. Confira as{" "}
          <a href={`#/escada/${parada.escada_id}`}>leituras da escada</a> antes de validar.
        </span>
      </div>
    );
  }
  return (
    <p className="muted small at-actions">
      {at.fase === "validada" ? "Validado" : "Reprovado"} por {parada.validada_por} em {dataHora(parada.validada_em!)}
      {parada.nota && ` · “${parada.nota}”`}
      {at.fase === "reprovada" && " · voltou para a fila do plano do turno"}
    </p>
  );
}
