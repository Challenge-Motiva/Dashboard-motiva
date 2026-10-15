# Diagnóstico — 11/10/2026

Registro do trabalho feito hoje no dashboard MVP de monitoramento de escadas rolantes (Challenge FIAP + Motiva).

## Objetivo do dia

Criar o MVP do dashboard seguindo `claude/plan/challenge-motiva-escadas.md` (contexto e regras de escopo) e `claude/skills/dashboard-escadas-design.md` (telas, estados, regras visuais e formato de dados).

## Situação encontrada

- `frontend/` e `backend/` vazios.
- `claude/skills/scripts/init-artifact.sh` depende de `shadcn-components.tar.gz`, que não existe no projeto. Por isso o template React + shadcn não foi usado.
- Ambiente: Node 24, npm 11, sem pnpm.

## O que foi feito

### 1. Projeto `frontend/` (React 18 + TypeScript + Vite)
Montado manualmente com npm. Sem bibliotecas de UI nem de gráficos: os gráficos são SVG próprios, e as únicas dependências são React e Vite.

### 2. Telas (todas navegáveis e ligadas entre si)

| Tela | Rota | Prioridade na spec | Situação |
|---|---|---|---|
| Visão geral da frota | `#/` | essencial | feita |
| Detalhe da escada | `#/escada/<id>` | essencial | feita |
| Central de alertas | `#/alertas` | essencial | feita |
| Plano do turno | `#/plano` | desejável | feita |
| OS do técnico (celular) | — | opcional | não feita (o layout é responsivo) |

### 3. Arquivos criados

| Arquivo | Conteúdo |
|---|---|
| `frontend/src/data/types.ts` | Entidades com os nomes de DDD Java / Database: `Estacao`, `EscadaRolante`, `Leitura`, `Alerta`, `OrdemServico`, `Equipe` |
| `frontend/src/data/limites.ts` | Limites de alerta provisórios dos 6 sinais |
| `frontend/src/data/mock.ts` | Dados fictícios determinísticos (semente fixa): frota, leituras de 7 dias, alertas, OS, KPIs |
| `frontend/src/lib/regras.ts` | Motor de regras: status, motivo em linguagem clara, score de criticidade |
| `frontend/src/lib/turno.ts` | Grafo da Linha 4 + base, Dijkstra, `planejarTurno(base, horas)` provisório |
| `frontend/src/lib/store.tsx` | Estado das decisões do gestor e do plano aprovado (persistido no `localStorage`) |
| `frontend/src/lib/formato.ts` | Relógio simulado e formatação pt-BR |
| `frontend/src/components/Status.tsx` | Badge e ícones de status (forma diferente para cada estado) |
| `frontend/src/components/SignalChart.tsx` | Gráfico de linha com faixas verde/amarela/vermelha, linhas de limite e tooltip |
| `frontend/src/pages/*.tsx` | As 4 telas |
| `frontend/src/styles.css` | Tokens de cor (claro/escuro), layout desktop e responsivo |
| `frontend/README.md` | Como rodar e estrutura do código |

### 4. Decisões tomadas

| Decisão | Motivo |
|---|---|
| Amostra de 40 escadas: 10 Críticas A, 7 Críticas B, 19 Não críticas A, 4 Não críticas B | A spec permite amostra menor desde que mantenha a proporção 47/35/94/21 |
| 11 estações reais da Linha 4, IDs `ECR-SIGLA-NN` | Exigência da spec e consistência com o grafo de Dynamic Programming |
| Cenários plantados para mostrar todos os estados | Checklist da spec: ao menos uma escada em cada estado, incluindo cinza |
| Status calculado pela média das últimas 3 leituras | Evita alerta por ruído isolado |
| Cinza quando não há leitura há mais de 60 min | Separa "sem dados" de "normal" |
| Score: o nível domina; crítica +0,15; o excesso sobre o limite desempata | Regra da spec: crítica vem antes de não crítica no mesmo nível |
| Corrente e tensão em gráficos separados | Escalas diferentes; um eixo por gráfico |
| Justificativa obrigatória (mínimo de 10 caracteres) para confirmar ou descartar | Rastreabilidade (persona Fernanda) |
| Plano do turno exige aprovação do gestor antes de acionar a equipe | Regra de escopo: o sistema recomenda, não decide |
| Turno a partir das 22:00 | Manutenção fora do horário de pico (persona Roberto) |
| Gestor simulado: Roberto Almeida (persona 3) | Login real fica para depois |
| Roxo só na marca e nos botões de ação; vermelho, amarelo e verde só no semáforo | Regra visual da spec |
| Fonte IBM Plex Sans/Mono | Evita o visual genérico, como pede o guia de estilo da skill |

