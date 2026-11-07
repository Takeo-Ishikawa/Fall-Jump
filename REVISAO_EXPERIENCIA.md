# Revisão da experiência de jogo — Fall Jump 1.7
Data: 2026-11-06

## Escopo
Revisão dos fluxos visíveis ao jogador, priorizando usabilidade em retrato no Android e preservação de mecanismos já aprovados (controle por arrasto, colisões, Fever, economia, missões e níveis).

## Problemas identificados e ajustes realizados
| Prioridade | Situação anterior | Ajuste na 1.7 |
| --- | --- | --- |
| Alta | Reiniciar após derrota retornava ao nível 1, mesmo após avançar vários níveis | Repetir o nível da derrota com nova semente; pontuação da tentativa reinicia |
| Alta | Opção de menu durante uma pausa abandonava a tentativa sem confirmação | Diálogo de confirmação com Continuar jogando como ação primária |
| Alta | Botão de ajuda ficava atrás do overlay no menu principal | Como jogar dentro do painel inicial e acesso próprio durante a pausa |
| Média | Nove objetivos no mesmo painel exigiam rolagem longa | Abas Diárias e Conquistas; Voltar acessível no alto do painel |
| Média | Barra de progresso não mostrava o número de plataformas | Contador numérico acima da partida |
| Média | Tela de derrota/vitória trazia poucos dados de desempenho | Resumo de plataformas, maior combo e moedas obtidas na fase |
| Média | Resultado anterior permanecia no estado visual ao avançar | Limpar o resumo ao iniciar uma nova fase |
| Média | Rolagem de listas no celular podia ser dificultada por touch-action | Painel com rolagem vertical explícita e contenção de overscroll |

## Critérios de teste no dispositivo
1. Abrir o aplicativo com dados existentes, conferir recorde, carteira e skins. O botão Como jogar do menu deve abrir instruções e permitir voltar, sem iniciar a partida.
2. Abrir Missões e conquistas, alternar Diárias/Conquistas e rolar até o fim sem travar o arrasto. Testar Voltar no topo e resgatar uma recompensa sem duplicá-la.
3. Iniciar fase e conferir que o HUD mostra 0/40 (nível 1) e aumenta a cada plataforma. Rotacionar normalmente; colisão, Fever e gráficos devem se comportar como antes.
4. Abrir pausa, consultar Como jogar, continuar. Tentar sair, cancelar com Continuar jogando e conferir que não perdeu o progresso da tentativa. Repetir, confirmar saída e voltar ao menu.
5. Perder em um nível superior a 1 e pressionar Tentar novamente: deve recomeçar nesse mesmo nível, com pontos da tentativa zerados e moedas previamente obtidas intactas.
6. Concluir uma fase e conferir resumo, bônus de conclusão e passagem ao próximo nível, sem mostrar resultado anterior.
7. Deixar aplicativo em segundo plano e voltar, conferir pausa automática. Testar telas em aparelhos pequenos e com fonte ampliada, som desligado e modo de movimento reduzido.

## Pontos de monitoramento futuro
- Medir duração real das partidas de 40–80 plataformas e ajustar a dificuldade com resultados de testes humanos.
- Observar desempenho das animações em celulares modestos; testes automatizados não medem FPS nem ergonomia física.
- Avaliar comportamento do botão físico/gesto Voltar do Android, que pode depender de tratamento específico no Capacitor.
- Progresso em `localStorage` é preservado em atualizações por cima, mas não é sincronizado com nuvem e pode ser perdido ao limpar dados ou desinstalar o aplicativo.

A revisão não altera as regras de scoring, economia, geometria nem controles que já estavam aprovados.
