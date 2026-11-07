# Fall Jump — Plano de polimento visual da versão 1.8

**Status:** Etapa A iniciada em 2026-11-07; primeira rodada de CSS para HUD e menus aplicada. Validação automatizada e aprovação em Android pendentes.  
**Base de referência:** versão 1.7.1; consultar também [REVISAO_EXPERIENCIA.md](REVISAO_EXPERIENCIA.md), [HISTORICO_DESENVOLVIMENTO.md](HISTORICO_DESENVOLVIMENTO.md) e [CHECKLIST_PUBLICACAO.md](CHECKLIST_PUBLICACAO.md).  
**Objetivo:** aumentar a legibilidade, a sensação de profundidade e o prazer visual do jogo, preservando controles, física, desempenho, regras de pontuação e dados do jogador.

## 1. Direção visual e princípios

O visual deve continuar **casual, claro e colorido**, com a melancia e as skins como protagonistas. O acabamento desejado é limpo, levemente tridimensional, expressivo e consistente — **sem trocar o motor, sem transformar o projeto em 3D e sem adicionar pacotes pesados de imagens**.

**Referências da identidade já existente (não são uma imposição de cores imutáveis):**
- Fundo atual: branco/cinza-azulado suave (`#f8f9fc` até `#e6eaf0`); manter contraste suficiente para a torre.
- Cor principal de ações/menus: rosa (`#f14e70` / `#ef4e76`).
- Cores funcionais: rosa = normal; azul = frágil; dourado = bônus; cinza-escuro = perigo. **Nunca confiar só na cor para indicar perigo**.
- Bola: quatro skins persistidas em `www/skins.js` (Melancia, Limão, Mirtilo e Morango); todas devem continuar visualmente distintas.
- Fever: brilho quente/amarelo-alaranjado durante 90 passos físicos (1,5 segundo em 60 Hz).

**Regras do trabalho:** a informação importante deve ser percebida em menos tempo do que o jogador precisa para tomar uma decisão; os efeitos não podem encobrir as aberturas, a bola ou as áreas escuras; visual bonito não pode prejudicar a precisão de toque.

## 2. Ordem recomendada e marcos

| Ordem | Entrega | Foco | Como validar |
| --- | --- | --- | --- |
| **A — 1.8.0** | Estrutura visual | HUD, menus, textos, espaçamentos, botões e hierarquia | Capturas em Android + fluxos automatizados |
| **B — 1.8.1** | Jogabilidade visual | Bola, discos, profundidade, sombras, colisão aparente e feedback | Partida real + comparações visuais e FPS |
| **C — 1.8.2** | Ambientação e acabamento | Fundo, transições, microanimações e integração visual | Dispositivos modestos + revisão final lado a lado |

As versões acima são **marcos propostos**, não releases já existentes. Não misturar A, B e C no mesmo commit: implementar, testar e aprovar uma etapa antes de avançar.

## 3. Etapa A — HUD, menus e hierarquia (prioridade alta)

### A1. HUD durante a partida — P0
- [ ] Dar prioridade visual à **pontuação**; nível, contagem de plataformas, recorde, moedas e Fever ficam em níveis secundários de informação.
- [ ] Melhorar alinhamento e espaçamento vertical; evitar sobreposição entre HUD, combo, dica, som, ajuda e pausa.
- [ ] Padronizar tipografia, pesos, tamanho das legendas e números tabulares.
- [ ] Tornar a barra de plataformas e a barra Fever distinguíveis por forma/rótulo, não apenas pela cor.
- [ ] Preservar a informação de `FASE #XXXXXXXX` para reprodução de bugs, mas deixá-la discreta.
- [ ] Conferir contraste e legibilidade sobre fundos claros e em situações de muitas partículas.

**Aceite:** todas as informações cabem sem recortes em retrato; nenhuma interfere na visão da bola ou impede interação; a leitura continua clara com diferentes skins e durante Fever.

### A2. Painéis de navegação — P0
- [ ] Unificar raios de borda, sombras, espaçamentos e estados de botão (normal, pressionado, desabilitado, selecionado e com foco).
- [ ] Manter **somente um Voltar compacto no topo** de Como jogar, Aparências e Missões; não reintroduzir o botão inferior redundante.
- [ ] Preservar abas **Diárias / Conquistas lado a lado**, com destaque da ativa, sem parecerem dois botões primários.
- [ ] Manter os resgates de recompensa claros e o temporizador diário bem visível.
- [ ] Diminuir áreas vazias desnecessárias nos menus, sem comprimir áreas de toque.
- [ ] Fazer cabeçalhos e conteúdo rolarem corretamente com o botão Voltar disponível nos painéis longos.
- [ ] Respeitar `env(safe-area-inset-top)` e `env(safe-area-inset-bottom)`, status bar, recorte e barra de navegação Android.

**Aceite:** o painel de missões funciona em tela pequena e longa; abas não empilham; botões não duplicam; a barra de status nunca cobre textos/ações; navegação anterior da 1.7.1 permanece intacta.

