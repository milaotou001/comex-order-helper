param(
  [Parameter(ValueFromRemainingArguments = $true)]
  [string[]]$CommitMessageParts
)

$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $repoRoot

if (-not (Test-Path ".git")) {
  throw "This script must be run from inside a git repository."
}

$commitMessage = if ($CommitMessageParts.Count -gt 0) {
  $CommitMessageParts -join " "
} else {
  "chore: update project"
}

try {
  gh auth status -h github.com *> $null
} catch {
  throw "GitHub CLI is not authenticated. Run 'gh auth login -h github.com' once, then rerun this script."
}

$currentBranch = (git branch --show-current).Trim()
if ([string]::IsNullOrWhiteSpace($currentBranch)) {
  throw "Detached HEAD is not supported. Switch to a branch first."
}

git add -A

git diff --cached --quiet
$hasStagedChanges = $LASTEXITCODE -ne 0

if ($hasStagedChanges) {
  git commit -m $commitMessage
}

git push -u origin $currentBranch
