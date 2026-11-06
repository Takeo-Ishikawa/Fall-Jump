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
