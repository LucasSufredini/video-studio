---
name: video-motion
description: Transforma uma gravação falando para a câmera (talking head) em vídeo editado com animações sincronizadas à fala, legendas palavra por palavra e render em Remotion. Também cria anúncios 100% animados, sem gravação (texto cinético, telas de app, números, emojis 3D). Use quando o usuário mandar/arrastar um vídeo (.mp4/.mov) e pedir para editar, animar, legendar, "fazer as animações", "montar o vídeo", quando pedir um anúncio, propaganda, vídeo de produto ou motion graphics, ou disser /video-motion.
---

# Video Motion — gravação → animação sincronizada à fala (Remotion)

Pipeline: **preparar (vídeo + transcrição com tempo de cada palavra + frames) → entender → plano de cenas → GATE de aprovação → código Remotion → render**.

Ferramentas já instaladas:
- `~/.claude/skills/video-motion/scripts/new-project.sh <dir>` — cria projeto Remotion a partir de `template/` e roda `npm install`.
- `~/.claude/skills/video-motion/scripts/prepare.sh <video> <dir> [--model small|medium|large-v3] [--frames 6] [--vocab "nomes, termos"]` — copia o vídeo para `public/video.mp4`, escreve `src/data/meta.json`, `src/data/transcript.json` (faster-whisper, word timestamps) e `frames/*.jpg` + `frames/sheet.jpg`.
- `~/.claude/skills/video-motion/scripts/autocut.sh <dir> [--list|--dry-run|--restore] [--max-pause 0.30]` — corta pausas, erros e repetições do vídeo e ajusta os tempos da transcrição.
- `~/.claude/skills/video-motion/scripts/audio.sh <dir> [--restore] [--denoise 10] [--no-compress] [--lufs -14]` — limpa a voz e ajusta o volume ao padrão de Reels/Shorts, sem mexer na imagem.
- `~/.claude/skills/video-motion/scripts/broll.sh <dir> <clipes e fotos...>` — converte cenas de apoio do celular para `public/broll/NN-nome.mp4|jpg` no tamanho do projeto e gera `frames/broll/sheet.jpg` numerada.
- `~/.claude/skills/video-motion/scripts/vertical.sh <entrada> <saida.mp4> [--start S] [--end E] [--x 0.5]` — recorta um trecho de vídeo deitado em 1080x1920 para Shorts, Reels e TikTok.
- ffmpeg, ffprobe e o Python da skill são encontrados por `scripts/env.sh`, em Linux, macOS e Windows (Git Bash). Se faltar algo, rode o instalador do repositório.

## Vídeo longo com cenas de apoio
Fala para a câmera em 16:9 com cenas por cima: siga os passos 1 a 1c com a gravação da fala, depois `broll.sh` com os clipes e fotos e olhe a folha de contato. Em `scenes.tsx`, use `export const captions = false`, cenas `fullscreen: true` com `<Broll src="broll/03-porta.mp4" from={2} />` (`from` pula segundos, `x`/`y` escolhem o enquadramento, `zoom={0}` desliga o zoom lento), e `<KeyPhrase text="..." />` só nas frases-chave. O áudio da fala continua por baixo.

## Thumbnail
Coloque a foto em `public/thumb.jpg`, ajuste `src/thumb-config.ts` (até 3 palavras, lado do texto, palavra de destaque, enquadramento) e rode `npx remotion still Thumb out/thumb.png`. Confira reduzindo: `ffmpeg -i out/thumb.png -vf scale=320:-2 out/thumb-320.png`.

## Shorts a partir do vídeo longo
Escolha 2 ou 3 trechos de 25 a 45 s que se sustentem sozinhos. `vertical.sh out/video.mp4 <shorts>/fonte.mp4 --start S --end E --x <onde está o rosto>`, depois trate cada Short como vídeo novo (passos 1 a 6) para ganhar legenda palavra por palavra na altura do peito.

Em máquina sem placa de vídeo dedicada, use `--model small` por padrão (≈1.5× o tempo do vídeo na CPU). `medium` se a transcrição sair ruim; `large-v3` só se o usuário pedir (lento e pesado).

Guias de estilo: antes de começar, veja `styles/`. Se um guia combinar com o pedido (um canal, um cliente, uma série), leia-o: ele tem prioridade sobre as regras de ritmo e cenas abaixo. Guias pessoais ficam só na máquina de quem os criou (veja `styles/README.md`).

