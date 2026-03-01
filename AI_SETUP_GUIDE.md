# 🤖 AI Chatbot Setup Guide - sportReserve

## ✅ What We've Implemented

1. **AI Chatbot Component** (`src/components/ai/AIChatbot.tsx`)
   - Beautiful floating chat interface
   - Real-time conversations with AI
   - Quick action buttons
   - Message history
   - Loading states

2. **Backend API** (`server/routes/ai.js`)
   - `/api/ai/chat` - Chat with the AI assistant
   - `/api/ai/suggestions` - Get personalized suggestions
   - Integration with OpenAI GPT-4

3. **Dashboard Integration**
   - Chatbot automatically appears on dashboard
   - Works for all authenticated users

---

## 📝 Next Steps - IMPORTANT

### Step 1: Install Required Packages

```bash
# In the server directory
cd server
npm install openai
```

### Step 2: Get OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in
3. Go to **API Keys** section
4. Click **"Create new secret key"**
5. Copy the key (starts with `sk-...`)

**⚠️ IMPORTANT**: This key is secret! Never commit it to Git!

### Step 3: Add API Key to Environment

Edit your `server/.env` file and add:

```env
# OpenAI API Configuration
OPENAI_API_KEY=sk-your-actual-api-key-here
```

**Example `.env` file:**
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/sportreserve
JWT_SECRET=your_jwt_secret_here
FRONTEND_URL=http://localhost:5173

# OpenAI Configuration
OPENAI_API_KEY=sk-your-openai-api-key-here
```

### Step 4: Restart Your Server

```bash
# In server directory
npm run dev
```

---

## 🎯 How to Use

1. **Open Dashboard**
   - Navigate to your dashboard (`/dashboard`)
   - Look for the purple chat button in the bottom right

2. **Start Chatting**
   - Click the chat button
   - Try quick actions or type your own questions
   - Examples:
     - "Trouve-moi un terrain de football pour demain"
     - "Quels sont mes prochaines réservations?"
     - "Comment annuler une réservation?"
     - "Quel est le meilleur moment pour réserver?"

3. **Features**
   - Natural language understanding
   - Context-aware responses
   - Personalized suggestions
   - Bilingual support (French/English)

---

## 💰 Cost Information

### OpenAI Pricing (as of 2024)

**GPT-4:**
- Input: $0.03 per 1,000 tokens (~750 words)
- Output: $0.06 per 1,000 tokens (~750 words)
- Average chat: $0.01 - $0.05 per conversation

**GPT-3.5-Turbo (Cheaper Alternative):**
- Input: $0.0005 per 1,000 tokens
- Output: $0.0015 per 1,000 tokens
- Average chat: $0.001 - $0.01 per conversation
- **20x cheaper than GPT-4!**

**Free Tier:**
- OpenAI gives you **$5 credit** for new accounts
- Enough for ~500-1000 chats with GPT-3.5-Turbo

### To Use Cheaper Model

Edit `server/routes/ai.js`, line ~40:
```javascript
// Change from:
model: 'gpt-4',

// To:
model: 'gpt-3.5-turbo',
```

---

## 🔧 Customization

### Change AI Personality

Edit the `systemPrompt` in `server/routes/ai.js` (lines 29-52):

```javascript
const systemPrompt = `Tu es un assistant...
- Add your custom instructions here
- Change tone (formal/casual)
- Add specific knowledge
- Define boundaries
`;
```

### Add More Quick Actions

Edit `AIChatbot.tsx` (around line 107):

```typescript
const quickActions = [
  "Votre nouvelle action rapide",
  "Autre action",
  // Add more...
];
```

### Change Colors

The chatbot uses purple/blue gradient. To change, edit in `AIChatbot.tsx`:
- Search for `purple-600` and `blue-600`
- Replace with your brand colors

---

## 🐛 Troubleshooting

### Error: "Invalid API Key"
- Check your `.env` file
- Make sure key starts with `sk-`
- No spaces before/after the key
- Restart server after adding key

### Error: "Quota Exceeded"
- You've used all your OpenAI credits
- Add payment method at [OpenAI Billing](https://platform.openai.com/account/billing)
- Or wait for monthly reset

### Chatbot Button Not Showing
- Clear browser cache
- Check browser console for errors
- Make sure you're logged in
- Refresh the page

### Slow Responses
- GPT-4 is slower (~5-10 seconds)
- Switch to GPT-3.5-Turbo for faster responses
- Reduce `max_tokens` in API call

---

## 🚀 Advanced Features (Future)

Want to add more AI features? Here are ideas:

1. **Sentiment Analysis on Reviews**
   - Automatically detect negative reviews
   - Alert admins to issues

2. **Smart Pricing Suggestions**
   - AI suggests optimal prices
   - Based on demand patterns

3. **Automated Email Responses**
   - AI drafts responses to common questions

4. **Voice Integration**
   - Voice-to-text booking
   - "Book me a football field for Saturday"

5. **Image Recognition**
   - Auto-detect facility type from photos
   - Verify equipment condition

Let me know which feature you want next! 🎯

---

## 📊 Monitoring Usage

Track your OpenAI usage:
1. Go to [OpenAI Usage](https://platform.openai.com/usage)
2. See daily/monthly usage
3. Set spending limits

---

## ✅ Testing Checklist

- [ ] Installed `openai` package
- [ ] Added API key to `.env`
- [ ] Restarted server
- [ ] Chatbot button appears on dashboard
- [ ] Can send messages
- [ ] Receives AI responses
- [ ] Quick actions work
- [ ] Chat history displays correctly

---

## 📞 Need Help?

If you encounter issues:
1. Check server logs for errors
2. Verify API key is correct
3. Check OpenAI quota/billing
4. Test with a simple message first

Happy chatting! 🤖✨
