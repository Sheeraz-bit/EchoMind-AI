const express = require('express');
const cors = require('cors');
const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// Mock AI responses - no API key needed
const mockResponses = {
    greetings: [
        "Hello! I'm your emotional AI assistant. How can I help you today?",
        "Hi there! I notice your emotional state. What would you like to chat about?",
        "Greetings! I'm here to listen and help. What's on your mind?"
    ],
    happy: [
        "I can see you're happy! That's wonderful! Let's keep the positive vibes going!",
        "Your happiness is contagious! What would you like to do with this great energy?",
        "It's great to see you in such a good mood! How can I add to your happiness today?"
    ],
    sad: [
        "I sense you might be feeling down. I'm here for you whenever you're ready to talk.",
        "It's okay to feel sad sometimes. Remember, I'm here to support you.",
        "Take all the time you need. I'm here whenever you want to share what's on your mind."
    ],
    angry: [
        "I notice some frustration. Let's take a moment to breathe and work through this.",
        "It's understandable to feel upset. Let's address this calmly together.",
        "I'm here to help you navigate these feelings. What would help right now?"
    ]
};

app.post('/api/chat', (req, res) => {
    const { message, emotion } = req.body;
    
    // Simulate processing delay
    setTimeout(() => {
        let responses;
        
        // Select responses based on emotion
        if (emotion && mockResponses[emotion]) {
            responses = mockResponses[emotion];
        } else if (message.toLowerCase().includes('hello') || message.toLowerCase().includes('hi')) {
            responses = mockResponses.greetings;
        } else {
            responses = [
                "Thanks for sharing that with me.",
                "I understand. Would you like to talk more about that?",
                "That's interesting! Tell me more.",
                "How does that make you feel?",
                "What do you think about that situation?"
            ];
        }
        
        // Pick a random response
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        
        res.json({
            choices: [{
                message: {
                    content: randomResponse
                }
            }]
        });
    }, 800); // 800ms delay to simulate AI thinking
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
    console.log(`Test endpoint: POST http://localhost:${port}/api/chat`);
});