## Anúncio em motion (sem gravação)
Para vídeo só de animação, pule os passos 1 a 2 e use a composição `Promo`.
1. Pergunte: produto, dor do cliente, um número real que dói, promessa, chamada final, cores da marca, formato (16:9 ou 9:16) e se tem locução ou música.
2. Monte o roteiro em cenas de 1,5 a 3,5 s: gancho → dor concreta → conta que dói → virada → logo → produto em uso → frase-síntese → chamada. Em ad, uma ideia por cena e no máximo 8 palavras na tela.
3. Mostre o plano e passe pelo GATE do passo 4.
4. `new-project.sh <dir>`, depois reescreva `src/promo-scenes.tsx` (`promoFormat`, `promoAudio`, `promoScenes`) e troque as cores em `src/components/promo/kit.tsx` pelas da marca. Com locução, transcreva o áudio para ajustar a duração de cada cena à fala.
5. Peças em `src/components/promo/`: `Kinetic` (`*itálico*`, `==marca-texto==`), `Count`, `Sticker`, `Chat`, `Receipt`, `Phone`, `Logo`, `DotReveal`, `Stack`, `CTA`, e os layouts `Split` e `Center`, que empilham sozinhos em 9:16. `Backdrop` entra pelo campo `bg` da cena.
6. Stickers em `public/stickers/<nome>.png` (Fluent Emoji da Microsoft, MIT, 256 px: até 18u em 1080p). Mascote exclusivo não sai daqui: o cliente precisa fornecer a arte.
7. `npx tsc --noEmit`, stills com `npx remotion still Promo out/x.png --frame=<n>` e `npx remotion render Promo out/video.mp4`.
Não copie marca, personagem ou texto de referência. Em anúncio de cliente, números, depoimentos e promessas têm de ser reais; em produto fictício de portfólio, deixe claro que é conceito.

## 1. Preparar
1. Pasta do projeto: se o usuário não disser, use `~/projetos/videos/<nome-do-arquivo-sem-extensão>/`.
2. `new-project.sh <dir>` (pula se já existir), depois `prepare.sh <video> <dir> --vocab "<nomes próprios/termos que aparecem no assunto>"`. Se a fala for em inglês, acrescente `--lang en`. Rode em background se o vídeo tiver mais de ~2 min.
3. Leia `src/data/transcript.json` (segments + words) e **olhe** `frames/sheet.jpg` (e frames individuais se precisar).
4. Corrija erros óbvios da transcrição direto no `transcript.json` (ex.: "cloud" → "Claude"), mantendo os tempos.

## 1b. Cortar (padrão, a menos que o usuário peça o vídeo sem cortes)
Corrija a transcrição (passo 1.4) antes do primeiro corte: depois dele, correções em `transcript.json` se perdem ao cortar de novo.
1. `autocut.sh <dir> --list` mostra cada palavra como `índice:palavra`, com as pausas.
2. Leia a fala inteira e procure o que deve sair: frases recomeçadas (mantenha a **última** tomada, em geral a melhor), erros, gaguejos, muletas ("é...", "tipo", "né", "um", "uh", "you know", "like") que não façam parte da frase, e conversa fora do conteúdo ("gravou?", "vou de novo").
3. Escreva `<dir>/cuts.json`, com intervalos inclusivos: `[{"from": 12, "to": 18, "why": "retomou a frase"}]`. Na dúvida, não corte: nunca tire algo que mude o sentido. Sem nada a remover, não crie o arquivo; as pausas são cortadas mesmo assim.
4. `autocut.sh <dir> --dry-run`: confira o resultado. Se sobrar menos de 50% do vídeo, revise o `cuts.json` antes de continuar. Mostre ao usuário a duração antes e depois e a lista do que sai, com o motivo.
5. `autocut.sh <dir>`: gera o vídeo cortado, com `transcript.json`, `meta.json` e `frames/` atualizados. Os originais ficam em `source/`.
6. Para ajustar depois, edite o `cuts.json` e rode de novo (sempre parte do original); `--restore` volta ao vídeo sem cortes. Use `--max-pause 0.5` para um ritmo mais calmo.

Faça o plano de cenas só depois do corte: os tempos mudam.

