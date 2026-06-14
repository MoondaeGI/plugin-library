# scripts/lib/ppt/export-png.ps1
# 생성된 .pptx를 PowerPoint COM의 Slide.Export로 슬라이드별 PNG로 내보낸다 (스크린샷 아님).
# 사용법: powershell -File scripts/lib/ppt/export-png.ps1 -PptxPath .slides\my-deck\deck.pptx
param(
  [Parameter(Mandatory = $true)][string]$PptxPath,
  [string]$OutDir,
  [int]$Width = 1280
)
$ErrorActionPreference = 'Stop'

if (-not (Test-Path $PptxPath)) { Write-Error "pptx가 없습니다: $PptxPath"; exit 1 }
$pptxFull = (Resolve-Path $PptxPath).Path
if (-not $OutDir) { $OutDir = Join-Path (Split-Path $pptxFull -Parent) 'review' }
New-Item -ItemType Directory -Force $OutDir | Out-Null
$outFull = (Resolve-Path $OutDir).Path
Get-ChildItem $outFull -Filter 'slide-*.png' | Remove-Item -Force

try {
  $app = New-Object -ComObject PowerPoint.Application
} catch {
  Write-Error "PowerPoint COM을 사용할 수 없습니다 (미설치?). deck.pptx는 정상이며, 검수만 수동으로 진행하세요."
  exit 2
}

try {
  # Open(FileName, ReadOnly, Untitled, WithWindow) — 창 없이 읽기 전용으로
  $pres = $app.Presentations.Open($pptxFull, $true, $false, $false)
  $h = [int]($Width * $pres.PageSetup.SlideHeight / $pres.PageSetup.SlideWidth)
  foreach ($slide in $pres.Slides) {
    $png = Join-Path $outFull ('slide-{0:D2}.png' -f $slide.SlideIndex)
    $slide.Export($png, 'PNG', $Width, $h)
  }
  $count = $pres.Slides.Count
  $pres.Close()
  Write-Output "$count 장 export 완료 → $outFull"
} finally {
  $app.Quit()
  [void][Runtime.InteropServices.Marshal]::ReleaseComObject($app)
}
