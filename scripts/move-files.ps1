# Di chuyển file trong thư mục admin
Copy-Item -Path "src/components/admin/AdminDashboard.tsx" -Destination "src/components/admin/dashboard/AdminDashboard.tsx" -Force
Copy-Item -Path "src/components/admin/AdminLogin.tsx" -Destination "src/components/admin/auth/AdminLogin.tsx" -Force
Copy-Item -Path "src/components/admin/ArticleEditor.tsx" -Destination "src/components/admin/articles/ArticleEditor.tsx" -Force
Copy-Item -Path "src/components/admin/ToastEditor.tsx" -Destination "src/components/admin/articles/ToastEditor.tsx" -Force
Copy-Item -Path "src/components/admin/UsersList.tsx" -Destination "src/components/admin/users/UsersList.tsx" -Force

Write-Host "Admin files copied successfully"

# Di chuyển file trong thư mục common
# Popups
Copy-Item -Path "src/components/common/CompletedTestPopup.tsx" -Destination "src/components/common/popups/CompletedTestPopup.tsx" -Force
Copy-Item -Path "src/components/common/CongratulationsPopup.tsx" -Destination "src/components/common/popups/CongratulationsPopup.tsx" -Force
Copy-Item -Path "src/components/common/TestProgressPopup.tsx" -Destination "src/components/common/popups/TestProgressPopup.tsx" -Force
Copy-Item -Path "src/components/common/TimeUpPopup.tsx" -Destination "src/components/common/popups/TimeUpPopup.tsx" -Force

# Selectors
Copy-Item -Path "src/components/common/CountrySelector.tsx" -Destination "src/components/common/selectors/CountrySelector.tsx" -Force

# Contact
Copy-Item -Path "src/components/common/ContactMethod.tsx" -Destination "src/components/common/contact/ContactMethod.tsx" -Force

# FAQ
Copy-Item -Path "src/components/common/FAQItem.tsx" -Destination "src/components/common/faq/FAQItem.tsx" -Force

# Effects
Copy-Item -Path "src/components/common/Confetti.tsx" -Destination "src/components/common/effects/Confetti.tsx" -Force

# Di chuyển LoginForm và RegisterForm sang thư mục auth
Copy-Item -Path "src/components/common/LoginForm.tsx" -Destination "src/components/auth/login/LoginForm.tsx" -Force
Copy-Item -Path "src/components/common/LoginPopup.tsx" -Destination "src/components/auth/login/LoginPopup.tsx" -Force
Copy-Item -Path "src/components/common/RegisterForm.tsx" -Destination "src/components/auth/register/RegisterForm.tsx" -Force

Write-Host "Common files copied successfully"

# Di chuyển các file layout
Copy-Item -Path "src/components/layout/Header.tsx" -Destination "src/components/layout/headers/Header.tsx" -Force
Copy-Item -Path "src/components/layout/HeaderWrapper.astro" -Destination "src/components/layout/headers/HeaderWrapper.astro" -Force

Write-Host "Layout files copied successfully"

# Di chuyển các file tests
Copy-Item -Path "src/components/tests/Timer.tsx" -Destination "src/components/tests/core/Timer.tsx" -Force
Copy-Item -Path "src/components/tests/ProgressBar.tsx" -Destination "src/components/tests/core/ProgressBar.tsx" -Force
Copy-Item -Path "src/components/tests/QuestionCard.tsx" -Destination "src/components/tests/core/QuestionCard.tsx" -Force
Copy-Item -Path "src/components/tests/QuizComponent.tsx" -Destination "src/components/tests/core/QuizComponent.tsx" -Force

Copy-Item -Path "src/components/tests/ResultComponent.tsx" -Destination "src/components/tests/results/ResultComponent.tsx" -Force
Copy-Item -Path "src/components/tests/DetailedAnalysis.tsx" -Destination "src/components/tests/results/DetailedAnalysis.tsx" -Force

Copy-Item -Path "src/components/tests/IQTest.tsx" -Destination "src/components/tests/types/iq/IQTest.tsx" -Force
Copy-Item -Path "src/components/IQTestWrapper.tsx" -Destination "src/components/tests/types/iq/IQTestWrapper.tsx" -Force
Copy-Item -Path "src/components/EQTestWrapper.tsx" -Destination "src/components/tests/types/eq/EQTestWrapper.tsx" -Force

Write-Host "Tests files copied successfully"

# Di chuyển các file leaderboard
Copy-Item -Path "src/components/LeaderboardList.tsx" -Destination "src/components/leaderboard/global/LeaderboardList.tsx" -Force
Copy-Item -Path "src/components/LeaderboardStats.tsx" -Destination "src/components/leaderboard/global/LeaderboardStats.tsx" -Force
Copy-Item -Path "src/components/ScalableLeaderboard.tsx" -Destination "src/components/leaderboard/global/ScalableLeaderboard.tsx" -Force
Copy-Item -Path "src/components/TopTenLeaderboard.tsx" -Destination "src/components/leaderboard/global/TopTenLeaderboard.tsx" -Force

Copy-Item -Path "src/components/LocalRankingView.tsx" -Destination "src/components/leaderboard/local/LocalRankingView.tsx" -Force
Copy-Item -Path "src/components/LocalRankingWrapper.tsx" -Destination "src/components/leaderboard/local/LocalRankingWrapper.tsx" -Force

Write-Host "Leaderboard files copied successfully"

# Di chuyển các file profile
Copy-Item -Path "src/components/ProfileComponent.tsx" -Destination "src/components/profile/ProfileComponent.tsx" -Force
Copy-Item -Path "src/components/TestHistoryComponent.tsx" -Destination "src/components/profile/TestHistoryComponent.tsx" -Force

Write-Host "Profile files copied successfully"

# Di chuyển các file SEO
Copy-Item -Path "src/components/SEO.astro" -Destination "src/components/seo/SEO.astro" -Force
Copy-Item -Path "src/components/ArticleSEO.astro" -Destination "src/components/seo/ArticleSEO.astro" -Force

Write-Host "SEO files copied successfully"

# Di chuyển LucideIcon
Copy-Item -Path "src/components/LucideIcon.astro" -Destination "src/components/ui/icons/LucideIcon.astro" -Force

Write-Host "UI files copied successfully"

Write-Host "All files have been copied to their new locations." 