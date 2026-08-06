<#
  repo-ops-check.ps1 — 이 저장소가 repo-ops 규율대로 관리되고 있는지 점검한다.

  ~/.claude/repo-ops-guard.ps1(각 PC에 1회 설치되는 런처)이 Claude Code 훅에서 호출한다.
  점검 로직은 **저장소 안**에 있으므로 git pull만 하면 모든 PC가 같은 규칙으로 점검받는다.

  출력: Claude Code 훅 JSON 한 줄. 문제가 없으면 조용히 종료한다.
#>
[CmdletBinding()]
param(
  [ValidateSet('SessionStart', 'Stop')]
  [string]$HookEvent = 'SessionStart',

  [string]$RepoRoot
)

$ErrorActionPreference = 'Continue'
try { [Console]::OutputEncoding = New-Object System.Text.UTF8Encoding($false) } catch {}

function Write-HookResult {
  param([string[]]$Problems)

  if (-not $Problems -or $Problems.Count -eq 0) {
    Write-Output '{"suppressOutput":true}'
    exit 0
  }

  $body = ($Problems | ForEach-Object { "  - $_" }) -join "`n"
  $msg = "[repo-ops] 규율에서 벗어난 항목이 있습니다 ($HookEvent):`n$body"

  $out = @{ systemMessage = $msg }
  if ($HookEvent -eq 'SessionStart') {
    $out.hookSpecificOutput = @{
      hookEventName    = 'SessionStart'
      additionalContext = "$msg`n`n위 항목을 사용자에게 알리고, REPO_OPS.md 규율대로 처리할지 확인하라."
    }
  }
  Write-Output ($out | ConvertTo-Json -Depth 5 -Compress)
  exit 0
}

# --- git 찾기 (PATH에 없는 PC가 있다) ---
$git = (Get-Command git -ErrorAction SilentlyContinue).Source
if (-not $git) {
  foreach ($c in @("$env:ProgramFiles\Git\cmd\git.exe", "$env:LOCALAPPDATA\Programs\Git\cmd\git.exe")) {
    if (Test-Path $c) { $git = $c; break }
  }
}
if (-not $git) { Write-HookResult @('git을 찾을 수 없어 점검을 못 했습니다. PATH 또는 전체 경로를 확인하세요.') }

if (-not $RepoRoot) {
  $RepoRoot = (& $git rev-parse --show-toplevel 2>$null)
  if (-not $RepoRoot) { Write-HookResult @() }   # git 저장소가 아니면 조용히 통과
}
$RepoRoot = $RepoRoot -replace '/', '\'

$problems = New-Object System.Collections.Generic.List[string]
$pcName = $env:COMPUTERNAME

# --- 1. 규율 문서가 저장소에 있는가 ---
$repoOps = Join-Path $RepoRoot 'REPO_OPS.md'
if (-not (Test-Path $repoOps)) {
  $problems.Add('REPO_OPS.md가 없습니다 — 이 저장소는 repo-ops-system 관리 대상이 아닙니다.')
}

$claudeMd = Join-Path $RepoRoot 'CLAUDE.md'
if (-not (Test-Path $claudeMd)) {
  $problems.Add('CLAUDE.md가 없습니다 — 규율이 세션에 자동 로드되지 않습니다.')
}
elseif (-not (Select-String -Path $claudeMd -Pattern '@REPO_OPS\.md' -Quiet)) {
  $problems.Add('CLAUDE.md가 `@REPO_OPS.md`를 임포트하지 않습니다 — 규율이 로드되지 않습니다.')
}

# --- 2. git 신원 ---
$uName = (& $git -C $RepoRoot config user.name 2>$null)
$uMail = (& $git -C $RepoRoot config user.email 2>$null)
if (-not $uName -or -not $uMail) {
  $problems.Add('git user.name/user.email이 설정되지 않았습니다 — 커밋이 실패합니다.')
}

# --- 3. 원격 동기화 상태 ---
$branch = (& $git -C $RepoRoot rev-parse --abbrev-ref HEAD 2>$null)
$upstream = (& $git -C $RepoRoot rev-parse --abbrev-ref '@{u}' 2>$null)

if (-not $upstream) {
  $problems.Add("현재 브랜치 '$branch'에 원격 추적 브랜치가 없습니다 — 작업이 다른 PC로 전달되지 않습니다.")
}
else {
  if ($HookEvent -eq 'SessionStart') { & $git -C $RepoRoot fetch --quiet 2>$null | Out-Null }

  $counts = (& $git -C $RepoRoot rev-list --left-right --count "$upstream...HEAD" 2>$null)
  if ($counts -match '^\s*(\d+)\s+(\d+)') {
    $behind = [int]$Matches[1]
    $ahead = [int]$Matches[2]
    if ($behind -gt 0) {
      $problems.Add("origin보다 $behind 커밋 뒤처져 있습니다 — 먼저 ``git pull --ff-only`` 하세요.")
    }
    if ($ahead -gt 0) {
      $problems.Add("push하지 않은 커밋이 $ahead 개 있습니다 — 다른 PC에서는 존재하지 않는 작업입니다.")
    }
  }
}

# --- 4. 커밋되지 않은 변경 ---
$dirty = @(& $git -C $RepoRoot status --porcelain 2>$null | Where-Object { $_ })
if ($dirty.Count -gt 0) {
  $verb = if ($HookEvent -eq 'Stop') { '작업 단위마다 commit·push 하세요' } else { '이전 세션이 커밋하지 않고 끝난 것 같습니다' }
  $problems.Add("커밋되지 않은 변경이 $($dirty.Count)개 있습니다 — $verb.")
}

# --- 5. STATUS.md 상태 ---
$statusMd = Join-Path $RepoRoot 'STATUS.md'
if (-not (Test-Path $statusMd)) {
  $problems.Add('STATUS.md가 없습니다 — 다른 PC가 진행 상황을 알 수 없습니다.')
}
else {
  $head = Get-Content $statusMd -TotalCount 12 -Encoding UTF8
  $updated = ($head | Select-String -Pattern '^updated:\s*(\S+)').Matches.Groups[1].Value
  $statusPc = ($head | Select-String -Pattern '^pc:\s*(\S+)').Matches.Groups[1].Value

  if (-not $updated) {
    $problems.Add('STATUS.md frontmatter에 `updated:`가 없습니다.')
  }
  else {
    $lastCommit = (& $git -C $RepoRoot log -1 --format='%ad' --date=short 2>$null)
    if ($lastCommit -and ($updated -lt $lastCommit)) {
      $problems.Add("STATUS.md가 최신 커밋보다 오래됐습니다 (updated: $updated, 마지막 커밋: $lastCommit) — 세션 종료 전 갱신하세요.")
    }
  }

  if ($statusPc -and $statusPc -ne $pcName -and $HookEvent -eq 'SessionStart') {
    $problems.Add("STATUS.md의 마지막 작업 PC가 '$statusPc'입니다 (지금은 '$pcName') — 인수인계 내용을 먼저 확인하세요.")
  }
}

Write-HookResult $problems.ToArray()