## 1c. Tratar o áudio (padrão, a menos que o usuário peça o áudio original)
Depois do corte final, rode `audio.sh <dir>`. Só `public/video.mp4` muda; tempos e transcrição continuam valendo. Refazer o corte desfaz o tratamento, então rode `audio.sh` de novo depois de qualquer novo corte. Pode repetir sem acumular efeito. Se a voz ficar metálica, use `--denoise 5` (ou `--denoise 0` em gravação limpa); `--restore` volta ao áudio original. Em material de cliente, avise que o resultado precisa ser ouvido antes da entrega.

## 2. Entender
Resuma para si: tema, tópicos/etapas e em que segundo cada um começa; onde a pessoa está no quadro (rosto, mãos, áreas livres para overlay); palavras-chave que merecem destaque visual.

## 3. Plano de cenas (mostre ao usuário)
Tabela curta, cada cena ancorada numa palavra falada:

```
00:00  logo se formando              fullscreen   ("Todos")
00:10  card "Whisper" com tempos     fullscreen   ("transcrição")
00:20  palavra gigante GATE          fullscreen   ("gate")
00:28  fila de pedidos chegando      overlay      ("fila")
```

Regras de ritmo: cena nova a cada 2–6 s nos trechos explicativos; deixe o rosto aparecer em pausas e frases de conexão emocional; fullscreen para conceitos, overlay para detalhes rápidos; nada sobre o rosto.

## 4. GATE — obrigatório
**Não escreva código nem renderize antes da aprovação.** Pergunte com AskUserQuestion: "Aprovar o plano antes de renderizar?" → "Sim, renderizar" / "Não, quero ajustar". Se ajustar, aplique o feedback ao plano e pergunte de novo. Isso evita gastar tokens e minutos de render com cenas que vão ser descartadas.

## 5. Código
Reescreva `src/scenes.tsx` a partir do plano aprovado. Contrato:
- `Scene = {name, start, end, fullscreen?, el}` com tempos em segundos do vídeo original.
- Ancore com `wordAt('palavra', ocorrência)` de `src/lib.ts` (ignora acentos/pontuação; lança erro se não achar).
- Dentro de cada cena o tempo é local (frame 0 = início da cena). Helpers: `usePop(delayFrames)`, `useFade(durationInFrames)`, `useSec()`.
- Componentes prontos em `src/components/`: `HeroWord` (palavra gigante serif + círculo/listra), `Terminal` (linhas aparecendo, prompt digitado), `Card` (card escuro com spring), `ProgressCard` (número sobe enquanto uma barra em blocos enche e muda de cor; `from`, `to`, `title`, `image?`, `variant: 'fullscreen' | 'overlay'`; repita ao longo do vídeo, com percentuais crescentes, para dar sensação de jornada), `Captions` (já aplicado globalmente em `Video.tsx`, escondido nas cenas fullscreen).
- Para cenas novas, crie componentes em `src/components/` usando `theme`, `serif`, `sans`, `mono` de `src/theme.ts`. Anime só com `useCurrentFrame`/`interpolate`/`spring` (nada de CSS transitions ou `setTimeout` — não renderizam).
- Imagens/logos extras vão em `public/` e entram com `<Img src={staticFile('x.png')} />`.
- Rode `npx tsc` no projeto e corrija até passar.

## 6. Conferir e renderizar
1. Prévia barata: `npx remotion still Main out/check.png --frame=<n>` em 2–3 momentos-chave e olhe as imagens. Corrija sobreposições (texto em cima do rosto, legenda batendo em card).
2. `npx remotion render Main out/video.mp4` (em background; ~6–7 s de render por segundo de vídeo nesta máquina a 30 fps). Para 60 fps, troque `FPS` em `src/Root.tsx`.
3. Extraia uns frames do resultado (`ffmpeg -ss T -i out/video.mp4 -frames:v 1 ...`) e confira antes de entregar.
4. Informe o caminho do `out/video.mp4` e ofereça `npm run studio` para ajustes visuais ao vivo.

## Ajustes depois do render
Feedback tipo "tira essa seta", "entra mais cedo" → edite só a cena em `scenes.tsx` e renderize só o trecho: `npx remotion render Main out/trecho.mp4 --frames=<ini>-<fim>` para conferir, depois o vídeo inteiro.
