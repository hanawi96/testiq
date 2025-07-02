# Xóa các file cũ đã được di chuyển
$oldFiles = @(
    "src/components/EQTestWrapper.tsx",
    "src/components/IQTestWrapper.tsx",
    "src/components/LeaderboardList.tsx",
    "src/components/LeaderboardStats.tsx",
    "src/components/LocalRankingView.tsx",
    "src/components/LocalRankingWrapper.tsx",
    "src/components/ProfileComponent.tsx",
    "src/components/ScalableLeaderboard.tsx",
    "src/components/TestHistoryComponent.tsx",
    "src/components/TopTenLeaderboard.tsx",
    "src/components/layout/Header.tsx",
    "src/components/layout/HeaderWrapper.astro",
    "src/components/tests/DetailedAnalysis.tsx",
    "src/components/tests/IQTest.tsx",
    "src/components/tests/ProgressBar.tsx",
    "src/components/tests/QuestionCard.tsx",
    "src/components/tests/QuizComponent.tsx",
    "src/components/tests/ResultComponent.tsx",
    "src/components/tests/Timer.tsx",
    "src/components/LucideIcon.astro",
    "src/components/SEO.astro",
    "src/components/ArticleSEO.astro"
)

foreach ($file in $oldFiles) {
    if (Test-Path $file) {
        git rm $file
        Write-Host "Removed: $file"
    } else {
        Write-Host "Already removed or missing: $file"
    }
}

Write-Host "Done removing old files." 