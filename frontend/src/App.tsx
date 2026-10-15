import { IDS_HISTORICO } from "./data/mock";
import { AGORA, dataHora } from "./lib/formato";
import { GESTOR, useRota, useStore } from "./lib/store";
import { Alertas } from "./pages/Alertas";
import { Escada } from "./pages/Escada";
import { Frota } from "./pages/Frota";
import { Plano } from "./pages/Plano";

export function App() {
  const rota = useRota();
  const { alertas, reiniciar } = useStore();
  const [caminho, query] = rota.split("?");
  const params = new URLSearchParams(query ?? "");
  const abertos = alertas.filter((a) => a.status === "aberto").length;
  const confirmados = alertas.filter((a) => a.status === "confirmado" && !IDS_HISTORICO.has(a.alerta_id)).length;

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
          <span className="brand-mark" aria-hidden="true" />
          <span>
            <strong>Motiva</strong>
            <span className="brand-sub">Escadas rolantes · CBM</span>
          </span>
        </a>
        <nav className="nav">
          <a href="#/" className={ativa === "frota" ? "on" : ""}>
            Visão da frota
          </a>
          <a href="#/alertas" className={ativa === "alertas" ? "on" : ""}>
            Central de alertas {abertos > 0 && <span className="pill">{abertos}</span>}
          </a>
          <a href="#/plano" className={ativa === "plano" ? "on" : ""}>
            Plano do turno {confirmados > 0 && <span className="pill pill-quiet">{confirmados}</span>}
          </a>
        </nav>
        <div className="side-foot">
          <div className="user">
            <span className="avatar" aria-hidden="true">
              RA
            </span>
            <span>
              {GESTOR}
              <span className="brand-sub">Gerente de Operação e Manutenção</span>
            </span>
          </div>
          <button className="btn-ghost small" onClick={reiniciar}>
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
