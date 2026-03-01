# 🆓 Free AI Chatbot Setup - Google Gemini

## Why Gemini?
- ✅ **100% FREE** (no credit card required)
- ✅ Generous daily limits (60 requests per minute)
- ✅ High quality responses
- ✅ Easy setup

## Setup Steps (2 minutes)

### 1. Get Your Free API Key
1. Go to: **https://makersuite.google.com/app/apikey**
2. Sign in with your Google account
3. Click **"Create API Key"**
4. Copy the key (starts with `AIza...`)

### 2. Add to Your Project
Open `server/.env` and add your key:
```env
GEMINI_API_KEY=AIzaSy...your_key_here
```

### 3. Restart Server
The server will automatically detect Gemini and use it instead of OpenAI.

If you're using nodemon, it will restart automatically. Otherwise:
```bash
cd server
npm start
```

### 4. Test Your Chatbot! 🎉
Open your app and try the AI chatbot - it's now using **FREE** Google Gemini!

---

## Current Configuration
Your app automatically uses:
- **Gemini** if `GEMINI_API_KEY` is set (FREE)
- **OpenAI** if only `OPENAI_API_KEY` is set (requires billing)

---

## Need Help?
- Gemini API Docs: https://ai.google.dev/docs
- Get API Key: https://makersuite.google.com/app/apikey
