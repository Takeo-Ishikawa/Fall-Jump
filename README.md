# Fall Jump — Android e HTML5

Jogo casual HTML5/Canvas 2D (versão 1.1), empacotado para Android via Capacitor 7.

Consulte [HISTORICO_DESENVOLVIMENTO.md](HISTORICO_DESENVOLVIMENTO.md) para o registro completo das versões, correções e próximos passos.

Consulte [CHECKLIST_PUBLICACAO.md](CHECKLIST_PUBLICACAO.md) para os itens ainda necessários antes de uma eventual publicação na Google Play.

## Estrutura
- `www/index.html`: código do jogo, mantido independente do Android.
- `scripts/generate_android_icons.py`: gera ícones Android e fixa a orientação vertical durante a compilação.
- `capacitor.config.json`: identidade fixa do aplicativo (`com.takeoishikawa.falljump`).
- `.github/workflows/android-apk.yml`: cria APK de **release assinado** no GitHub Actions.
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

## Gerar o APK
Abra **Actions > Compilar APK atualizavel > Run workflow**. Depois que a compilação terminar, baixe o **APK diretamente em [Releases](https://github.com/Takeo-Ishikawa/Fall-Jump/releases)**, sem extrair ZIP. A seção **Artifacts** também mantém uma cópia compactada por execução.

Quando um novo APK for gerado, instale-o sobre o anterior. O Android manterá os dados do aplicativo quando o ID e a assinatura forem os mesmos, o versionCode for apropriado e a instalação for aceita. O APK não se atualiza sozinho: é preciso baixar e abrir o arquivo novo.

## Desenvolvimento
Cada alteração em `www/`, `package.json` ou no workflow dispara uma nova compilação (depois que os secrets forem configurados). Para compilar apenas quando desejar, também há o botão manual **Run workflow**.

## Segurança e limites
- Nunca publique o `.jks`, senhas nem o Base64 da chave.
- Mantenha um backup offline da mesma chave e das senhas. Se perder a chave, não poderá atualizar instalações existentes pelo mesmo fluxo.
- **Não instale builds debug efêmeras** sobre o aplicativo assinado; use sempre o APK de release do workflow.
- O código web e a assinatura ficam separados; o código do jogo pode evoluir sem mudar a identidade Android.
- O APK é para distribuição manual e teste. Para Google Play, planejar também um AAB assinado e o gerenciamento de assinatura da loja.
