# Fall Jump — HTML5 e APK Android

Jogo casual HTML5/Canvas 2D (versão 1.8.3, polimento visual em validação), empacotado para Android via Capacitor 7.

Consulte [HISTORICO_DESENVOLVIMENTO.md](HISTORICO_DESENVOLVIMENTO.md) para o registro completo das versões, correções e próximos passos.

Consulte [CHECKLIST_PUBLICACAO.md](CHECKLIST_PUBLICACAO.md) para os itens ainda necessários antes de uma eventual publicação na Google Play.

**Próxima etapa:** [PLANO_POLIMENTO_VISUAL_1_8.md](PLANO_POLIMENTO_VISUAL_1_8.md) — roteiro de direção visual em três entregas (HUD/menus, bola/plataformas/efeitos e ambientação), com critérios de aceite e checklist de testes em Android. **A Etapa A foi iniciada; aprovação visual em Android ainda pendente.**

## Estrutura
- `www/index.html`: código do jogo, mantido independente do Android.
- `www/level-generator.js`: geração modular determinística de níveis com validação de rotas.
- `www/fever.js`: regras da habilidade Fever, ativação, temporizador e pontuação em dobro.
- `www/skins.js`: coleção local de aparências, moedas e persistência entre sessões.
- `www/goals.js`: missões diárias e conquistas permanentes, com recompensas automáticas e progresso local.
- `tests/goals.test.cjs`: valida atualização diária, progressão, premiação única e persistência.
- `tests/skins.test.cjs`: testes de recompensas, compras cosméticas e dados salvos.
- `tests/fever.test.cjs`: testes de ativação, duração e prioridade das colisões.
- `tests/level-generator.test.cjs`: testes automatizados de variedade, segurança e reprodutibilidade.
- `scripts/generate_android_icons.py`: gera ícones Android e fixa a orientação vertical durante a compilação.
- `capacitor.config.json`: identidade fixa do aplicativo (`com.takeoishikawa.falljump`).
- `.github/workflows/android-apk.yml`: cria **APK de release assinado, com download direto** no GitHub Actions, usando a mesma identidade Android e o mesmo versionCode.
- `package.json`: dependências do Capacitor.

## Como garantir atualizações sem desinstalar
O Android exige **o mesmo applicationId e a mesma chave de assinatura**, além de versionCode compatível. O workflow mantém o ID fixo e aumenta o `versionCode` a cada execução usando `github.run_number`. O certificado depende de uma chave privada permanente: **nunca gere uma nova para cada compilação**.

## Preparação única da chave
1. Guarde em lugar seguro o arquivo `fall-jump-signing.jks` e as senhas entregues separadamente ao proprietário do projeto. Nunca coloque a chave ou as senhas no repositório.
2. Vá a **Settings > Secrets and variables > Actions > New repository secret**.
3. Crie os seguintes secrets:
   - `ANDROID_KEYSTORE_BASE64`: conteúdo do arquivo `.jks` codificado em Base64;
   - `ANDROID_KEYSTORE_PASSWORD`: senha do keystore;
   - `ANDROID_KEY_ALIAS`: alias da chave;
   - `ANDROID_KEY_PASSWORD`: senha da chave.
4. Para obter o Base64 no **PowerShell**, na pasta que contém a chave:
   ```powershell
   [Convert]::ToBase64String([System.IO.File]::ReadAllBytes((Resolve-Path ".\fall-jump-signing.jks"))) | Set-Clipboard
   ```
   O comando copia o Base64 ao clipboard. Cole no valor do secret (não em arquivos do repositório).

## Gerar APK para download direto
Abra **Actions > Compilar APK direto > Run workflow** e selecione o branch que deseja compilar (para as mudanças atuais, `feat/minimal-pastel-style`).

