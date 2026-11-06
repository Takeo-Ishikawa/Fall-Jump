# Histórico do projeto — Fall Jump

Última atualização documental: 2026-11-06.

## Visão geral
Fall Jump é um jogo casual mobile de bola saltitante inspirado no gênero Helix Jump. A bola cai e quica automaticamente sobre plataformas anulares em torno de uma coluna central; o jogador gira a torre horizontalmente por toque para alinhar aberturas, evitar áreas perigosas e avançar pelos níveis. O visual utiliza uma temática de melancia. A versão web original é independente da camada Android.

## Evolução do protótipo
| Versão | Implementações e decisões |
| --- | --- |
| 0.1 | Protótipo HTML5 com bola, torre giratória, pontuação e controles de toque. O primeiro desenho apresentou sobreposição excessiva dos discos. |
| 0.2 | Reconstrução da perspectiva, coluna central e plataformas separadas. Jogabilidade aprovada pelo usuário. |
| 0.3–0.3.1 | Partículas, sombras, câmera e animações. Corrigido erro de renderização que ocultava bola e plataformas. |
| 0.3.2–0.3.4 | Ajustes da interface, texturas, espaçamento, posicionamento da bola, colisão e ordem de desenho. Corrigido possível desaparecimento intermitente de discos. |
| 0.4–0.4.1 | Níveis progressivos, combos, plataformas especiais azuis (quebráveis), douradas (bônus) e regiões perigosas. Corrigido defeito que quebrava as azuis mesmo quando a bola atravessava a abertura. |
| 0.5–0.5.1 | Sons gerados no navegador, efeitos de impacto e fragmentação visível de plataformas azuis. Validado pelo usuário. |
| 0.6 | Menu inicial, pausa, tela de derrota/conclusão e recorde local no navegador. |
| 0.7 | Adaptação mobile, limite de resolução interna, controle de partículas, pausa ao ocultar a página e preparação PWA/Android. Versão visual e jogável aprovada pelo usuário. |
| 0.8 | Importação do HTML5 0.7 para `www/index.html`, configuração do Capacitor 7, identidade Android estável, assinatura permanente via segredos no GitHub, compilação de release e publicação de APK direto em GitHub Releases. |

**Nota de rastreabilidade:** as versões 0.1–0.7 foram desenvolvidas e testadas iterativamente antes da importação ao GitHub. Este repositório contém a base importada 0.7, não o histórico Git granular dessas versões. Para o futuro, as alterações serão registradas em commits.

## Ajuste posterior à versão Android 0.8 — contato visual da bola
- Relato de teste no Android: a bola parecia quicar antes de atingir a plataforma.
- Causa provável identificada no código: a posição vertical desenhada da bola era fixa (`ballScreenY`), enquanto a câmera acompanhava a física com atraso; o cálculo de colisão também ignorava a escala vertical da projeção.
- Correção: a bola agora é desenhada com `project(ballX, ballZ, ballY)`, usando a mesma transformação dos discos; o contato físico usa `contactRadius = radius / verticalScale`, compatível com o raio visual em pixels, e a câmera usa a profundidade correta.
- Mantidas as regras de colisão por abertura, plataformas quebráveis, sons, pontuação e assinatura Android.
- **Status:** código publicado; a precisão visual do contato ainda depende de validação no APK de celular.

## Fall Jump 0.9 — Progressão e sequências (2026-11-06)
- Quatro famílias de padrões de aberturas: iniciante (fase 1), espiral, zigue-zague e alternado; variação gradual dos ângulos para diferenciar as fases.
- Quantidade de plataformas cresce de 10 até 14, em etapas de três níveis.
- Aberturas ficam gradualmente menores, com limite mínimo de 0,76 radiano; zonas perigosas são limitadas para evitar aumento descontrolado da dificuldade.
- Recompensas adicionais de sequência ao atravessar 3 (+20), 5 (+50) e 8 (+100) plataformas sem quicar. Indicador visual exibe o marco e bônus.
- Mantida a física do contato corrigida na versão 0.8, com a mesma assinatura Android e o mesmo applicationId.
- `package.json` passa a 0.9.0, workflow passa a nomear APK, Release e versionName como 0.9.<run_number>.
- **Status:** JavaScript validado sintaticamente; teste no APK de dispositivo real ainda necessário.

