# Quick AI Setup Script
Write-Host "🤖 Setting up AI Chatbot for sportReserve..." -ForegroundColor Cyan
Write-Host ""

# Navigate to server directory
Write-Host "📁 Navigating to server directory..." -ForegroundColor Yellow
Set-Location -Path "server"

# Install OpenAI package
Write-Host "📦 Installing OpenAI package..." -ForegroundColor Yellow
npm install openai

Write-Host ""
Write-Host "✅ OpenAI package installed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "🔑 NEXT STEPS:" -ForegroundColor Cyan
Write-Host "1. Get your OpenAI API key from: https://platform.openai.com/api-keys" -ForegroundColor White
Write-Host "2. Add to server/.env file: OPENAI_API_KEY=sk-your-key-here" -ForegroundColor White
Write-Host "3. Restart your server: npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "📖 Read AI_SETUP_GUIDE.md for detailed instructions" -ForegroundColor Yellow
Write-Host ""

# Return to root directory
Set-Location -Path ".."

Write-Host "Press any key to continue..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
