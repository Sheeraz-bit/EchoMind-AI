const fetch = (...args) =>
  import('node-fetch').then(({ default: fetch }) => fetch(...args));
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Route to handle AI requests (protects your API key)
app.post('/api/chat', async (req, res) => {
    try {
        const { message, emotion } = req.body;

        console.log("Message:", message);
        console.log("Emotion:", emotion);
        console.log("API key loaded:", !!process.env.OPENROUTER_API_KEY);

        const response = await fetch(
            "https://openrouter.ai/api/v1/chat/completions",
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
                    "Content-Type": "application/json",
                    "HTTP-Referer": "http://localhost:3000",
                    "X-Title": "EchoMind AI"
                },
                body: JSON.stringify({
                    model: "openai/gpt-4o-mini", // safer model
                    messages: [
                        {
                            role: "system",
                            content: `User emotion: ${emotion}. Respond empathetically.`
                        },
                        {
                            role: "user",
                            content: message
                        }
                    ]
                })
            }
        );

        // ⭐ IMPORTANT DEBUG INFO
        console.log("OpenRouter status:", response.status);

        const text = await response.text();
        console.log("Raw response:", text);

        const data = JSON.parse(text);

        res.json(data);

    } catch (error) {
        console.error("SERVER ERROR:", error);
        res.status(500).json({
            error: "Backend failure",
            details: error.message
        });
    }
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});

app.get('/', (req, res) => {
    res.send('EchoMind AI Backend Running ✅');
});