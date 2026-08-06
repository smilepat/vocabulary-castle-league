<#
  repo-ops-guard.ps1 — repo-ops-system 적용 여부 감시 런처 (각 PC에 1회 설치)

  설치 (PC마다 한 번):
    Copy-Item scripts\repo-ops-guard.ps1 "$HOME\.claude\repo-ops-guard.ps1"
    그리고 ~/.claude/settings.json 의 hooks 에 SessionStart / Stop 훅 등록
    (등록 JSON은 REPO_OPS.md "부록: PC 1회 설치" 참조)

  하는 일:
    1. 현재 디렉터리의 git 저장소 루트를 찾는다
    2. scripts/repo-ops-check.ps1 이 있으면 → 그걸 실행 (점검 규칙은 저장소가 소유)
    3. 없으면 → "repo-ops-system 미적용" 경고를 낸다   ← 이 스크립트의 존재 이유
    4. git 저장소가 아니면 → 조용히 통과

  점검 로직을 여기 두지 않는 이유: 로직이 PC마다 갈라지면 안 되기 때문이다.
  규칙은 저장소(git으로 공유)가, 등록은 PC가 담당한다.
#>
[CmdletBinding()]
param(
  [ValidateSet('SessionStart', 'Stop')]
  [string]$HookEvent = 'SessionStart'
)

$ErrorActionPreference = 'Continue'
try { [Console]::OutputEncoding = New-Object System.Text.UTF8Encoding($false) } catch {}

function Write-Quiet { Write-Output '{"suppressOutput":true}'; exit 0 }

$git = (Get-Command git -ErrorAction SilentlyContinue).Source
if (-not $git) {
  foreach ($c in @("$env:ProgramFiles\Git\cmd\git.exe", "$env:LOCALAPPDATA\Programs\Git\cmd\git.exe")) {
    if (Test-Path $c) { $git = $c; break }
  }
}
if (-not $git) { Write-Quiet }

$root = (& $git rev-parse --show-toplevel 2>$null)
if (-not $root) { Write-Quiet }          # git 저장소 밖 — 관리 대상이 아니다
$root = $root -replace '/', '\'

$checker = Join-Path $root 'scripts\repo-ops-check.ps1'
if (Test-Path $checker) {
  & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $checker -HookEvent $HookEvent -RepoRoot $root
  exit 0
}

# --- 여기부터: 이 저장소는 repo-ops-system 관리 밖이다 ---
$name = Split-Path $root -Leaf
$hasRepoOps = Test-Path (Join-Path $root 'REPO_OPS.md')

if ($hasRepoOps) {
  $msg = "[repo-ops] '$name'에 REPO_OPS.md는 있지만 점검 스크립트(scripts\repo-ops-check.ps1)가 없습니다. " +
         "관리 대상 저장소에서 복사해 오세요."
}
else {
  $msg = "⚠ [repo-ops] '$name' 저장소는 **repo-ops-system 관리 대상이 아닙니다** (REPO_OPS.md 없음).`n" +
         "  이 PC($env:COMPUTERNAME)에서 여기 쌓는 작업은 멀티 PC 규율(세션 시작 pull · 작업 단위 commit·push · " +
         "종료 전 STATUS.md 갱신)의 보호를 받지 못하며, 다른 PC에서 진행 상황을 알 수 없습니다.`n" +
         "  편입하려면: REPO_OPS.md + scripts\repo-ops-check.ps1 복사 → CLAUDE.md 첫 줄에 ``@REPO_OPS.md`` → STATUS.md 생성."
}

$out = @{ systemMessage = $msg }
if ($HookEvent -eq 'SessionStart') {
  $out.hookSpecificOutput = @{
    hookEventName     = 'SessionStart'
    additionalContext = "$msg`n`n사용자에게 이 사실을 알리고, 저장소를 repo-ops-system에 편입할지 물어라."
  }
}
Write-Output ($out | ConvertTo-Json -Depth 5 -Compress)