## Fall Jump 1.0 — Polimento técnico (2026-11-06)
- Simulação atualizada para passos fixos de 60 Hz, independente da taxa de atualização do aparelho (60/90/120 Hz). O desenho continua usando `requestAnimationFrame`.
- Acumulador de tempo limitado a 50 ms por frame e até três passos por atualização, evitando saltos grandes de física depois de pausas ou travamentos.
- Preferência de som agora persiste em `localStorage` entre sessões e inicializa o botão corretamente.
- Física do contato, disposição da torre, especiais, pontuação, câmera e assinatura Android preservadas.
- Pacote e nomenclatura do APK/release atualizados para 1.0. O `applicationId`, chave permanente e sequência de `versionCode` continuam iguais para instalar a atualização por cima da anterior.
- **Validação:** sintaxe do JavaScript confirmada; comportamento no celular ainda depende de teste após compilação.

## Fall Jump 1.1 — Polimento visual e preparação Android (2026-11-06)
- Menu redesenhado com tipografia, contraste, cores e estrutura visual mais consistentes com a temática da melancia.
- Alvos de toque de ajuda, som e pausa ampliados para 44 px; indicador de pontuação e progresso reorganizado para melhorar a leitura no celular.
- Legenda de plataformas na tela inicial e na ajuda, distinguindo plataformas normais, frágeis, bônus e perigosas.
- Gerador reproduzível de ícones Android em `scripts/generate_android_icons.py`, executado no CI após o Capacitor preparar o projeto; também fixa orientação vertical do app pelo AndroidManifest.
- Mantidas todas as mecânicas anteriores: física de contato, combos, dificuldade, som e recordes.
- Identidade Android `com.takeoishikawa.falljump`, keystore, versionCode crescente e assinatura permanecem inalterados para permitir atualização sobre o APK anterior.
- Documento `CHECKLIST_PUBLICACAO.md` criado para registrar o que ainda falta antes de eventual lançamento na Google Play.
- **Validação:** revisão e sintaxe JavaScript confirmadas; build Android e testes de aparência em dispositivo real ainda devem ser conferidos.

## Preparação de APK e AAB simultâneos (2026-11-06)
- Workflow do GitHub Actions expandido para gerar os dois formatos de release em uma execução: `./gradlew --no-daemon assembleRelease bundleRelease`.
- `.apk` para instalação direta e testes; `.aab` (Android App Bundle) para eventual envio ao Google Play Console, **não instalável diretamente**.
- O APK continua verificado pelo `apksigner`; o AAB passa por verificação de assinatura com `jarsigner`, antes de ambos serem disponibilizados em GitHub Releases e Artifacts.
- Preservados o `applicationId` (`com.takeoishikawa.falljump`), a chave privada permanente e o `versionCode` baseado em `github.run_number`; nenhuma alteração de mecânica ou física do jogo.
- **Atenção à loja:** o Play App Signing distingue chave de upload e chave de assinatura da distribuição. Para permitir futura atualização pela Play Store por cima dos APKs instalados manualmente, a assinatura dos APKs finais distribuídos precisa ser compatível com a chave atual. Essa decisão deverá ser feita antes da publicação inicial.
- **Validação:** execução nº 19 concluída com sucesso em 2026-11-06; APK e AAB versão 1.1.19 gerados, assinaturas verificadas e ambos publicados em Releases.

## Fall Jump 1.2 — Gerador híbrido de níveis (2026-11-06)
- Novo módulo isolado em `www/level-generator.js`; o jogo permanece em Canvas 2D e carrega o gerador como recurso local, sem dependência de rede.
- Biblioteca de seis padrões modulares: `spiral`, `zigzag`, `plunge`, `switchback`, `rest` e `precision`. Cada fase combina diversos segmentos com variações angulares controladas.
- Dificuldade dividida em ciclos de cinco momentos: aprendizado, ritmo, técnica, desafio e respiro; continua aumentando em faixas de níveis sem crescimento ininterrupto.
- Aberturas ajustadas conforme dificuldade, com limites de largura; perigos e plataformas especiais distribuídos com espaçamento mínimo, evitando repetição imediata.
- Cada fase usa uma semente numérica reproduzível. A interface mostra o código hexadecimal `FASE #XXXXXXXX`. O parâmetro `?seed=0xXXXXXXXX` permite gerar a mesma configuração para um determinado nível; sem parâmetro, cada nova tentativa usa semente diferente.
- Validação conservadora simula a gravidade `0.32`, limite de queda `14`, espaçamento `137`, raio de contato do jogo e rotação plausível de `0.11` rad/frame. Rejeita uma fase sem rota de queda livre com margem interna de `0.09` radiano. A simulação não substitui teste humano de dificuldade; permite encontrar sequências claramente inadequadas.
- Fallback seguro caso diversas tentativas do gerador não sejam aceitas.
- Testes em `tests/level-generator.test.cjs` verificam reprodutibilidade, diversidade, padrões legais e viabilidade simulada em 1.500 configurações; o GitHub Actions executa esses testes antes da compilação Android.
- `www/sw.js` atualizado para o cache offline também incluir o novo módulo.
- Preservados controles, física e colisões já aprovados, efeitos especiais, recordes, application ID e assinatura Android. `package.json` e a publicação APK/AAB avançam para 1.2.
- **Validação:** execução nº 25 concluída com sucesso: testes do gerador, compilação APK/AAB, verificação das assinaturas e publicação de ambos em Releases. Resta validar o equilíbrio e os controles em dispositivo real.

