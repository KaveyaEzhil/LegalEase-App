# scripts/watch_and_sync.ps1
# PowerShell File System Watcher for Git Auto-Sync

$script:Path = Split-Path -Parent $MyInvocation.MyCommand.Definition
if (-not $script:Path) { $script:Path = Get-Location }
$ProjectRoot = (Get-Item $script:Path).Parent.FullName

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   LegalEase Local File Watcher & Auto-Git Sync" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "Project Root: $ProjectRoot" -ForegroundColor Yellow
Write-Host "Watching for changes..." -ForegroundColor DarkYellow
Write-Host "To stop the watcher, press Ctrl+C in this terminal window." -ForegroundColor Gray

# Define exclusions to avoid infinite loops and tracking of temp/unwanted files
$ExcludePatterns = @(
    "\\\.git\\",
    "\\node_modules\\",
    "\\\.venv\\",
    "\\venv\\",
    "\\__pycache__\\",
    "\\\.vercel\\",
    "\\\.idea\\",
    "\\\.vscode\\",
    "~\$" # Ignore temporary MS Office lock files like ~$E2E_Report.xlsx
)

# Set up file system watcher
$Watcher = New-Object System.IO.FileSystemWatcher
$Watcher.Path = $ProjectRoot
$Watcher.IncludeSubdirectories = $true
$Watcher.EnableRaisingEvents = $true

# Track last change timestamp for debouncing
$script:LastEventTime = [DateTime]::MinValue
$script:TimerActive = $false
$DebounceDelayMs = 5000  # Wait 5 seconds after the last edit before syncing

$Action = {
    $Path = $Event.SourceEventArgs.FullPath
    
    # Check if path matches any exclusion patterns
    $isExcluded = $false
    foreach ($pattern in $ExcludePatterns) {
        if ($Path -match $pattern) {
            $isExcluded = $true
            break
        }
    }
    
    if (-not $isExcluded) {
        $script:LastEventTime = [DateTime]::Now
        Write-Host "Change detected in: $Path" -ForegroundColor DarkGray
        
        if (-not $script:TimerActive) {
            $script:TimerActive = $true
            Start-Job -Name "SyncTimer" -ScriptBlock {
                param($delay)
                Start-Sleep -Milliseconds $delay
            } -ArgumentList $DebounceDelayMs | Out-Null
        }
    }
}

# Register events
$Handlers = @()
$Handlers += Register-ObjectEvent $Watcher "Changed" -Action $Action
$Handlers += Register-ObjectEvent $Watcher "Created" -Action $Action
$Handlers += Register-ObjectEvent $Watcher "Deleted" -Action $Action
$Handlers += Register-ObjectEvent $Watcher "Renamed" -Action $Action

# Git Sync function
function Sync-To-GitHub {
    Write-Host "Syncing changes to GitHub..." -ForegroundColor Yellow
    
    # Check if there are changes to stage
    $status = git status --porcelain
    if (-not $status) {
        Write-Host "No changes detected to sync." -ForegroundColor Gray
        return
    }
    
    Write-Host "Unstaged/untracked changes detected:" -ForegroundColor White
    $status | ForEach-Object { Write-Host "  $_" -ForegroundColor DarkGray }
    
    # Add files
    git add -A
    
    # Commit changes
    $commitMsg = "Auto-sync: local updates ($(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')) [skip ci]"
    git commit -m $commitMsg
    
    # Push changes
    $branch = git branch --show-current
    Write-Host "Pushing to remote branch: $branch" -ForegroundColor Cyan
    git push origin $branch
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Synchronization complete!" -ForegroundColor Green
    } else {
        Write-Warning "Failed to push to GitHub. Check your credentials and network connection."
    }
}

try {
    while ($true) {
        Start-Sleep -Milliseconds 500
        
        # Check if timer job finished (meaning debouncing period has elapsed)
        $timerJob = Get-Job -Name "SyncTimer" -ErrorAction SilentlyContinue
        if ($timerJob -and $timerJob.State -eq "Completed") {
            # Clean up the job
            Remove-Job -Name "SyncTimer" -Force | Out-Null
            $script:TimerActive = $false
            
            # Double check if there was another event after timer started
            $elapsed = ([DateTime]::Now - $script:LastEventTime).TotalMilliseconds
            if ($elapsed -ge $DebounceDelayMs) {
                Sync-To-GitHub
            } else {
                # Event happened during the delay, restart timer with remaining time
                $script:TimerActive = $true
                $remaining = [int]($DebounceDelayMs - $elapsed)
                Start-Job -Name "SyncTimer" -ScriptBlock {
                    param($delay)
                    Start-Sleep -Milliseconds $delay
                } -ArgumentList $remaining | Out-Null
            }
        }
    }
}
finally {
    # Unregister event handlers and stop watcher
    Write-Host "Stopping watcher..." -ForegroundColor Gray
    $Watcher.EnableRaisingEvents = $false
    $Watcher.Dispose()
    foreach ($handler in $Handlers) {
        Unregister-Event -SourceIdentifier $handler.Name -ErrorAction SilentlyContinue
    }
    Get-Job -Name "SyncTimer" -ErrorAction SilentlyContinue | Remove-Job -Force
}
