# Fall Jump 3D — Godot 4.6.3

Versão nativa jogável para comparar com a versão Canvas no mesmo celular. Abra **project.godot** no Godot 4.6.3 e pressione **F5**. Não há Capacitor, WebView ou JavaScript em execução no APK Godot. O renderizador é **Compatibility/OpenGL**, com física a 60 Hz e interpolação visual.

## O que foi migrado

- Primeira fase com as mesmas 12 áreas de exploração, agora com malhas e colisões 3D: bifurcações, ilhas, degraus, pontes frágeis e portais.
- Personagem `CharacterBody3D`, cápsula de colisão, caminhada com aceleração curta, salto manual, animação procedural dos membros e câmera orbital interpolada.
- Joystick flutuante por arraste; desaparece ao soltar, cancelar, perder foco ou pausar. Dois toques saltam, inclusive com outro dedo enquanto segura o joystick. Há também um botão Saltar.
- Inimigos patrulhando; três pisões para derrotar, com quique a cada acerto. A espada ataca na última direção de movimento, com alcance e recarga.
- 100 de vida, contato inimigo de 5, queda de 10 na primeira fase e proteção de 1 segundo. Talentos mantêm os bônus anteriores.
- Inventário de seis peças com prévia 3D; espada funcional, roupas cosméticas. Loja de quatro aparências, moedas, talentos, seleção de fases, melhores avanços, conclusão e desbloqueio.
- Moedas opcionais não reaparecem ao retornar à entrada. Duas moedas a cada quatro áreas/plataformas e doze ao concluir a fase.
- Fases 2–999 com gerador **nativo** determinístico por semente, mesma curva de 200–400 plataformas, perigos, patrulhas, azuis frágeis, douradas e Fever de 1,5 segundo após cinco passagens sem pousar. Os desenhos procedurais não são idênticos aos do gerador JavaScript.
- Pausa, Android Voltar, interrupção ao perder foco, minimapa da primeira fase, áudio sintético local, efeitos limitados e ajustes para áreas seguras da tela.

## Controles

Celular: arraste no cenário para caminhar; para os lados contorna a torre, para cima/baixo muda de faixa na fase 1. Dois toques ou **Saltar** fazem um salto. **Golpear** aparece com a espada equipada.

PC: WASD ou setas; Espaço salta, J golpeia, Esc pausa/continua. Também é possível arrastar o mouse e dar dois cliques.

## Desempenho

Apenas a área atual, uma acima e até três abaixo ficam carregadas. Pisos usam `MultiMesh` por geometria/material, evitando uma chamada de desenho para cada peça; colisões são independentes e compartilhadas por formato. Malhas e materiais ficam em cache. Efeitos têm limite de 40 objetos. A torre tem um segmento de colisão curto que acompanha o avanço. Não há texturas remotas, fontes remotas ou luz pontual por cristal.

Isso cria uma base melhor para medir e ajustar o desempenho. **Ainda é necessário comparar no aparelho Android**: a migração, por si só, não comprova ganho de FPS. As validações gráficas no ambiente usam renderização por software Mesa, que não representa a GPU do celular.

## APK separado, sem ZIP

No GitHub Actions, use **Godot 3D - Compilar APK direto**, selecione o branch **feat/godot-3d** e execute. O workflow exporta somente APK, alinha, assina com os quatro secrets `ANDROID_*` existentes, verifica a assinatura e disponibiliza o arquivo `.apk` diretamente em uma pré-release. A versão aumenta a partir das tags `godot-v0.1.0.*`. Os dois workflows Capacitor permanecem intactos.

O aplicativo se chama **Fall Jump 3D**, ID `com.takeoishikawa.falljump.godot`, e requer **Android 7.0/API 24 ou superior**, com ARM de 32 ou 64 bits. Esse ID é deliberadamente separado para instalar ao lado de Fall Jump e comparar as versões sem desinstalar a anterior. Não use o workflow Capacitor para gerar a versão Godot.

Para exportar localmente, instale os templates oficiais de 4.6.3, Java 21 e Android SDK (platform-tools, platforms;android-35, build-tools;35.0.1). Configure as pastas no editor ou com:

```bash
python3 scripts/configure_godot_export.py --version-code 1 --sdk /caminho/android-sdk --java /caminho/jdk-21
mkdir -p dist
godot --headless --path godot --export-release 'Android APK' ../dist/Fall-Jump-Godot.apk
```

O preset local exporta **sem assinatura**, para a assinatura ser feita depois pelo workflow com a chave permanente. O arquivo local sem assinatura não é instalável. Nenhuma chave privada faz parte do projeto.

## Progresso e limites desta migração

O Godot salva em `user://progress-v1.json`, com gravação temporária e cópia de recuperação `.bak`. O armazenamento é independente do `localStorage`/WebView da versão anterior: **não há transferência automática de moedas, equipamentos ou progresso**. O jogo Canvas e seus dados continuam disponíveis no aplicativo anterior. A migração automática desses dados exige uma etapa própria antes de substituir o aplicativo original.

Missões diárias/conquistas e os efeitos visuais detalhados da versão Canvas ainda não foram portados. O personagem e os equipamentos usam modelos procedurais leves; a interface e a câmera são nativas. Esta entrega permite jogar e avaliar a base 3D antes de substituir a distribuição existente.

## Validação

Na raiz do repositório:

```bash
bash scripts/check_godot.sh
# Alternativa para outra instalação da engine:
GODOT_BIN=/caminho/godot bash scripts/check_godot.sh
```

A verificação importa o projeto e rejeita erros de script, testa persistência/recuperação, joystick/multitoque, física nativa de salto, pausa, dano, três pisões, espada, moedas, pontes frágeis e conclusão. Ela percorre as 12 áreas com o controlador real `CharacterBody3D`, confirma o desbloqueio da fase 2 e os limites de carregamento e desenho. Os saves dos testes ficam em arquivos próprios, sem sobrescrever o progresso do jogador.

`tests/visual_smoke.gd` captura menu, inventário, partida, zigue-zague e pausa usando um display OpenGL real:

```bash
godot --path godot --script res://tests/visual_smoke.gd -- /tmp 320 568
```

Há um preset **Web preview** para verificar o projeto exportado em navegador com WebGL 2, sem threads. Ele não é a base do APK. Os testes JavaScript da versão anterior continuam em `npm test`.

A fonte das áreas da fase 1 continua em `www/course.js`. Após editar os percursos, execute `node scripts/sync_godot_course.cjs` e valide novamente o Godot. O arquivo JSON contém apenas dados; o aplicativo nativo não precisa de Node.js.
