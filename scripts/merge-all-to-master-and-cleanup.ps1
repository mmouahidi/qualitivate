# Merge all remote branches into master, then delete all other branches (local + remote).
# Run from repo root: .\scripts\merge-all-to-master-and-cleanup.ps1

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot\..

# 1. Ensure clean state (optional: uncomment to require no uncommitted changes)
# $status = git status --porcelain
# if ($status) { Write-Host "You have uncommitted changes. Commit or stash them first."; exit 1 }

Write-Host "Fetching from origin..." -ForegroundColor Cyan
git fetch origin

Write-Host "Checking out master and pulling latest..." -ForegroundColor Cyan
git checkout master
git pull origin master

# Get all remote branches except HEAD and master (branch name only, e.g. "cursor/feature")
$toMerge = git branch -r | ForEach-Object { $_.Trim() } | Where-Object {
    $_ -match 'origin/(.+)$' -and
    $_ -notmatch 'HEAD' -and
    $_ -notmatch 'origin/master\s*$'
} | ForEach-Object {
    if ($_ -match 'origin/(.+)$') { $Matches[1].Trim() }
} | Where-Object { $_ }

Write-Host "Found $($toMerge.Count) remote branches to merge into master." -ForegroundColor Yellow
foreach ($name in $toMerge) { Write-Host "  - $name" }

foreach ($branch in $toMerge) {
    Write-Host "`nMerging origin/$branch into master..." -ForegroundColor Cyan
    $mergeResult = git merge "origin/$branch" --no-edit 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Merge conflict with $branch. Resolve conflicts, then run:" -ForegroundColor Red
        Write-Host "  git add . ; git commit --no-edit" -ForegroundColor Red
        Write-Host "  Then re-run this script to continue merging and cleanup." -ForegroundColor Red
        exit 1
    }
}

Write-Host "`nPushing master to origin..." -ForegroundColor Cyan
git push origin master

# Delete remote branches (all except master)
Write-Host "`nDeleting remote branches (except master)..." -ForegroundColor Cyan
foreach ($branch in $toMerge) {
    Write-Host "  Deleting origin/$branch"
    git push origin --delete $branch 2>&1
}

# Delete local branches (except master)
$localBranches = git branch | ForEach-Object { $_.Trim() -replace '^\*\s*', '' } | Where-Object { $_ -ne 'master' }
Write-Host "`nDeleting local branches (except master)..." -ForegroundColor Cyan
foreach ($branch in $localBranches) {
    Write-Host "  Deleting local $branch"
    git branch -D $branch 2>&1
}

# Prune stale remote-tracking branches
git fetch origin --prune

Write-Host "`nDone. Only master remains (local and on origin)." -ForegroundColor Green
