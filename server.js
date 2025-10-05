// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(express.json());
app.use(cors());

// Basic health
app.get('/ping', (req,res)=> res.json({status:'ok'}));

app.post('/api/ai', async (req, res) => {
  const OPENAI_KEY = process.env.OPENAI_API_KEY;
  if(!OPENAI_KEY) return res.status(500).json({error:'AI key not configured on server'});
  const userMsg = (req.body && req.body.message) ? String(req.body.message) : '';
  if(!userMsg) return res.status(400).json({error:'No message provided'});

  try {
    // Build prompt to the assistant — concise system + user content
    const payload = {
      model: "gpt-4o-mini", // change to your available model
      messages: [
        {role: "system", content: "You are a concise technical assistant for a Number System Converter app. Provide clear step-by-step answers, show examples, and be friendly."},
        {role: "user", content: userMsg}
      ],
      temperature: 0.2,
      max_tokens: 700
    };

    const r = await axios.post('https://api.openai.com/v1/chat/completions', payload, {
      headers: { Authorization: `Bearer ${OPENAI_KEY}`, 'Content-Type': 'application/json' }
    });

    const answer = r.data?.choices?.[0]?.message?.content || 'No response from model';
    res.json({answer});
  } catch (err) {
    console.error('AI proxy error', err?.response?.data || err.message);
    res.status(500).json({error: 'AI service error'});
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, ()=> console.log(`AI proxy listening on ${PORT}`));
