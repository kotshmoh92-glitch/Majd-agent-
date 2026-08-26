// server.js — وكيل مجد
// Backend بسيط بـ Express: بياخد رسائل المستخدم من الواجهة، يضيف الـ System Prompt،
// ويستدعي Anthropic API، وبيرجع الرد.

require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(express.json({ limit: '5mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3000;
const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6';
const API_KEY = process.env.ANTHROPIC_API_KEY;

// نحمّل الـ System Prompt مرة وحدة من الملف
const SYSTEM_PROMPT = fs.readFileSync(
  path.join(__dirname, 'system_prompt.txt'),
  'utf-8'
);

if (!API_KEY) {
  console.warn(
    '⚠️  ANTHROPIC_API_KEY مش موجود. ضيفه بملف .env قبل ما تشغل السيرفر (شوف .env.example).'
  );
}

app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'لازم ترسل messages كمصفوفة فيها رسالة وحدة عالأقل.' });
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 2000,
        system: SYSTEM_PROMPT,
        messages,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Anthropic API error:', data);
      return res.status(response.status).json({ error: data.error?.message || 'صار خطأ بالـ API' });
    }

    const textBlock = data.content?.find((c) => c.type === 'text');
    const replyText = textBlock ? textBlock.text : '';

    res.json({ reply: replyText });
  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ error: 'صار خطأ بالسيرفر. جرب كمان مرة.' });
  }
});

app.listen(PORT, () => {
  console.log(`✅ وكيل مجد شغال على http://localhost:${PORT}`);
});
