---
name: challenge-motiva-escadas
description: Contexto do Challenge FIAP + Motiva de monitoramento de escadas rolantes. Use em qualquer tarefa do projeto: charter, requisitos, código, banco, rede, dados ou pitch.
---

# Challenge Motiva — Escadas Rolantes (FIAP 2ESPA, 2026)

Use este contexto em qualquer pedido ligado ao projeto, para que todas as entregas fiquem coerentes entre si e com o escopo acordado.

## O problema

- A Motiva Trilhos opera a manutenção das escadas rolantes da ViaQuatro (Linha 4-Amarela): 197 escadas ativas.
- 4 grupos de manutenção, diferenciados pelo desnível: Críticas A (47), Críticas B (35), Não críticas A (94), Não críticas B (21). Total: 82 críticas e 115 não críticas.
- A manutenção é preventiva e baseada em calendário (rotinas P1, P6, P9, P12, P18, PD48), não na condição real. Isso consome a maior parte do orçamento, mesmo em equipamentos sem sinal de falha.
- Pergunta central: como reduzir manutenção corretiva e desnecessária sem comprometer a segurança dos passageiros.
- No roadmap CBM (manutenção baseada na condição) da Motiva, escadas rolantes estão em G1 (ideação).

## Dataset (fornecido pela Motiva)

| Variável | O que monitora | Possíveis insights |
|---|---|---|
| Vibração | Motor e redutor | Desalinhamento, falha em rolamentos |
| Temperatura | Componentes mecânicos | Aquecimento anormal, atrito |
| Corrente/Tensão | Sistema elétrico | Sobrecarga, anomalias na partida |
| Nível de óleo | Lubrificação | Consumo, vazamentos, baixo nível |
| Velocidade | Movimentação dos degraus | Travamentos, desacelerações, atrito |

- O desafio é tratar, analisar e apoiar a decisão, não fazer a aquisição física dos dados.
- Fora do alcance dos dados atuais: trincas estruturais, corrimão, freio, roletes danificados. Isso é espaço para inovação (novos sensores), mas sempre separado do que os dados atuais permitem analisar.

## Perguntas que a solução precisa responder

1. Quais equipamentos merecem maior atenção e prioridade?
2. Quais comportamentos indicam alteração na condição de operação?
3. Existem padrões diferentes sob diferentes condições de uso?
4. Quais variáveis se relacionam entre si?
5. Quais situações merecem investigação técnica?
6. Como transformar isso em apoio à priorização?

## Nossa solução

Dashboard web multimarca de monitoramento de condição que prioriza as escadas e recomenda o acionamento de equipes. O gestor confirma todo acionamento.

Fluxo: ESP32 na escada → Wi-Fi da estação → switch/roteador → fibra → broker MQTT + API Java Spring → Oracle → motor de regras (limites derivados da EDA) → dashboard → gestor confirma → plano do turno (ranking de criticidade + rota Dijkstra/A*) → equipe acionada. O fechamento da OS pelo técnico recalibra as regras.

Papéis do ESP32:
1. MVP: reproduz leituras do dataset via MQTT (pode ser simulado no Wokwi). Não é coleta física.
2. Redes: protagonista da topologia no Packet Tracer.
3. Roadmap: kit de retrofit multimarca, incluindo sensores para o que hoje está fora de alcance.

Diferencial: as plataformas dos fabricantes (KONE 24/7, Otis ONE, Schindler Ahead) só funcionam com a própria marca; a nossa é multimarca e usa dados que a Motiva já tem.

## Regras de escopo (não violar)

- O sistema recomenda; não decide sozinho. Nenhuma equipe é acionada sem aprovação do gestor.
- Não controla a escada: não liga, não desliga, não altera velocidade. O ESP32 é somente leitura.
- Não é dispositivo de segurança certificado. Não substitui o técnico, as inspeções físicas nem as preventivas obrigatórias.
- Não compra peças, não garante 100% de precisão e não prevê a data exata da falha.
- O MVP usa regras e limites (thresholds), não ML treinado.
- Fora do MVP: instalação de sensores físicos, app mobile nativo, integração com ERP/SAP, elevadores e esteiras.

Se um pedido violar essas regras, aponte o conflito e proponha uma alternativa dentro do escopo.

## Stakeholders e personas

- Diretoria de Operações (patrocinador), Gerente de Manutenção (Product Owner do lado cliente), Técnicos de manutenção (usuários finais dos alertas), Engenharia e Planejamento (valida critérios de risco), Equipe de Dados e TI, Passageiros (beneficiários indiretos).
- Fernanda (persona 2): pressionada pelo orçamento gasto em preventivas; quer comparar a condição real dos ativos e justificar prioridades com rastreabilidade.
- Roberto Almeida (persona 3), 48 anos, Gerente de Operação e Manutenção: quer disponibilidade acima de 98%, visão única da frota multimarca, KPIs prontos para a diretoria e manutenção fora do horário de pico.
- Persona 1: consultar o Project Charter da equipe.

## Prazos e regras do Challenge

- CP3 (Agile): 16/10/2026 — Project Charter atualizado, Registro de Requisitos, protótipo navegável feito com IA, vídeo pitch de até 5 minutos.
- Sprint 1 e 2 de todas as disciplinas: 18/10/2026. Correção até 25/10/2026.
- Grupos de 3 a 5 alunos da mesma turma, com um líder. O aluno não contata a Motiva diretamente; toda comunicação passa pela Scrum Master. Violar uma regra zera a sprint em todas as disciplinas.

## Consistência entre disciplinas

- Mesmos nomes de entidades em DDD Java, Database e no dashboard: Estacao, EscadaRolante, DispositivoIoT, Leitura (com uma subclasse por sensor), Alerta, OrdemServico, Equipe.
- As mesmas estações da Linha 4 aparecem no protótipo e no grafo de Dynamic Programming.
- Os limites de alerta vêm da EDA de Data Science.
- A função planejar_turno(base, horas) de Dynamic Programming é o motor do acionamento de equipes.

## Ao responder

- Separe observação dos dados de hipótese técnica.
- Não invente valores do dataset. Quando não houver dados reais, marque o valor como fictício ou provisório.
- Responda em português.
