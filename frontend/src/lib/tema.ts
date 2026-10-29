import { useEffect, useState } from "react";

export type Tema = "claro" | "escuro";

const CHAVE = "motiva-tema";

function lerTema(): Tema {
  try {
    const v = localStorage.getItem(CHAVE);
    if (v === "claro" || v === "escuro") return v;
  } catch {
    // Armazenamento bloqueado: segue o sistema.
  }
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "escuro" : "claro";
}

/** Tema em <html data-theme>. Começa pelo sistema; um clique alterna entre claro e escuro. */
export function useTema(): [Tema, () => void] {
  const [tema, setTema] = useState<Tema>(lerTema);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", tema === "escuro" ? "dark" : "light");
  }, [tema]);

  const alternar = () =>
    setTema((t) => {
      const novo = t === "escuro" ? "claro" : "escuro";
      try {
        localStorage.setItem(CHAVE, novo);
      } catch {
        // Sem persistência; o tema vale só nesta sessão.
      }
      return novo;
    });

  return [tema, alternar];
}