### A3. Telas de início, pausa, vitória e derrota — P1
- [ ] Hierarquia de ação inequívoca: Jogar / Continuar / Tentar novamente / Próximo nível como ações primárias.
- [ ] Resumo de fase mais legível (plataformas percorridas, melhor combo, moedas da fase).
- [ ] Reduzir repetição desnecessária de instruções longas; preferir ajuda contextual.
- [ ] Dar acabamento aos estados de confirmação de saída, sem alterar a regra de preservação de progresso.

**Aceite:** o jogador entende a ação principal sem ler todo o painel; sair durante pausa continua exigindo confirmação; após derrota a nova tentativa continua no **mesmo nível**.

## 4. Etapa B — Bola, plataformas e feedback (prioridade alta)

### B1. Bola e skins — P0
- [ ] Refinar gradiente, brilho especular, sombra e contorno da bola para parecer uma esfera limpa em diferentes tamanhos de tela.
- [ ] Ajustar a leitura das quatro skins (inclusive contraste de Limão e Mirtilo) com o fundo e discos.
- [ ] Usar deformação sutil de impacto (`squash/stretch`) **apenas visual**, sem alterar o raio de colisão.
- [ ] Melhorar trilha de descida em alta velocidade; reduzir detalhes quando a cena estiver carregada.
- [ ] Tornar o Fever imediatamente reconhecível com aura quente discreta e temporária.

**Aceite:** a bola não some no fundo nem fica visualmente atrás dos discos de forma incoerente; colisões continuam alinhadas; skins permanecem apenas cosméticas.

### B2. Plataformas e profundidade — P0
- [ ] Suavizar gradientes e sombras de topo/lateral dos anéis, dando espessura coerente sem exagero.
- [ ] Reforçar separação de planos e oclusão da coluna central, preservando a leitura do vão.
- [ ] Aprimorar identificação das áreas perigosas por contraste e detalhe visual adicional discreto, evitando confusão com o cinza de sombras.
- [ ] Padronizar brilho/acentos das plataformas azuis e douradas; bônus precisa ser perceptível, mas não competir com perigo.
- [ ] Auditar ordem de desenho e partículas para não cobrir a bola, especialmente após quebras e em combos.

**Aceite:** distinguir normal, azul, dourada e perigosa imediatamente; o vão permanece claro em qualquer fase; não modificar `inGap`, `dangerAt`, regra de quebrar plataforma frágil nem física.

### B3. Impactos, combos e recompensas — P1
- [ ] Refinar os fragmentos da quebra usando a cor correta do disco e direção de dispersão consistente.
- [ ] Criar feedback de quique e passagem pelo vão com durações curtas, sem flash excessivo.
- [ ] Melhorar animação do combo com hierarquia de pontuação; priorizar legibilidade do próximo movimento.
- [ ] Moderar o brilho de Fever e as partículas no período de vários discos destruídos.
- [ ] Manter celebrações de missão/conquista leves, compatíveis com `prefers-reduced-motion`.

**Aceite:** toda ação importante tem retorno visível, sem esconder risco ou abertura; efeitos repetidos não geram queda perceptível de desempenho em Android.

## 5. Etapa C — Ambiente e integração (prioridade média)

### C1. Fundo e atmosfera — P1
- [ ] Refinar o fundo em gradientes suaves e silhuetas discretas; sem cenário poluído.
- [ ] Considerar parallax **mínimo**, com apenas uma ou duas camadas abstratas; desligar com movimento reduzido.
- [ ] Revisar contraste de coluna, sombras e plataformas com fundos em diferentes alturas da fase.
- [ ] Se necessário, trocar silhuetas rígidas por formas vetoriais simples desenhadas no Canvas, sem assets grandes.

**Aceite:** fundo dá profundidade, mas a bola e as zonas de risco continuam sendo os focos de atenção.

### C2. Transições e microinterações — P1
- [ ] Aplicar transições sutis e coerentes nas telas, sem bloquear toques.
- [ ] Melhorar passagem entre níveis e estado de vitória/derrota com efeitos breves.
- [ ] Polir destaque de skin selecionada, meta pronta para resgate e recompensa recebida.
- [ ] Não acrescentar telas de carregamento artificiais ou delays obrigatórios.

**Aceite:** transições são rápidas, previsíveis e não atrapalham o jogo; usuário pode navegar imediatamente quando desejar.

### C3. Revisão de consistência — P0 para fechamento
- [ ] Conferir cores, tipografia, bordas, sombras, botões e escalas de todas as telas.
- [ ] Corrigir qualquer inconsistência detectada nas capturas reais antes de considerar a 1.8 encerrada.
- [ ] Atualizar README, histórico e documentação de testes ao concluir cada marco.

## 6. Diretrizes técnicas e de desempenho

**Arquitetura existente:** `www/index.html` contém HTML/CSS, estado do jogo e renderização Canvas 2D; `www/skins.js`, `www/fever.js`, `www/goals.js` e `www/level-generator.js` devem permanecer independentes. O wrapper Android usa Capacitor 7. Não há necessidade de substituir motor.

