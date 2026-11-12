$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $Root

function Assert-LastExitCode {
  param([string]$Step)
  if ($LASTEXITCODE -ne 0) {
    throw "Fallo en '$Step' (exit code $LASTEXITCODE)."
  }
}

Write-Host "=== 1/4 Clonando repo principal ordo-diei (rama dev) ===" -ForegroundColor Cyan
if (-not (Test-Path "ordo-diei\.git")) {
  git clone --branch dev https://github.com/gbertagnolli-uy/ordo-diei.git ordo-diei
  Assert-LastExitCode "git clone ordo-diei"
} else {
  Write-Host "ordo-diei ya existe, omitiendo clone." -ForegroundColor Yellow
}

Write-Host "=== 2/4 Restaurando public/uploads desde _migracion/uploads ===" -ForegroundColor Cyan
if (Test-Path "_migracion\uploads") {
  $destUploads = Join-Path $Root "ordo-diei\public\uploads"
  New-Item -ItemType Directory -Force -Path $destUploads | Out-Null
  Copy-Item -Path "_migracion\uploads\*" -Destination $destUploads -Recurse -Force
  Write-Host "Uploads copiados a ordo-diei\public\uploads." -ForegroundColor Green
} else {
  Write-Host "No existe _migracion\uploads, omitiendo." -ForegroundColor Yellow
}

Write-Host "=== 3/4 Clonando repos-externos en sus commits exactos ===" -ForegroundColor Cyan
New-Item -ItemType Directory -Force -Path "repos-externos" | Out-Null

$repos = @(
  @{ Name = "bookorbit";  Url = "https://github.com/bookorbit/bookorbit.git";   Commit = "6ad1445dab35757164ed3bf31e83caeb6ba24ad2"; Submodules = $false },
  @{ Name = "Daily_You";  Url = "https://github.com/Demizo/Daily_You.git";      Commit = "7cc237d1dcef24a27ca0f78ad449cc199b61bea3"; Submodules = $false },
  @{ Name = "dovli";      Url = "https://github.com/MayankJha0333/dovli.git";   Commit = "eb453e0225d906fa15e5b0a83d4db340b66c410f"; Submodules = $false },
  @{ Name = "homebranch"; Url = "https://github.com/Oghamark/homebranch.git";   Commit = "281a75ef94ef257d3a158cf58b83b303197a063e"; Submodules = $true  },
  @{ Name = "moodiary";   Url = "https://github.com/ZhuJHua/moodiary.git";      Commit = "2c552ddd7939a054122380397fb914cf000824b0"; Submodules = $false },
  @{ Name = "opencircle"; Url = "https://github.com/devscalelabs/opencircle.git"; Commit = "5a8beada3147c6bd922c44f9cfe5b4a82f1a4056"; Submodules = $false },
  @{ Name = "storypad";   Url = "https://github.com/theachoem/storypad.git";    Commit = "a76825e88740c935458beff404cbb95c889e4e2e"; Submodules = $false }
)

foreach ($r in $repos) {
  $target = Join-Path "repos-externos" $r.Name
  if (-not (Test-Path (Join-Path $target ".git"))) {
    Write-Host "Clonando $($r.Name)..."
    if ($r.Submodules) {
      git clone --recurse-submodules $r.Url $target
    } else {
      git clone $r.Url $target
    }
    Assert-LastExitCode "git clone $($r.Name)"
    git -C $target checkout $r.Commit
    Assert-LastExitCode "git checkout $($r.Name)"
    if ($r.Submodules) {
      git -C $target submodule update --init --recursive
      Assert-LastExitCode "git submodule update $($r.Name)"
    }
  } else {
    Write-Host "$($r.Name) ya existe, omitiendo." -ForegroundColor Yellow
  }
}

Write-Host "=== 4/4 Instalando dependencias npm (ordo-diei y verif-db) ===" -ForegroundColor Cyan
if (Test-Path "ordo-diei\package-lock.json") {
  Push-Location "ordo-diei"
  npm ci
  Assert-LastExitCode "npm ci ordo-diei"
  Pop-Location
}
if (Test-Path "verif-db\package-lock.json") {
  Push-Location "verif-db"
  npm ci
  Assert-LastExitCode "npm ci verif-db"
  Pop-Location
}

Write-Host ""
Write-Host "Listo. Recordá copiar manualmente '.env' y '.env.local' dentro de 'ordo-diei\'." -ForegroundColor Green
