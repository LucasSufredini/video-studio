# video-studio

Skill do Claude Code para criar e editar vídeos com [Remotion](https://www.remotion.dev): você manda uma gravação ou uma ideia, e o Claude transcreve, monta um plano de cenas, pede sua aprovação e renderiza.

O que ela faz:
- **Edita gravação falando para a câmera:** transcrição com o tempo de cada palavra, corte de pausas e erros, tratamento de áudio, animações presas à fala e legenda palavra por palavra.
- **Vídeo longo com cenas de apoio**, thumbnail e Shorts/Reels tirados do vídeo longo.
- **Vídeos 100% animados, sem gravar:** anúncios em motion (texto cinético, telas de app, números, emojis 3D) e narração com voz sintética.
- **Guias de estilo:** mande vídeos de referência e o Claude escreve um guia para seguir aquele estilo.

## Instalação

Precisa do [Claude Code](https://claude.com/claude-code) instalado.

### Windows

1. Abra o **PowerShell** e baixe o repositório:
   ```powershell
   git clone https://github.com/LucasSufredini/video-studio.git $HOME\video-studio
   cd $HOME\video-studio
   ```
   Sem Git ainda? Instale com `winget install -e --id Git.Git`, feche e abra o PowerShell.
2. Rode o instalador. Ele instala o que faltar (Node.js, FFmpeg, Python) com o `winget`:
   ```powershell
   powershell -ExecutionPolicy Bypass -File .\install.ps1
   ```
3. Feche e abra o terminal, e abra o Claude Code.

### Linux e macOS

```bash
git clone https://github.com/LucasSufredini/video-studio.git ~/projetos/video-studio
~/projetos/video-studio/install.sh
```

Precisa de Python 3.10+, Node.js 18+ e, para os comandos de cenas de apoio e corte vertical, do ffmpeg completo (`apt install ffmpeg` ou `brew install ffmpeg`).

## Como usar

No Claude Code, arraste o vídeo para o chat e peça. Por exemplo:
- "edita esse vídeo com animações"
- "corta as pausas e coloca legenda"
- "faz um anúncio de 30 segundos para o produto X"
- "faz no estilo do guia Y"

O Claude sempre mostra o plano de cenas antes de renderizar. Os projetos ficam em `~/projetos/videos/<nome>/`, e o vídeo pronto em `out/`.

## Atualizar

Quando alguém melhorar a skill:
```bash
cd ~/projetos/video-studio   # no Windows: cd $HOME\video-studio
git pull
```
Não precisa reinstalar: a skill do Claude Code aponta para a pasta do repositório.

## Estrutura

```
install.sh / install.ps1      instaladores
skills/video-motion/
  SKILL.md                    instruções que o Claude segue
  scripts/                    transcrição, cortes, áudio, cenas de apoio, corte vertical
  template/                   projeto Remotion copiado para cada vídeo novo
  styles/                     guias de estilo (os pessoais não vão para o GitHub)
```

## Licenças

- **Remotion** é gratuito para pessoas físicas e empresas de até 3 pessoas. Acima disso, exige licença da empresa: veja [remotion.dev/license](https://www.remotion.dev/license).
- **Emojis** em `template/public/stickers`: Fluent Emoji da Microsoft, licença MIT (arquivo `LICENSE-fluent-emoji.txt`).
- **Voz pt-BR** (Piper, "faber"): baixada pelo instalador do repositório [rhasspy/piper-voices](https://huggingface.co/rhasspy/piper-voices).