Após uma execução bem-sucedida, clique em **Baixar APK diretamente** no resumo da execução. O arquivo também estará em **[Releases](https://github.com/Takeo-Ishikawa/Fall-Jump/releases)**, como `Fall-Jump-v1.7.1.N.apk`.

O workflow executa somente `assembleRelease`, verifica a assinatura com `apksigner` e publica o arquivo `.apk` diretamente na Release. Ele não gera AAB nem envia arquivos para a seção Artifacts, que fornece downloads em ZIP. Os links de código-fonte ZIP/TAR que o GitHub exibe nas Releases são automáticos; para instalar o jogo, escolha o arquivo `.apk`.

A publicação do APK é obrigatória para a execução ser considerada bem-sucedida. Executar novamente a mesma compilação substitui o APK da mesma Release.

Quando um novo APK for gerado, instale-o sobre o anterior. O Android manterá os dados do aplicativo quando o ID e a assinatura forem os mesmos, o versionCode for apropriado e a instalação for aceita. O APK não se atualiza sozinho: é preciso baixar e abrir o arquivo novo.

## Mecânica atual — caminhada pelas plataformas
O personagem começa apoiado na primeira plataforma. Arraste horizontalmente no cenário para mover o personagem ao redor da coluna. As plataformas ficam fixas; a câmera gira suavemente para acompanhar o personagem. Ao soltar o arraste, ele para de caminhar. Ao alcançar o vão, o personagem cai verticalmente; ao pousar numa superfície comum, fica apoiado, aguardando o próximo movimento. **Dois toques rápidos no cenário (ou dois cliques do mouse) fazem um salto manual; durante o salto, o arraste também permite ajustar a posição**, disponível apenas quando o personagem está apoiado. Arrastar, manter pressionado ou tocar nos menus não dispara o salto.

Inimigos roxos patrulham trechos seguros de algumas plataformas, a partir da quarta, com três plataformas iniciais livres. Eles vão e voltam sem atravessar os vãos. Acerte a cabeça durante a descida para dar um pisão: cada inimigo precisa de **três pisões**, indicados pelos três pontos acima dele. Cada acerto faz o personagem quicar automaticamente, inclusive o golpe final. Contato lateral ou por baixo continua causando derrota, mesmo com Fever. Também é possível saltar por cima ou caminhar para desviar. As patrulhas também param durante a pausa.

Áreas escuras causam derrota mesmo durante Fever. Plataformas azuis quebram no contato, e as douradas preservam o bônus. Cinco aberturas atravessadas em sequência, sem pousar, ativam Fever por 1,5 segundo. Um pouso interrompe o combo e a carga incompleta; pausar congela a caminhada e o temporizador.

Os níveis existentes continuam disponíveis. A simulação do gerador verifica uma rota de queda livre; o equilíbrio da nova caminhada ainda precisa de avaliação em aparelho Android.

## Equipamentos e espada
No menu, abra **Equipamentos** para equipar ou retirar a espada gratuita. A escolha fica salva localmente, separada das aparências. Com a espada equipada, o personagem a carrega e o botão **Golpear** aparece durante a partida.

Cada golpe atinge inimigos próximos na última direção em que o personagem caminhou e remove um ponto de vida. Há um intervalo curto de 0,4 segundo entre ataques. Três golpes derrotam os inimigos atuais; golpes e pisões também podem ser combinados. A pausa congela a recarga. Sem espada equipada, o botão fica oculto.

## Desenvolvimento
Cada alteração em `www/`, `package.json` ou no workflow dispara uma nova compilação (depois que os secrets forem configurados). Para compilar apenas quando desejar, também há o botão manual **Run workflow**.

## Fever — recompensa por quedas consecutivas
Ao atravessar **5 aberturas sem pousar**, o personagem entra em Fever durante **1,5 segundo de simulação**. Nesse intervalo, discos comuns e frágeis podem ser quebrados no contato e os pontos recebidos são dobrados. As partes escuras permanecem perigosas; Fever não concede invulnerabilidade.

A barra no HUD mostra as passagens que faltam e, após a ativação, o tempo restante. Pousar antes da ativação zera a carga. O temporizador não avança quando o jogo está pausado. A partir da versão 1.3.1, os níveis têm de 40 a 80 plataformas: 40 nos níveis 1–2, aumentando 6 a cada dois níveis, até o máximo de 80 no nível 15.

## Moedas e aparências — versão 1.4
Cada quatro plataformas concluídas concedem **2 moedas**; finalizar uma fase concede **mais 12 moedas**. As moedas ficam salvas localmente entre partidas e são independentes dos pontos/recorde. Os ganhos não são multiplicados pelo Fever.

No menu inicial, toque em **Aparências** para equipar a Melancia gratuita ou desbloquear Limão (60 moedas), Mirtilo (140) e Morango (260). As aparências mudam exclusivamente a cor e o desenho da bola: não alteram gravidade, colisões, velocidade ou vantagens competitivas. Não existem compras com dinheiro real.

O progresso é salvo em `localStorage` na chave `fall-jump-skins-v1`, separada do recorde anterior `melon-helix-v06-best`. Desinstalar o jogo ou limpar os dados do aplicativo pode apagar esse progresso.

## Missões diárias e conquistas — versão 1.5.1
O menu **Missões e conquistas** mostra três desafios diários rotativos e seis conquistas permanentes. Ao cumprir uma meta, a recompensa **fica disponível para resgate**; toque no botão **Resgatar +N moedas** para receber o prêmio. Cada objetivo é resgatável uma única vez (por dia, nas missões diárias; uma única vez na instalação, nas conquistas permanentes). Objetivos não concluídos mantêm o botão desativado.

A tela mostra um **temporizador HH:MM:SS até a próxima meia-noite local**, quando a seleção das missões diárias e seu progresso são renovados automaticamente. **Missões diárias concluídas mas não resgatadas expiram na renovação**, enquanto as conquistas permanentes continuam disponíveis. A contagem usa o relógio do dispositivo; não exige conexão com a internet.

O estado permanece salvo em `fall-jump-goals-v1` e a carteira em `fall-jump-skins-v1`. A migração preserva todas as recompensas já concedidas automaticamente pela versão 1.5, sem disponibilizá-las outra vez. As moedas do resgate são independentes do Fever. Como o progresso é local, limpar dados ou desinstalar o aplicativo pode apagá-lo.

## Versão 1.6 — Celebrações e visibilidade das recompensas
- Ao concluir uma missão ou conquista, o menu sinaliza quantas recompensas estão prontas para resgate. O painel de objetivos apresenta um resumo de pendências e recompensas recebidas.
- O resgate manual continua obrigatório. Cada resgate dispara uma celebração visual leve com medalha e 12 fragmentos animados por CSS, sem imagens extras nem dependências externas.
- O efeito respeita a preferência do sistema por movimento reduzido (`prefers-reduced-motion`), evitando animações de partículas quando ativado.
- As regras de carteira, metas diárias, horário de renovação e resgate único foram mantidas. Não é necessário converter dados antigos.

## Versão 1.7 — Revisão da experiência de jogo
- **Menu:** botão de Como jogar acessível no painel inicial, sem elementos concorrentes na página de instruções. Na pausa, as instruções ficam disponíveis sem reiniciar a partida.
- **Saída protegida:** sair durante uma tentativa exige confirmação. Continuar é a escolha principal; nenhuma moeda já obtida é apagada.
- **Missões:** duas abas, Diárias e Conquistas, com contagem de resgates disponíveis e botão Voltar no topo. O painel é rolável por toque no Android.
- **Durante a fase:** o HUD mostra quantas plataformas foram vencidas em relação ao total, além da barra de progresso.
- **Ao vencer ou perder:** resumo de plataformas, maior combo da fase e moedas coletadas, incluindo o bônus de 12 moedas por conclusão. A tela é limpa ao começar o nível seguinte.
- **Nova tentativa:** depois de uma derrota, Tentar novamente repete o mesmo nível (com nova semente), reiniciando a pontuação da tentativa. Começar pelo menu inicia uma nova sequência no nível 1.
- Sem modificações de gravidade, controles, limite de plataformas, Fever, progressão de moedas ou assinaturas Android. As verificações automatizadas cobrem os percursos de navegação e resultados.
- Ver `REVISAO_EXPERIENCIA.md` para o roteiro de validação no aparelho.

## Versão 1.7.1 — Correções de navegação identificadas no Android
- Corrigida uma chave de fechamento ausente na regra CSS de `#goalToast`. O erro fazia o Android ignorar parte das regras seguintes, deixando o botão Voltar grande e rosa e empilhando as abas das missões.
- **Aparências, Como jogar e Missões:** apenas um botão Voltar compacto no topo. O botão inferior Voltar ao menu foi ocultado nessas três telas, eliminando a duplicidade.
- **Missões:** abas Diárias e Conquistas ficam lado a lado em um controle segmentado, com destaque discreto na aba selecionada; o botão superior permanece acessível durante a rolagem.
- **Barra de status:** a sobreposição reserva espaço superior e inferior adicional, além dos `safe-area-inset` quando disponíveis, para não encostar na barra de status e nos gestos do Android.
- Estatísticas de partida desnecessárias foram ocultadas apenas nas telas secundárias, abrindo espaço para o conteúdo.
- Testes automatizados verificam chaves CSS equilibradas, layouts fundamentais e existência de um único botão de retorno por tela. Física, pontuação, Fever, lojas, objetivos e dados persistidos não foram alterados.

## Testar e reproduzir níveis
- `npm test` executa a bateria de testes do gerador usando Node.js, sem dependências adicionais.
- Cada fase apresenta uma identificação `FASE #XXXXXXXX` (hexadecimal) na interface.
- Para reproduzir uma fase na versão web, abra `index.html?seed=0xXXXXXXXX` e alcance o mesmo número de nível; o mesmo código de semente gera o mesmo layout para esse nível.
- Sem a opção `seed`, cada nova tentativa utiliza uma configuração diferente dentro de limites equivalentes de dificuldade.
- O verificador simula a queda livre e um limite de rotação plausível para eliminar sequências inadequadas; ele **não garante** que toda fase será fácil para todas as pessoas.

## Segurança e limites
- Nunca publique o `.jks`, senhas nem o Base64 da chave.
- Mantenha um backup offline da mesma chave e das senhas. Se perder a chave, não poderá atualizar instalações existentes pelo mesmo fluxo.
- **Não instale builds debug efêmeras** sobre o aplicativo assinado; use sempre o APK de release do workflow.
- O código web e a assinatura ficam separados; o código do jogo pode evoluir sem mudar a identidade Android.
- O workflow atual gera APK para distribuição manual e teste. A publicação futura via Google Play pode exigir um fluxo separado para AAB.
- **Play App Signing exige uma decisão de chave:** o Google usa uma chave de assinatura do app para entregar APKs aos usuários, que pode ser diferente da chave de upload do AAB. Os APKs atualmente instalados manualmente só poderão receber atualizações da Play Store sem reinstalação se a assinatura distribuída pela loja for compatível com a atual. Antes do primeiro lançamento, planejar cuidadosamente o uso da chave existente no Play App Signing.
- Não enviar o AAB à loja nem configurar assinatura no Play Console sem revisar primeiro os requisitos e o `CHECKLIST_PUBLICACAO.md`.

## Versão 1.8.0 — polimento visual (em validação)
- Refinamento CSS do HUD, botões superiores, abas, painéis, resumos de partida e estados de resgate, incluindo telas pequenas.
- Versão do pacote e cache offline atualizados para 1.8.0.
- Física, gerador, Fever, moedas, skins e missões não foram modificados nesta rodada.
- Aprovação visual e teste de instalação sobre APK anterior continuam pendentes.

## Versão 1.8.1 — primeira rodada de acabamento do Canvas
- Brilho especular e contorno sutil na bola, preservando padrões de skins e squash/stretch existentes.
- Realce discreto nas bordas das plataformas, sem alterar geometria ou colisões.
- Nenhuma biblioteca, imagem ou textura externa adicionada; efeitos feitos no Canvas 2D.
- Pendente: teste automatizado, compilação e avaliação visual em Android antes de considerar a Etapa B concluída.

## Versão 1.8.2 — efeitos de impacto e Fever
- Reflexos em parte das partículas de impacto e dos fragmentos luminosos; sem aumentar os limites de partículas.
- Arco adicional de luz no estado Fever.
- Física, colisões, recompensas e progressão preservadas.
- Compilação e inspeção no aparelho ainda pendentes para esta versão.

## Versão 1.8.3 — atmosfera do cenário
- Dois gradientes radiais translúcidos e estáticos ao fundo, antes da coluna e das plataformas, para acrescentar profundidade sem criar novos objetos de jogo.
- Versão e cache offline atualizados. Mecânicas, colisões e progressão preservadas.
- Aguardando CI e revisão visual em Android; transições ficam para uma rodada posterior.

## Versão 1.8.4 — transições de resultado
- Entrada suave da tela de vitória e derrota, com animações de fundo, painel e resumo.
- Respeita a preferência do sistema por movimento reduzido; não introduz atraso para interagir com os botões.
- Mantém física, recompensas e regras intactas. Aguardando validação CI e teste visual no Android.

## Versão 1.8.5 — revisão da interface Android
- HUD com barra de progresso ajustada à largura disponível e números alinhados.
- Loja com textos mais legíveis e alvos de toque adequados; missões com abas e botões refinados.
- Ajustes para telas estreitas (até 340 px) e baixas (até 560 px), sem alterar regras ou economia.
- Aguardando validação automática e inspeção visual em aparelho.

## Versão 1.8.6 — otimização de renderização
- Gradientes estáticos de fundo, atmosfera e coluna central são criados somente ao ajustar a tela, em vez de serem reconstruídos a cada frame.
- Mantém aparência e física, reduzindo trabalho de criação de objetos Canvas durante partidas.
- Atualizados versão e cache offline; validação de CI e teste de desempenho no dispositivo pendentes.

## Versão 1.9.0 — estabilização (primeira rodada)
- Adicionado teste de regressão que verifica o orçamento de criação de gradientes por quadro, evitando reintroduzir os gradientes estáticos no loop de renderização.
- Identificadores de versão e cache offline atualizados; economia e mecânicas mantidas.
- Revisão de progressão, persistência e equilíbrio permanece em andamento; não considerar lançamento final sem CI e testes em dispositivo.
