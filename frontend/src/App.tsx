import { IDS_HISTORICO } from "./data/mock";
import { AGORA, dataHora } from "./lib/formato";
import { GESTOR, useRota, useStore } from "./lib/store";
import { useTema } from "./lib/tema";
import { Alertas } from "./pages/Alertas";
import { Escada } from "./pages/Escada";
import { Frota } from "./pages/Frota";
import { Plano } from "./pages/Plano";

export function App() {
  const rota = useRota();
  const { alertas, atendimentos, reiniciar } = useStore();
  const [tema, alternarTema] = useTema();
  const [caminho, query] = rota.split("?");
  const params = new URLSearchParams(query ?? "");
  const abertos = alertas.filter((a) => a.status === "aberto").length;
  // Só conta o que ainda não está com uma equipe (reparo reprovado volta para a fila).
  const comEquipe = (id: string) => !!atendimentos[id] && atendimentos[id].fase !== "reprovada";
  const confirmados = new Set(alertas.filter((a) => a.status === "confirmado" && !IDS_HISTORICO.has(a.alerta_id) && !comEquipe(a.escada_id)).map((a) => a.escada_id)).size;
  const aValidar = Object.values(atendimentos).filter((a) => a.fase === "concluida").length;

  let pagina;
  let ativa = "frota";
  if (caminho.startsWith("/escada/")) {
    pagina = <Escada id={decodeURIComponent(caminho.slice(8))} />;
  } else if (caminho === "/alertas") {
    ativa = "alertas";
    pagina = <Alertas escadaFiltro={params.get("escada") ?? undefined} />;
  } else if (caminho === "/plano") {
    ativa = "plano";
    pagina = <Plano />;
  } else {
    pagina = <Frota />;
  }

  return (
    <div className="shell">
      <aside className="side">
        <a href="#/" className="brand">
          <svg className="brand-logo" viewBox="0 0 112 24" role="img" aria-label="Motiva">
            <g className="brand-logo-mark">
              <path d="M5 4h3.5L4 20H.5z" />
              <path d="M12 4h3.5L11 20H7.5z" />
              <path d="M19 4h3.5L18 20h-3.5z" />
            </g>
            <text x="29" y="18.5" className="brand-logo-text">
              motiva
            </text>
          </svg>
          <span className="brand-sub">Escadas rolantes · CBM</span>
        </a>
        <nav className="nav">
          <a href="#/" className={ativa === "frota" ? "on" : ""}>
            Visão da frota
          </a>
          <a href="#/alertas" className={ativa === "alertas" ? "on" : ""}>
            Central de alertas {abertos > 0 && <span className="pill">{abertos}</span>}
          </a>
          <a href="#/plano" className={ativa === "plano" ? "on" : ""}>
            Plano do turno
            <span className="pills">
              {aValidar > 0 && (
                <span className="pill pill-validar" title={`${aValidar} reparo(s) aguardando validação`}>
                  {aValidar} validar
                </span>
              )}
              {confirmados > 0 && (
                <span className="pill pill-quiet" title="Escadas confirmadas sem equipe">
                  {confirmados}
                </span>
              )}
            </span>
          </a>
        </nav>
        <div className="side-foot">
          <button className="theme-toggle" onClick={alternarTema} aria-label={tema === "escuro" ? "Mudar para modo claro" : "Mudar para modo escuro"}>
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
              {tema === "escuro" ? (
                <>
                  <circle cx="8" cy="8" r="3.2" fill="currentColor" />
                  <path d="M8 1v1.8M8 13.2V15M1 8h1.8M13.2 8H15M3 3l1.3 1.3M11.7 11.7L13 13M3 13l1.3-1.3M11.7 4.3L13 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </>
              ) : (
                <path d="M13.5 9.6A5.8 5.8 0 0 1 6.4 2.5a5.8 5.8 0 1 0 7.1 7.1z" fill="currentColor" />
              )}
            </svg>
            {tema === "escuro" ? "Modo claro" : "Modo escuro"}
          </button>
          <div className="user">
            <span className="avatar" aria-hidden="true">
              RA
            </span>
            <span>
              {GESTOR}
              <span className="brand-sub">Gerente de Operação e Manutenção</span>
            </span>
          </div>
          <button className="btn-ghost small reset" onClick={reiniciar}>
            Reiniciar demonstração
          </button>
        </div>
      </aside>

      <main className="main">
        <div className="notice" role="note">
          <strong>Protótipo MVP.</strong> Dados fictícios até {dataHora(AGORA.toISOString())}. Limites de alerta provisórios até a EDA de Data Science.
          O sistema só lê sensores: não liga, desliga nem altera a escada.
        </div>
        {pagina}
      </main>
    </div>
  );
}
