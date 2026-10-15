---
name: revisar-entrega-challenge
description: Revisa uma entrega do Challenge Motiva contra a rubrica da disciplina (Agile, DDD Java, Data Science, Database, Dynamic Programming, Redes) e aponta o que falta antes de enviar.
---

# Revisar entrega do Challenge contra a rubrica

## Passos

1. Identifique a disciplina da entrega. Se não estiver claro, pergunte.
2. Leia a entrega inteira (documento, notebook, código ou print).
3. Para cada item da rubrica abaixo, classifique: ok, fraco ou ausente.
4. Confira os requisitos formais (formato, capa, nomes com RM, canal de envio).
5. Confira a consistência com as outras disciplinas: mesmos nomes de entidades (Estacao, EscadaRolante, DispositivoIoT, Leitura, Alerta, OrdemServico, Equipe) e mesmas estações.
6. Confira as regras de escopo: o sistema recomenda e o gestor aprova; não controla a escada; MVP usa regras e limites, não ML; dados vêm do dataset da Motiva.
7. Entregue o resultado no formato abaixo.

## Formato do resultado

- Tabela: item da rubrica | pontos | status | o que fazer.
- Em seguida, as 3 correções mais importantes, ordenadas por pontos em jogo.
- Por fim, pendências formais que podem gerar desconto.
- Seja direto e honesto. Não reescreva a entrega inteira, a menos que peçam.

## Rubricas

### Agile Methodology (Project Charter + Requisitos + Pitch)
- Identificação do problema: 5
- Visão do produto: 5
- Quadro É/Não é e Faz/Não faz: 20
- Personas + mapas de empatia: 20 (baseados em evidências: entrevistas, pesquisas ou dados)
- Registro de requisitos: 30 (4 categorias: Funcionais, Não funcionais, Técnicos, de Negócio; cada um com ID, descrição e prioridade MoSCoW ou Impacto x Esforço)
- Vídeo pitch: 30 (até 5 min, no YouTube, ao menos um integrante narrando ou apresentando, sem uso excessivo de IA; define o problema, a solução e os requisitos)
- Formal: PDF único via Teams com Charter, requisitos e link do pitch. O Charter precisa da identificação (nome do projeto, squad, integrantes, cliente). Anexos opcionais: roteiros de entrevista, pesquisas, benchmark.
- CP3 também pede um protótipo navegável das principais telas, feito com IA.

### Domain Driven Design (Java)
- Descritivo: 25 (contexto, desafio, objetivos, funcionalidades)
- Modelagem de classes: 25 (classe de escada rolante com propriedades e métodos que representem o dataset; ao menos uma classe de localização; objetos de todas as classes instanciados na Main; dados impressos com toString() ou imprimirDados())
- Pilares de POO: 25 (abstração, encapsulamento, herança, polimorfismo)
- Documentação JavaDoc: 25 (@author, @param, @return, @since, @throws, @version em cada classe e elemento)
- Formal: ZIP único via Teams com a pasta do projeto e PDF com capa, sumário e descritivo. Nomes em ordem alfabética, em linhas distintas, com RM. Ausência de capa ou sumário gera desconto.

### Data Science
- Compreensão, qualidade e preparação dos dados: 20 (variáveis, tipos, dimensões, ausentes, duplicados, inconsistências)
- Estatística descritiva: 20 (média, mediana, mínimo, máximo, quartis, amplitude, desvio padrão)
- Análise exploratória e visualizações: 20 (distribuições de vibração, temperatura, corrente/tensão, óleo, velocidade)
- Relações entre variáveis e padrões: 20 (correlação, comparação entre equipamentos ou condições)
- Interpretação, insights e conclusões: 20
- Requisitos: Python em Jupyter ou Colab; Pandas, NumPy, Matplotlib; código organizado e executável; toda análise com interpretação; outliers discutidos, não removidos automaticamente; observação separada de hipótese técnica.
- Formal: notebook .ipynb.

### Database Design
- Descritivo: 20
- Modelo de classes: 5 (o mesmo de DDD Java)
- Modelo lógico no Oracle Data Modeler, aba Logical: 25 (mínimo 4 entidades; compatível com as classes; divergências justificadas)
- Modelo relacional, aba Relational, gerado do lógico: 25
- Descrição dos elementos do modelo relacional: 25 (cada tabela e coluna com propósito; PK, FK, UK e demais restrições)
- Formal: PDF único via Teams, diagramas em resolução legível, capa e sumário, nomes em ordem alfabética com RM.

### Dynamic Programming
- Função de degradação acumulada em 3 versões (recursiva pura, memoizada com dicionário, iterativa com tabulação), com medição e ranking de criticidade: 20
- Grafo: pelo menos 8 estações + 1 base, lista de adjacência, pesos em minutos, cada escada ligada a uma estação, BFS (menos trechos), Dijkstra (menor tempo), rotas reconstruídas: 25
- A* com heurística justificada, comparado ao Dijkstra: 25
- planejar_turno(base, horas) correto e coerente com os dados: 15
- Desempenho, documentação e interpretação no GitHub: 15
- Formal: dados em CSV, Excel ou JSON; repositório GitHub com notebook.ipynb já executado; README com documentação e interpretação; link enviado via Teams.

### Network Architect Solutions
- Descritivo do cenário e classificação da rede: 15 (rede local da estação, interligação entre estações, datacenter ou nuvem, cada uma justificada)
- Topologia no Packet Tracer: 30 (no mínimo 1 roteador, 2 switches, 1 access point, dispositivos finais representando sensores/estações e o servidor de análise; ping testado)
- Tabela de endereçamento IP: 20 (coerência e correção)
- Encapsulamento e protocolos por camada TCP/IP: 20 (aplicação, transporte, rede, acesso à rede, aplicados ao envio das leituras)
- Justificativa dos dispositivos e meios (par trançado, fibra, wireless): 15
- Formal: PDF com capa (integrantes com RM), descritivo, classificação, tabela IP, encapsulamento, print legível da topologia; arquivo .pkt funcional.

## Prazos

- CP3 Agile: 16/10/2026.
- Sprint 1 e 2 de todas as disciplinas: 18/10/2026.
- Violar qualquer regra do Challenge zera a sprint em todas as disciplinas.
