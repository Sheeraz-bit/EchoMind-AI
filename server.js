const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// API route for chat
app.post('/api/chat', async (req, res) => {
    try {
        const { message, emotion } = req.body;

        console.log("Message:", message);
        console.log("Emotion:", emotion);
        console.log("OpenRouter API key loaded:", !!process.env.OPENROUTER_API_KEY);

        // For demo purposes, if no API key, return mock response
        if (!process.env.OPENROUTER_API_KEY) {
            console.log("No API key found - using mock response");
            return res.json({
                choices: [{
                    message: {
                        content: getMockResponse(message, emotion)
                    }
                }]
            });
        }

        // Using fetch for OpenRouter API
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                'HTTP-Referer': 'http://localhost:3000',
                'X-Title': 'EchoMind AI'
            },
            body: JSON.stringify({
                model: 'openai/gpt-4o', // You can change this to any model OpenRouter supports
                messages: [
                    {
                        role: "system",
                        content: `You are an empathetic AI emotional assistant. The user's current emotional state is: ${emotion}. Respond in a warm, helpful manner that matches their emotional tone. Keep responses concise but meaningful (1-3 sentences).`
                    },
                    {
                        role: "user",
                        content: message
                    }
                ],
                temperature: 0.7,
                max_tokens: 150
            })
        });

        if (!response.ok) {
            const errorData = await response.text();
            console.error('OpenRouter API error:', response.status, errorData);
            throw new Error(`OpenRouter API error: ${response.status}`);
        }

        const data = await response.json();
        
        // Format response to match expected structure
        res.json({
            choices: [{
                message: {
                    content: data.choices[0].message.content
                }
            }]
        });

    } catch (error) {
        console.error("SERVER ERROR:", error);
        // Fallback to mock response on error
        res.json({
            choices: [{
                message: {
                    content: getMockResponse(req.body.message, req.body.emotion)
                }
            }]
        });
    }
});

// Mock response function for when API is unavailable
function getMockResponse(message, emotion) {
    const responses = {
        happy: [
            "That's wonderful to hear! Your positive energy is contagious. How can I add to your good mood today?",
            "I'm glad you're feeling happy! What's bringing you joy right now?",
            "Your happiness is great to see! Is there anything specific you'd like to chat about?"
        ],
        sad: [
            "I hear that you're feeling down. Remember that it's okay to not be okay. Would you like to talk about what's troubling you?",
            "I'm here for you during this difficult moment. Sometimes sharing our feelings can help lighten the burden.",
            "It's completely normal to feel sad sometimes. Would you like some gentle conversation or maybe some cheerful suggestions?"
        ],
        angry: [
            "I can sense your frustration. Taking a deep breath might help. Would you like to discuss what's making you feel this way?",
            "Your feelings are valid. When you're ready, I'm here to listen without judgment.",
            "Anger can be overwhelming. Would it help to talk through the situation together?"
        ],
        surprise: [
            "That sounds surprising! Life is full of unexpected moments. How are you processing this?",
            "Unexpected things can be exciting or challenging. Would you like to explore this together?",
            "Surprises keep life interesting! Tell me more about what happened."
        ],
        neutral: [
            "I appreciate you reaching out. How can I assist you today?",
            "Thanks for chatting with me. What would you like to discuss?",
            "I'm here to help with whatever's on your mind. What shall we talk about?"
        ],
        fear: [
            "I understand feeling afraid can be difficult. You're not alone in this. Would you like to talk about what's worrying you?",
            "Fear is a natural response. Sometimes sharing our concerns can make them feel more manageable.",
            "I'm here with you. Would it help to explore these feelings together?"
        ]
    };
    
    const emotionResponses = responses[emotion] || responses.neutral;
    return emotionResponses[Math.floor(Math.random() * emotionResponses.length)];
}

// Serve index.html for all other routes (SPA support)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
    console.log(`🚀 EchoMind AI Server running on http://localhost:${port}`);
    console.log(`📁 Serving static files from: ${path.join(__dirname, 'public')}`);
    console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🤖 Using OpenRouter API for AI responses`);
});

// Handle process termination
process.on('SIGINT', () => {
    console.log('\n👋 Server shutting down...');
    process.exit();
});