## Fall Jump 1.2.1 — Torres mais longas e variação de ritmo (2026-11-06)
- Ajuste solicitado após teste: as fases anteriores de 10–14 plataformas pareciam curtas e pouco diferentes; a sequência de quedas por várias plataformas foi aprovada.
- Quantidade de plataformas ampliada: níveis 1–2 = 24; 3–4 = 28; 5–6 = 32; 7–8 = 36; 9–10 = 40; 11–12 = 44; nível 13 em diante = 48.
- Padrões modulares tornados mais contrastantes. `plunge` alinha de 4 a 7 plataformas para combos extensos; `spiral` exige rotação contínua; `zigzag` e `switchback` invertem o sentido com maior amplitude; `precision` reduz a folga; `rest` alivia o ritmo.
- Pesos de escolha variam conforme os cinco ciclos de dificuldade: alguns níveis favorecem combos, outros precisão ou mudanças de direção. Cada fase continua usando semente reproduzível.
- Plataformas de descanso/queda livre apresentam menos zonas perigosas; especial dourada favorece combos. Os limites de segurança e a simulação física de travessia permanecem ativos.
- Testes automáticos ampliados para conferir a nova contagem de 24 a 48 plataformas e a presença de trechos longos. Verificação adicional de 1.800 configurações realizada sem fases inválidas ou fallback.
- Nenhuma alteração nos controles, colisão, identidade de aplicativo, chave de assinatura ou criação de APK/AAB.
- **Status:** alterações no repositório; confirmar a nova compilação e avaliar diversão, duração de fase e dificuldade em aparelho real antes de prosseguir para Fever.

## Fall Jump 1.3 — Sistema Fever (2026-11-06)
- Adicionado `www/fever.js` para controlar carga, ativação, temporizador e multiplicador de pontos de forma separada da física do jogo.
- **Ativação:** cinco passagens por aberturas sem quicar enchem a barra; uma quicada antes da ativação zera a carga parcial.
- **Duração:** 240 passos físicos a 60 Hz (aproximadamente 4 segundos). O cronômetro é pausado junto com a simulação quando o jogo é pausado ou fica em segundo plano.
- **Efeito:** enquanto ativo, o Fever permite romper plataformas normais, douradas e frágeis ao contato, mantendo a velocidade de queda e o sistema de colisões já aprovados. A quebra gera fragmentos com cores correspondentes.
- **Risco preservado:** setores escuros continuam fatais durante o Fever. A prioridade da colisão é abertura → perigo → quebra (Fever ou azul) → quique.
- **Recompensas:** pontuação em dobro durante o Fever, incluindo combos e pontos de plataformas especiais. Não há recarga automática enquanto o efeito está ativo; ao terminar, é necessário completar outra sequência de cinco aberturas.
- **Interface:** barra de carga e tempo restante, brilho amarelo ao redor da bola, mensagem de ativação, efeitos sonoros e atualização das instruções.
- `tests/fever.test.cjs` verifica ativação, duração, reinício, multiplicador e prioridade dos perigos. O CI executa os testes das fases e do Fever antes de gerar APK/AAB.
- `www/sw.js` inclui o módulo Fever no cache offline. Preservados `com.takeoishikawa.falljump`, a assinatura permanente, recordes e `versionCode` crescente.
- **Validação:** execução nº 40 concluída com sucesso; testes do Fever, gerador de níveis e inicialização/renderização do jogo passaram; APK e AAB assinados e publicados na Release v1.3.40. Resta avaliar a sensação do Fever no celular.

