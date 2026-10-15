# Dashboard MVP — Monitoramento de escadas rolantes (Motiva · Linha 4-Amarela)

Protótipo navegável do dashboard do gestor (CP3). Responde à pergunta: **qual escada eu olho primeiro, e por quê?**

## Rodar

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # gera dist/ (estático, abre em qualquer servidor)
```

## Telas

| Rota | Tela | Spec |
|---|---|---|
| `#/` | Visão geral da frota: KPIs, filtros (grupo, estação, status), top 10 por prioridade, estações | essencial |
| `#/escada/ECR-PAU-03` | Detalhe: identificação, status com motivo, 6 sinais com faixas verde/amarela/vermelha, histórico de alertas e OS, bloco "não monitorado" | essencial |
| `#/alertas` | Central de alertas: fila por criticidade, Confirmar/Descartar com justificativa obrigatória, registro de quem e quando | essencial |
| `#/plano` | Plano do turno: alertas confirmados em ordem de atendimento + rota (Dijkstra) a partir da base; gestor aprova antes de acionar a equipe | desejável |

## Estrutura

- `src/data/types.ts`: entidades com os mesmos nomes de DDD Java / Database (`Estacao`, `EscadaRolante`, `Leitura`, `Alerta`, `OrdemServico`, `Equipe`).
- `src/data/limites.ts`: limites de alerta **provisórios** (trocar pelos da EDA de Data Science).
- `src/data/mock.ts`: **dados fictícios** determinísticos. Para ligar na API Java, substitua este módulo mantendo as mesmas exportações e o formato JSON da spec.
- `src/lib/regras.ts`: motor de regras (thresholds, sem ML): status, motivo em linguagem clara e score de criticidade. Crítica vem antes de não crítica no mesmo nível.
- `src/lib/turno.ts`: grafo das 11 estações + base, Dijkstra e `planejarTurno(base, horas)` provisório (a versão oficial vem de Dynamic Programming).

## Regras de escopo respeitadas

- O sistema recomenda; nada é acionado sem confirmação do gestor.
- Nenhuma ação de comando da escada (ligar, desligar, velocidade).
- Status sempre com ícone + texto, nunca só cor; roxo só como marca.
- Amostra de 40 escadas na proporção real 47/35/94/21. Há escadas em todos os estados, incluindo cinza (sem dados).

As decisões ficam no `localStorage` do navegador; "Reiniciar demonstração" limpa tudo.

## Histórico

- [Diagnóstico de 11/10/2026](../docs/diagnostico-2026-10-11.md): o que foi feito, decisões, verificação e pendências.
