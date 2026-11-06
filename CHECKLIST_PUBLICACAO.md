# Checklist de publicação — Fall Jump

Status: **preparação inicial**. O APK atual serve para testes e distribuição manual; não significa que o aplicativo esteja aprovado ou pronto para publicação na Google Play.

## Identidade e materiais
- [x] Nome do projeto e identificador Android fixos (`com.takeoishikawa.falljump`).
- [x] Compilação Android assinada automaticamente com chave permanente.
- [x] Atualizações instaláveis sobre a versão anterior, mantendo mesmo certificado e aumento do `versionCode`.
- [x] Ícone launcher próprio gerado na compilação (versão 1.1).
- [ ] Revisar ícone em diferentes launchers e tamanhos de tela.
- [ ] Produzir screenshots reais de telas jogáveis e banners de divulgação.
- [ ] Definir nome, descrição curta e descrição longa da ficha da loja.

## Qualidade
- [ ] Testar em aparelhos Android diferentes, inclusive 60, 90 e 120 Hz.
- [ ] Conferir entrada por toque, pausa/resume, som, colisões, telas e recordes.
- [ ] Testar instalação do novo APK por cima do anterior, sem perda de dados.
- [ ] Confirmar funcionamento offline e após reinicialização.
- [ ] Revisar acessibilidade, legibilidade e desempenho em aparelhos de entrada.

## Segurança, privacidade e publicação
- [ ] Preparar política de privacidade publicada em URL acessível, refletindo o comportamento efetivo do app.
- [ ] Auditar permissões do Android e dependências adicionadas antes da publicação.
- [ ] Preencher formulários aplicáveis de segurança de dados, classificação etária e público-alvo na Google Play.
- [ ] Revisar requisitos atuais de target API level, testes e contas no Google Play Console.
- [ ] Confirmar em uma execução bem-sucedida a geração e verificação de um Android App Bundle (`.aab`) assinado (workflow já configurado para gerar os dois formatos).
- [ ] Definir no Play App Signing qual chave assinará os APKs distribuídos, considerando os APKs de teste instalados manualmente; a chave de upload do AAB pode ser diferente da chave de assinatura da loja.
- [ ] Testar distribuição interna/fechada antes de solicitar publicação geral.

## Manutenção
- Nunca mudar o application ID nem substituir a chave atual sem planejar as consequências para a atualização das instalações existentes.
- Manter o `versionCode` crescente e as versões registradas em `HISTORICO_DESENVOLVIMENTO.md`.
- Preservar a base HTML5/Canvas 2D independente do empacotamento Capacitor.

O objetivo da próxima rodada é confirmar o APK 1.1 em um dispositivo real e, posteriormente, completar os itens de publicação, sem prometer que todos já foram atendidos.