1. **Preferir Canvas e CSS:** gradientes, vetores simples, sombras e animações curtas. Introduzir atlas de sprites apenas se for comprovadamente necessário e compactado; evitar fotos, bibliotecas de efeitos e fontes externas.
2. **Evitar trabalho por frame desnecessário:** gradientes/objetos imutáveis podem ser cacheados onde possível; não adicionar múltiplos filtros `blur`, `shadowBlur` ou alocações pesadas ao loop de desenho sem medir o custo.
3. **Preservar orçamento atual de pixels:** `resize()` limita o Canvas a cerca de **1.750.000 pixels internos** e DPR máximo 2. Não aumentar esse teto nesta etapa sem prova de benefício e medição real.
4. **Manter limites de efeitos e limpeza:** reaproveitar o controle atual de partículas/fragmentos e remover elementos expirados. Efeitos devem terminar mesmo em partidas longas.
5. **Usar CSS com validação:** manter testes que detectam chaves não fechadas (regressão vista na 1.7). Validar telas em retrato e com o teclado/gestos Android.
6. **Reversibilidade:** cada melhoria visual deve ser pequena e fácil de reverter. Não misturar refatoração das regras do jogo com mudanças de apresentação.
7. **Metas de desempenho propostas:** buscar 60 FPS em celular intermediário e responsividade estável em aparelhos modestos; **medir no dispositivo**, não prometer esse resultado só com testes Node.js. Comparar tempo de quadro e tamanho do APK/AAB antes/depois.
8. **Sem dependência de rede:** todas as cenas, skins, efeitos e menus precisam funcionar offline.

## 7. Restrições que não podem ser alteradas pelo polimento

- Controle por arrasto e colisões/ordem de desenho já validadas.
- Plataformas de 40 a 80 por nível; gerador procedural, sementes e padrões existentes.
- Fever após **5 vãos**, duração de **1,5 segundo**, pontos ×2 e áreas escuras sempre letais.
- Azul frágil quebra **ao contato** — não ao atravessar uma abertura.
- Moedas e skins salvas; missões diárias, conquistas, resgate manual e temporizador local.
- Ao perder, Tentar novamente reinicia o **nível atual**; confirmação antes de abandonar tentativa.
- `applicationId` **`com.takeoishikawa.falljump`**, assinatura permanente e `versionCode` crescente para permitir instalação sobre a versão anterior.
- Nenhuma mudança de preços de skins, economia ou placar sem uma decisão de design separada.

## 8. Checklist de validação em Android — aplicar em A, B e C

- [ ] `npm test` e verificações sintáticas do GitHub Actions passam.
- [ ] Compilação APK **e** AAB de release; assinaturas verificadas; download da Release conferido.
- [ ] Instalar o APK **sobre a versão anterior** sem desinstalar; verificar recorde, moedas, skins, missões e conquistas preservados.
- [ ] Testar o primeiro nível e pelo menos um nível avançado (40 a 80 plataformas).
- [ ] Testar normal, frágil, bônus, perigo, combo, Fever, vitória e derrota.
- [ ] Conferir captura do menu, HUD, ajuda, aparência, missões diárias, conquistas, pausa, vitória e derrota.
- [ ] Tela pequena (~360 px de largura), tela média (~390–430 px) e Android com barra de status/gestos; conferir fonte ampliada e recortes.
- [ ] Rotação permanece bloqueada em retrato; menus longos rolam e botão Voltar continua acessível.
- [ ] Conferir efeitos sonoros ligados/desligados, aplicativo em segundo plano e preferência por movimento reduzido.
- [ ] Observar FPS, travamentos, consumo visual excessivo e tamanho dos arquivos na comparação com a versão anterior.
- [ ] Reprovar qualquer melhoria que gere ambiguidade de colisão, dificulte distinguir risco, corte texto ou prejudique jogabilidade.

## 9. Critérios para considerar a versão 1.8 concluída

**Concluída somente se:**
1. Etapas A, B e C tiverem seus itens P0 aprovados; itens P1 não concluídos estiverem documentados.
2. Telas e jogo estiverem visualmente consistentes em capturas reais, inclusive em celulares menores.
3. Testes automatizados e APK/AAB assinados passarem, e atualização sobre APK anterior funcionar.
4. Nenhuma regressão aparecer em colisões, moedas, Fever, missões, navegação e desempenho.
5. Documento e histórico registrarem o que foi implementado de fato, não apenas planejado.

**Próxima ação sugerida:** iniciar pela **Etapa A (HUD e menus)**, entregar um APK de teste específico e obter aprovação das capturas antes de mudar a renderização da bola e das plataformas.

## Registro de implementação — 2026-11-07

- Iniciada a Etapa A (1.8.0) com acabamento CSS do HUD, hierarquia da pontuação, barras de progresso e Fever, controles superiores, botões, painéis, abas, cartões de resultado e ajustes responsivos.
- Mantidas as regras de física, colisão, economia, missões e persistência; alterações limitadas a CSS e título da página.
- **Pendente:** testes automatizados/Actions, captura e aprovação no Android. Os checkboxes de aceite permanecem abertos até a validação real.
