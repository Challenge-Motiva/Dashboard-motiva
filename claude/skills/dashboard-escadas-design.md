---
name: dashboard-escadas-design
description: Especificação do dashboard de escadas rolantes do projeto Motiva: telas, estados, regras visuais e formato de dados. Use ao criar ou revisar protótipo, telas ou front-end.
---

# Dashboard de monitoramento de escadas rolantes

O dashboard existe para responder uma pergunta do gestor: qual escada eu olho primeiro, e por quê? Tudo o que não ajuda a responder isso fica para depois.

## Telas

### 1. Visão geral da frota (tela inicial) — essencial
- Indicadores no topo: disponibilidade (%), escadas em alerta vermelho e amarelo, MTBF, MTTR.
- Estações em cards ou lista, com a contagem de escadas por status.
- Ranking de prioridade: as 10 escadas de maior criticidade.
- Filtros: grupo (Críticas A/B, Não críticas A/B), estação, status.

### 2. Detalhe da escada — essencial
- Identificação: ID, estação, acesso/piso, grupo, fabricante.
- Status atual com o motivo em linguagem clara (ex.: "vibração 38% acima do limite há 3 dias").
- Os 5 sinais em gráficos de linha com faixas verde/amarela/vermelha ao fundo: vibração, temperatura, corrente/tensão, nível de óleo, velocidade.
- Histórico de alertas e de manutenções.
- Bloco "não monitorado": corrimão, freio, trincas estruturais.

### 3. Central de alertas — essencial
- Fila ordenada por criticidade: escada, sinal, valor contra o limite, há quanto tempo está ativo.
- Ações Confirmar e Descartar, com justificativa obrigatória. Registrar quem decidiu e quando.

### 4. Plano do turno — desejável
- A partir dos alertas confirmados: escadas em ordem de atendimento e rota a partir da base de manutenção.
- No protótipo pode ser estático. Depois, é preenchido pela função planejar_turno(base, horas).

### 5. OS do técnico (celular) — opcional
- Só esboço, se houver tempo. O app nativo está fora do escopo; a versão é web responsiva.

## Regras visuais

- Quatro estados: verde (normal), amarelo (atenção), vermelho (intervenção recomendada), cinza (sem dados/offline).
- A cor sempre vem com ícone ou texto. Nunca usar só a cor.
- O roxo da Motiva é só cor de marca. Vermelho, amarelo e verde ficam reservados ao semáforo.
- Mostrar "última leitura há X min" em cada escada.
- Todo alerta mostra a evidência (sinal, valor, limite), não só a cor.
- Desktop primeiro, para o gestor; responsivo para o técnico.
- Escada crítica tem prioridade sobre não crítica com o mesmo nível de alerta.
- O sistema nunca mostra ações de comando da escada (ligar, desligar, mudar velocidade).

## Formato de dados

Manter estes formatos mesmo com dados fictícios, para trocar só a fonte quando a API e o ESP32 chegarem.

Leitura:
```json
{ "escada_id": "ECR-PAU-03", "timestamp": "2026-10-11T16:40:00",
  "vibracao_mm_s": 4.2, "temperatura_c": 61.5, "corrente_a": 18.3,
  "tensao_v": 381, "nivel_oleo_pct": 72, "velocidade_m_s": 0.49 }
```

Escada:
```json
{ "escada_id": "ECR-PAU-03", "estacao": "Paulista", "linha": "4-Amarela",
  "grupo": "Critica A", "fabricante": "Fabricante X", "acesso": "Plataforma - mezanino",
  "status": "amarelo", "score_criticidade": 0.72, "ultima_leitura": "2026-10-11T16:40:00" }
```

Alerta:
```json
{ "alerta_id": "AL-0142", "escada_id": "ECR-PAU-03", "sinal": "vibracao",
  "valor": 4.2, "limite": 3.0, "nivel": "amarelo", "status": "aberto",
  "aberto_em": "2026-10-08T09:10:00", "decidido_por": null, "justificativa": null }
```

Os nomes batem com as classes de DDD Java e as tabelas de Database (Estacao, EscadaRolante, Leitura, Alerta).

## Dados fictícios

- Estações reais da Linha 4-Amarela: Luz, República, Higienópolis-Mackenzie, Paulista, Oscar Freire, Fradique Coutinho, Faria Lima, Pinheiros, Butantã, São Paulo-Morumbi, Vila Sônia. Usar as mesmas no grafo de Dynamic Programming.
- Respeitar a proporção real dos grupos: 47 Críticas A, 35 Críticas B, 94 Não críticas A, 21 Não críticas B (197 no total). Pode usar uma amostra menor, mantendo a proporção.
- IDs no padrão ECR-SIGLA-NN.
- Limites de alerta são provisórios até a EDA ficar pronta; sinalizar isso na tela.
- Se o dataset da Motiva estiver disponível, usar os nomes de colunas e as faixas reais.

## Fica para depois

Dados em tempo real e ESP32, login real, mapa geográfico, previsão com ML, integração com SAP, notificações reais, relatórios em PDF.

## Checklist antes de entregar

- As telas 1 a 3 estão navegáveis e ligadas entre si.
- Existe pelo menos uma escada em cada estado, incluindo cinza.
- Todo alerta mostra o motivo e permite confirmar ou descartar com justificativa.
- Nenhuma tela sugere que o sistema decide ou age sozinho.
