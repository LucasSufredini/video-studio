# Instalador para Windows. Rode no PowerShell, dentro da pasta do repositório:
#   powershell -ExecutionPolicy Bypass -File .\install.ps1
$ErrorActionPreference = 'Stop'
$Repo = $PSScriptRoot
$VmHome = Join-Path $env:USERPROFILE '.local\share\video-motion'
$VoiceUrl = 'https://huggingface.co/rhasspy/piper-voices/resolve/main/pt/pt_BR/faber/medium'

function Say($m) { Write-Host "`n== $m" -ForegroundColor Cyan }
function Refresh-Path { $env:Path = [Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' + [Environment]::GetEnvironmentVariable('Path', 'User') }
function Ensure($cmd, $wingetId, $label) {
  if (Get-Command $cmd -ErrorAction SilentlyContinue) { Write-Host "$label ok"; return }
  if (-not (Get-Command winget -ErrorAction SilentlyContinue)) { throw "Falta $label e o winget nao esta disponivel. Instale $label manualmente e rode de novo." }
  Write-Host "Instalando $label com winget..."
  winget install -e --id $wingetId --accept-source-agreements --accept-package-agreements
  Refresh-Path
  if (-not (Get-Command $cmd -ErrorAction SilentlyContinue)) { throw "$label foi instalado, mas ainda nao aparece no PATH. Feche e abra o PowerShell e rode de novo." }
}

Say 'Conferindo requisitos (instala o que faltar)'
Ensure git 'Git.Git' 'Git (o Claude Code usa o Git Bash no Windows)'
Ensure node 'OpenJS.NodeJS.LTS' 'Node.js'
Ensure ffmpeg 'Gyan.FFmpeg' 'FFmpeg'
$py = Get-Command py -ErrorAction SilentlyContinue
if (-not $py) { Ensure python 'Python.Python.3.12' 'Python 3.12'; $PyCmd = 'python' } else { $PyCmd = 'py' }
$nodeMajor = [int]((node --version).TrimStart('v').Split('.')[0])
if ($nodeMajor -lt 18) { throw 'Node.js 18 ou mais novo e necessario.' }

Say 'Ambiente Python (Whisper, voz Piper)'
$VenvPy = Join-Path $VmHome 'venv\Scripts\python.exe'
if (-not (Test-Path $VenvPy)) {
  New-Item -ItemType Directory -Force -Path $VmHome | Out-Null
  if ($PyCmd -eq 'py') { py -3 -m venv (Join-Path $VmHome 'venv') } else { python -m venv (Join-Path $VmHome 'venv') }
}
& $VenvPy -m pip install -q --upgrade pip
& $VenvPy -m pip install -q faster-whisper imageio-ffmpeg piper-tts numpy

Say 'Voz pt-BR (Piper, ~63 MB)'
$Voices = Join-Path $VmHome 'voices'
New-Item -ItemType Directory -Force -Path $Voices | Out-Null
foreach ($f in 'pt_BR-faber-medium.onnx', 'pt_BR-faber-medium.onnx.json') {
  $dst = Join-Path $Voices $f
  if (-not (Test-Path $dst) -or (Get-Item $dst).Length -eq 0) { Invoke-WebRequest -Uri "$VoiceUrl/$f" -OutFile $dst }
}

Say 'Ligando a skill ao Claude Code'
$Skills = Join-Path $env:USERPROFILE '.claude\skills'
New-Item -ItemType Directory -Force -Path $Skills | Out-Null
$Dest = Join-Path $Skills 'video-motion'
if (Test-Path $Dest) {
  $item = Get-Item $Dest -Force
  if ($item.LinkType) { $item.Delete() } else { Rename-Item $Dest ("video-motion.bak-" + (Get-Date -Format yyyyMMddHHmmss)); Write-Host 'Skill antiga guardada como backup.' }
}
New-Item -ItemType Junction -Path $Dest -Target (Join-Path $Repo 'skills\video-motion') | Out-Null
Write-Host "Skill ligada: $Dest -> $Repo\skills\video-motion"

Say 'Pronto. Abra o Claude Code e peca, por exemplo: "edita esse video com animacoes".'