### 5. Cenários plantados (dados fictícios)

| Escada | Grupo | Situação |
|---|---|---|
| ECR-REP-02 | Crítica B | Vermelho: temperatura acima de 85 °C |
| ECR-OSF-02 | Crítica B | Vermelho: queda de tensão |
| ECR-FAL-01 | Não crítica A | Vermelho: nível de óleo caindo (vazamento) |
| ECR-PAU-03 | Crítica A | Amarelo: degrau de vibração há cerca de 3 dias (exemplo da spec) |
| ECR-FRA-01 | Crítica A | Amarelo: temperatura |
| ECR-PIN-03 | Crítica A | Amarelo: corrente |
| ECR-HIG-01 | Não crítica B | Amarelo: vibração |
| ECR-LUZ-04 | Não crítica A | Amarelo: velocidade abaixo do nominal |
| ECR-BUT-02 | Crítica B | Cinza: sem leitura há cerca de 3 h |
| ECR-VSO-03 | Não crítica A | Cinza: sem leitura há cerca de 7 h |

As outras 30 escadas ficam em verde, com ruído normal e um padrão de uso com picos às 8h e às 18h.

## Verificação feita

- `npm run build` (checagem de tipos + build de produção): sem erros.
- Script de conferência dos dados: 30 verdes, 5 amarelas, 3 vermelhas e 2 cinzas; 8 alertas abertos e 5 no histórico.
- Teste de `planejarTurno` com todos os alertas confirmados: turno de 4 h atende 2 escadas, 6 h atende 3 e 8 h atende 5. O restante fica para o próximo turno, sempre respeitando a volta à base.
- Capturas de tela (Edge headless) da frota, do detalhe, dos alertas e do plano, no desktop e em largura de celular (cerca de 500 px).

Correções feitas depois das capturas:
- Rolagem horizontal na largura de celular.
- IDs quebrando no meio nas tabelas.
- Título pequeno no detalhe da escada.
- Disponibilidade arredondada para "100,0%" (agora mostra 99,96%).
- ECR-PAU-03 tinha passado para vermelho (ajustado para amarelo).
- Texto do motivo ambíguo: agora diz "fora do normal há X".

Não testado: interação real de clique no navegador (confirmar, descartar, aprovar plano). A lógica foi verificada no código e nos scripts, mas não com um usuário clicando.

## Checklist da spec

- [x] As telas 1 a 3 estão navegáveis e ligadas entre si
- [x] Existe pelo menos uma escada em cada estado, incluindo cinza
- [x] Todo alerta mostra o motivo (sinal, valor, limite) e permite confirmar ou descartar com justificativa
- [x] Nenhuma tela sugere que o sistema decide ou age sozinho
- [x] "Última leitura há X min" em cada escada
- [x] Limites sinalizados como provisórios na tela
- [x] Bloco "não monitorado" (corrimão, freio, trincas estruturais)
- [x] Nenhuma ação de comando da escada

## O que é fictício ou provisório

| Item | Onde trocar | Fonte definitiva |
|---|---|---|
| Leituras, frota, alertas, OS | `src/data/mock.ts` | Dataset da Motiva / API Java + Oracle |
| Limites de alerta | `src/data/limites.ts` | EDA de Data Science |
| Disponibilidade, MTBF, MTTR | `src/data/mock.ts` (KPIS) | Histórico real de OS |
| Tempos entre estações | `src/lib/turno.ts` | Grafo de Dynamic Programming |
| Tempo de atendimento (90 e 45 min) | `src/lib/turno.ts` | Histórico de OS |
| `planejarTurno` | `src/lib/turno.ts` | Função oficial de Dynamic Programming |
| Fabricantes (A, B, C) | `src/data/mock.ts` | Cadastro real da frota |

## Pendências e próximos passos

1. Substituir os limites provisórios pelos da EDA quando o notebook estiver pronto.
2. Se o dataset da Motiva estiver disponível, usar os nomes de colunas e as faixas reais.
3. Alinhar os tempos do grafo e a função `planejar_turno` com a entrega de Dynamic Programming.
4. Testar o fluxo completo clicando no navegador: confirmar → plano → aprovar.
5. `backend/` continua vazio: API Java Spring + Oracle + broker MQTT (Sprint 1 e 2, 18/10).
6. Opcional: tela 5 (OS do técnico no celular).
7. Para o CP3 (16/10): gerar um link compartilhável do protótipo e gravar o pitch navegando pelas telas.

## Como rodar

```bash
cd frontend
npm install
npm run dev
```