## Fall Jump 1.3.1 — Balanceamento do Fever e extensão das fases (2026-11-06)
- Ajuste após teste em celular: quatro segundos de Fever duravam demais em relação ao comprimento das fases, permitindo destruir quase a torre inteira.
- Fever reduzido de 240 para **90 passos físicos a 60 Hz (1,5 segundo)**, mantendo os cinco vãos exigidos para ativação, o multiplicador de pontuação x2 e a prioridade das áreas escuras.
- Torres ampliadas de **24–48 para 40–80 plataformas**. Níveis 1–2: 40; 3–4: 46; 5–6: 52; 7–8: 58; 9–10: 64; 11–12: 70; 13–14: 76; 15 em diante: 80.
- Padrões modulares, validação da rota de queda, distribuição espaçada de perigos, cálculo de combos e regras de colisão preservados.
- Atualizados os testes do gerador, a duração do Fever, as instruções exibidas no jogo, versão de pacote e workflow APK/AAB; cache PWA incrementado para evitar arquivos desatualizados.
- Identidade Android, assinatura e versionCode crescente preservados.
- **Validação:** execução nº 41 concluída com sucesso; testes do gerador e do Fever aprovados, APK e AAB assinados e publicados em Releases como v1.3.1.41. Resta validar o ritmo da nova duração e das torres maiores no celular.

## Fall Jump 1.4 — Coleção de bolas e moedas persistentes (2026-11-06)
- Implementado `www/skins.js` com dados das quatro aparências, armazenamento local e lógica de desbloqueio/equipamento sem compras reais.
- Ganhos: duas moedas por cada quatro plataformas ultrapassadas, mais doze moedas ao concluir a fase. Ganhos independentes dos pontos e sem multiplicação pelo Fever.
- Aparências: Melancia padrão (gratuita), Limão (60 moedas), Mirtilo (140) e Morango (260). Apenas cores e padrões gráficos da bola mudam; física, colisão, raio de contato e demais mecânicas são preservadas.
- Menu com botão de Aparências, catálogo acessível, indicação de moeda disponível, estado de seleção e mensagens de compra/equipamento. HUD indica a quantidade atual de moedas.
- Estado salvo em `localStorage` sob `fall-jump-skins-v1`, separado do recorde existente, com tratamento de dados inválidos e ausência de acesso ao armazenamento.
- Novos testes de loja, persistência, custos e recompensas em `tests/skins.test.cjs`, além da ampliação do teste de inicialização e cache offline do PWA.
- **Validação técnica:** execução nº 45 concluída com sucesso; testes de moedas, loja, inicialização/renderização, Fever e gerador aprovados, APK e AAB assinados e publicados em Releases como v1.4.45. Ainda é necessário testar a aparência e o desbloqueio no dispositivo Android.

## Fall Jump 1.5 — Missões e conquistas offline (2026-11-06)
- Adicionado `www/goals.js` para acompanhar três missões diárias rotativas e seis conquistas permanentes. As metas incluem plataformas atravessadas, Fever, combos, bônus, quebras e fases concluídas.
- Recompensas em moedas concedidas automaticamente ao atingir uma meta; cada missão diária paga uma única vez por dia, e cada conquista permanente paga uma única vez durante a instalação.
- Seleção diária determinística pelo calendário local do aparelho, com progresso salvo em `localStorage` (`fall-jump-goals-v1`). A data diária só avança, evitando recriação de recompensas ao retroceder o relógio.
- Interface no menu inicial: botão **Missões e conquistas**, três metas diárias, seis conquistas, progresso individual e recompensa associada. Um aviso visual confirma prêmios recebidos durante o jogo.
- Contadores obtidos dos eventos reais de jogo: plataforma, quebra, Fever ativado, combo de cinco, bônus dourado e vitória. Conquistas de combos utilizam o recorde de combo observado na versão 1.5.
- Preservados o sistema de skins, carteira existente, recordes, gerador de 40 a 80 plataformas, Fever de 1,5 segundo, física/colisão e identidade/assinatura Android.
- Novos testes em `tests/goals.test.cjs` verificam entrega única, virada do dia, proteção contra dados inválidos, persistência e acúmulo. O teste de inicialização verifica a navegação do menu de missões.
- Cache offline atualizado; versão, workflow de APK/AAB e README atualizados.
- **Validação:** execução nº 50 concluída com sucesso: testes do gerador, Fever, aparências, missões/conquistas e inicialização do jogo passaram; APK e AAB assinados e publicados como v1.5.50. Resta avaliar a interface e as recompensas no aparelho Android.

