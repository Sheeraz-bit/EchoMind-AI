const express = require('express');
const cors = require('cors');
const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// Enhanced response database
const responseDatabase = {
    greetings: {
        happy: [
            "Hello! Your smile is absolutely radiant today! What's bringing you so much joy?",
            "Hi there! I can feel your positive energy from here! How can I amplify your happiness today?"
        ],
        sad: [
            "Hello... I sense you might be having a difficult time. I'm here whenever you're ready to talk.",
            "Hi. I notice you seem down. There's no pressure to pretend - I'm here to listen with compassion."
        ],
        angry: [
            "Hello. I sense some tension. Let's take a moment to breathe together before we continue.",
            "Hi. I can see you're frustrated. I'm here to help, not to judge."
        ],
        neutral: [
            "Hello! I'm your emotional AI companion. How can I assist you today?",
            "Hi there! I'm here to chat and support you. What's on your mind?"
        ]
    },
    // ... (add more categories as needed)
};

app.post('/api/chat', (req, res) => {
    const { message, emotion, context } = req.body;
    
    // Simulate AI processing
    setTimeout(() => {
        let response;
        
        // Simple logic - you can expand this
        const lowerMsg = message.toLowerCase();
        
        if (lowerMsg.includes('hello') || lowerMsg.includes('hi')) {
            const greetings = responseDatabase.greetings[emotion] || 
                            ["Hello! Nice to meet you!"];
            response = greetings[Math.floor(Math.random() * greetings.length)];
        } else if (lowerMsg.includes('how are you')) {
            response = `I'm functioning well, thank you! I notice you seem ${emotion}. ${getEmotionComment(emotion)}`;
        } else {
            // Default emotional response
            response = generateEmotionalResponse(message, emotion);
        }
        
        res.json({
            success: true,
            response: response,
            detectedEmotion: emotion
        });
    }, 600);
});

function getEmotionComment(emotion) {
    const comments = {
        happy: "Your happiness is contagious!",
        sad: "I'm here to support you through this.",
        angry: "Let's work through this calmly.",
        neutral: "I'm here for you."
    };
    return comments[emotion] || "";
}

function generateEmotionalResponse(message, emotion) {
    const responses = {
        happy: [
            `I love your enthusiasm! "${message}" - tell me more about what's exciting you!`,
            `Your positive energy makes discussing "${message}" even more enjoyable!`
        ],
        sad: [
            `Thank you for sharing "${message}" with me. I'm listening with compassion.`,
            `I hear you saying "${message}". These feelings matter.`
        ],
        angry: [
            `I understand the intensity behind "${message}". Let's address this constructively.`,
            `"${message}" - I hear your frustration. Let's find a way forward.`
        ]
    };
    
    const emotionResponses = responses[emotion];
    if (emotionResponses) {
        return emotionResponses[Math.floor(Math.random() * emotionResponses.length)];
    }
    
    return `Thank you for sharing: "${message}". I'm processing this while noting you seem ${emotion}.`;
}

app.listen(port, () => {
    console.log(`Emotional AI backend running on http://localhost:${port}`);
});