## Fall Jump 1.5.1 — Resgate manual e relógio das missões diárias (2026-11-06)
- Conforme solicitado, cumprir missões e conquistas não credita moedas imediatamente: o objetivo passa para estado **PRONTA**, com botão **Resgatar +N**. O resgate paga uma única vez e altera o botão para **Resgatada**.
- Mantidas no armazenamento as listas antigas `awards` e `daily.claimed`, portanto as recompensas entregues automaticamente na 1.5 continuam resgatadas, sem duplicação na atualização.
- Tela de objetivos exibe contagem regressiva **HH:MM:SS** calculada pela meia-noite local, atualizada a cada segundo enquanto a tela está aberta. Missões diárias são renovadas ao cruzar o dia (sem servidor); recompensas diárias não resgatadas expiram, mas conquistas permanentes continuam disponíveis.
- Separadas no módulo `www/goals.js` as ações `record` (atualiza progresso) e `claim` (valida meta, registra o resgate e retorna a recompensa). A interface só credita moedas após salvar o resgate.
- Testes incluem pagamento único, permanência após reiniciar, migração da versão anterior, expiração no reset e horário local/DST; teste de inicialização confere temporizador e botões.
- Versão, README, histórico e cache PWA atualizados. Chave Android, ID do aplicativo, progressão, Fever e colisões inalterados.
- **Status:** validar pipeline de APK/AAB e comportamento em aparelho real.

## Arquitetura atual
- `www/index.html`: jogo completo HTML5/Canvas 2D (base 0.7 aprovada).
- `www/manifest.webmanifest`, `www/sw.js`, `www/icons/icon.svg`: recursos web e PWA.
- `package.json`, `capacitor.config.json`: empacotamento Android.
- `.github/workflows/android-apk.yml`: CI que gera APK de release assinado, verifica a assinatura, envia artifact e publica APK diretamente em uma Release.
- `README.md`: instruções de compilação, atualização e segurança.

## Identidade e atualização Android — não modificar inadvertidamente
- Application ID: `com.takeoishikawa.falljump`.
- **Mesma chave de assinatura** em todas as versões. O arquivo e suas senhas são privados; no GitHub são configurados como `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS` e `ANDROID_KEY_PASSWORD`.
- O `versionCode` usa `github.run_number`: aumenta a cada execução do workflow. Não reiniciar ou reduzir a numeração sem plano de migração.
- O APK de release deve instalar sobre uma versão anterior com o mesmo application ID e certificado, desde que o `versionCode` seja aceito. Dados e recordes locais normalmente são preservados.
- Nunca enviar a chave privada, suas senhas ou seu Base64 ao repositório público.

## Compilação automatizada e incidentes
- Execuções iniciais 1–5: falha na preparação do SDK, por tentativa de instalar pacote inexistente `tools`.
- Alteração para `android-actions/setup-android@v4` com `packages: 'platform-tools'`: resolveu a preparação do SDK.
- Execução 6: falha no Gradle porque o caminho da chave estava ausente do ambiente da etapa de compilação. Corrigido repassando `KEYSTORE_FILE` e credenciais à etapa Gradle.
- Execução 7: **sucesso**, primeiro APK assinado gerado.
- Execução 8: **sucesso**, com publicação direta do APK em GitHub Releases (sem precisar descompactar artifact).
- Downloads: https://github.com/Takeo-Ishikawa/Fall-Jump/releases
- Execuções: https://github.com/Takeo-Ishikawa/Fall-Jump/actions

## Próximos passos sugeridos
1. Instalar o APK da Release no dispositivo real e conferir tela cheia, áudio, toque, pausa e desempenho.
2. Gerar uma atualização subsequente e instalar **por cima** da anterior, validando persistência de pontuação e recorde.
3. Registrar defeitos observados e corrigir a base HTML5 sem trocar o identificador ou a assinatura Android.
4. Se desejar publicar na Play Store, preparar AAB, políticas, identidade visual e distribuição apropriada.

## Critérios para alterações futuras
- Manter a física da bola e a regra correta de quebra da plataforma azul (somente por colisão, nunca por passagem na abertura).
- Não sacrificar clareza visual, espaçamento e estabilidade das plataformas por efeitos extras.
- Priorizar versões pequenas, testáveis no celular, e registrar correções aqui.
- Atualizar este histórico e o README quando houver marcos técnicos, mudanças de arquitetura ou problemas relevantes.
