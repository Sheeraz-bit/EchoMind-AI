// AI Emotional Assistant - COMPLETE WORKING VERSION
// NO CAMERA REQUIRED - SIMULATED EMOTION DETECTION

// Global variables
let currentEmotion = 'neutral';
let isAutoEmotionEnabled = false;
let autoEmotionInterval = null;
let isListening = false;
let recognition = null;
let conversationHistory = [];
let currentEmotionIntensity = {
    happy: 40,
    sad: 20,
    angry: 10,
    surprise: 15,
    fear: 5,
    disgust: 3,
    neutral: 85
};

// DOM Elements
const emotionValue = document.getElementById('emotionValue');
const confidenceValue = document.getElementById('confidenceValue');
const currentEmotionDisplay = document.getElementById('currentEmotionDisplay');
const mainEmotionIcon = document.getElementById('mainEmotionIcon');
const autoEmotionToggle = document.getElementById('autoEmotionToggle');
const chatMessages = document.getElementById('chatMessages');
const userInput = document.getElementById('userInput');
const sendButton = document.getElementById('sendButton');
const voiceButton = document.getElementById('voiceButton');
const voiceStatus = document.getElementById('voiceStatus');
const clearChatButton = document.getElementById('clearChat');
const suggestTopicButton = document.getElementById('suggestTopic');
const responseStyleDisplay = document.getElementById('responseStyle');

// Emotion bar elements
const emotionBars = {
    happy: { bar: document.getElementById('happyBar'), value: document.getElementById('happyValue') },
    sad: { bar: document.getElementById('sadBar'), value: document.getElementById('sadValue') },
    angry: { bar: document.getElementById('angryBar'), value: document.getElementById('angryValue') },
    surprise: { bar: document.getElementById('surpriseBar'), value: document.getElementById('surpriseValue') }
};

// Emotion icons mapping
const emotionIcons = {
    happy: 'fa-smile',
    sad: 'fa-frown',
    angry: 'fa-angry',
    surprise: 'fa-surprise',
    neutral: 'fa-meh',
    fear: 'fa-flushed',
    disgust: 'fa-grimace'
};

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    console.log('AI Emotional Assistant Initialized');
    
    // Initialize with default emotion
    updateEmotionDisplay('neutral', 85);
    
    // Set up event listeners
    setupEventListeners();
    
    // Initialize voice recognition
    initVoiceRecognition();
    
    // Add welcome message
    setTimeout(() => {
        addMessageToChat('You can click any emotion button to change my response style. Try saying "Hello" or asking "How are you?"', 'ai');
    }, 1000);
});

// Set up all event listeners
function setupEventListeners() {
    // Send message button
    sendButton.addEventListener('click', sendMessage);
    
    // Send message on Enter key
    userInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
    
    // Clear chat button
    clearChatButton.addEventListener('click', clearChat);
    
    // Suggest topic button
    suggestTopicButton.addEventListener('click', suggestTopic);
    
    // Voice button
    voiceButton.addEventListener('click', toggleVoiceRecognition);
    
    // Emotion buttons
    document.querySelectorAll('.emotion-btn').forEach(button => {
        button.addEventListener('click', function() {
            const emotion = this.getAttribute('data-emotion');
            const confidence = Math.floor(Math.random() * 20) + 75; // 75-95%
            setEmotion(emotion, confidence);
            
            // Stop auto emotion if manually selecting
            if (isAutoEmotionEnabled) {
                toggleAutoEmotion();
            }
            
            // Add feedback message
            addMessageToChat(`Emotion set to: ${emotion.charAt(0).toUpperCase() + emotion.slice(1)}. I will now respond accordingly.`, 'ai');
        });
    });
    
    // Auto emotion toggle
    autoEmotionToggle.addEventListener('change', function() {
        toggleAutoEmotion();
    });
}

// Set emotion manually
function setEmotion(emotion, confidence) {
    currentEmotion = emotion;
    
    // Update emotion intensity
    currentEmotionIntensity[emotion] = confidence;
    
    // Update other emotions with random lower values
    Object.keys(currentEmotionIntensity).forEach(key => {
        if (key !== emotion && key !== 'neutral') {
            currentEmotionIntensity[key] = Math.floor(Math.random() * 30);
        }
    });
    
    // Update display
    updateEmotionDisplay(emotion, confidence);
    updateEmotionBars();
    updateEmotionIcon(emotion);
    
    // Update response style
    responseStyleDisplay.textContent = getResponseStyle(emotion);
}

// Update emotion display
function updateEmotionDisplay(emotion, confidence) {
    if (!emotionValue || !confidenceValue || !currentEmotionDisplay) return;
    
    const displayEmotion = emotion.charAt(0).toUpperCase() + emotion.slice(1);
    emotionValue.textContent = displayEmotion;
    confidenceValue.textContent = confidence + '%';
    currentEmotionDisplay.textContent = displayEmotion;
    
    // Update color based on emotion
    updateEmotionColor(emotion);
}

// Update emotion color
function updateEmotionColor(emotion) {
    const colors = {
        happy: '#f39c12',
        sad: '#3498db',
        angry: '#e74c3c',
        surprise: '#9b59b6',
        neutral: '#95a5a6',
        fear: '#d35400',
        disgust: '#27ae60'
    };
    
    const color = colors[emotion] || '#95a5a6';
    if (emotionValue) emotionValue.style.color = color;
    if (currentEmotionDisplay) {
        currentEmotionDisplay.style.color = color;
        currentEmotionDisplay.style.background = color + '20';
    }
}

// Update emotion icon
function updateEmotionIcon(emotion) {
    if (!mainEmotionIcon) return;
    const iconClass = emotionIcons[emotion] || 'fa-meh';
    mainEmotionIcon.innerHTML = `<i class="fas ${iconClass}"></i>`;
}

// Update emotion bars
function updateEmotionBars() {
    // Update each emotion bar
    Object.keys(emotionBars).forEach(emotion => {
        if (emotionBars[emotion] && emotionBars[emotion].bar && emotionBars[emotion].value) {
            const intensity = currentEmotionIntensity[emotion] || 0;
            emotionBars[emotion].bar.style.width = intensity + '%';
            emotionBars[emotion].value.textContent = intensity + '%';
        }
    });
}

// Get response style based on emotion
function getResponseStyle(emotion) {
    const styles = {
        happy: 'Positive & Supportive',
        sad: 'Compassionate & Understanding',
        angry: 'Calm & Analytical',
        surprise: 'Engaging & Curious',
        neutral: 'Professional & Helpful',
        fear: 'Reassuring & Gentle',
        disgust: 'Neutral & Informative'
    };
    
    return styles[emotion] || 'Emotion-Aware';
}

// Toggle auto emotion cycling
function toggleAutoEmotion() {
    isAutoEmotionEnabled = !isAutoEmotionEnabled;
    
    if (isAutoEmotionEnabled) {
        // Start auto emotion cycle
        startAutoEmotionCycle();
        addMessageToChat('Auto emotion cycling enabled. Emotions will change every 5 seconds.', 'ai');
    } else {
        // Stop auto emotion cycle
        stopAutoEmotionCycle();
        addMessageToChat('Auto emotion cycling disabled.', 'ai');
    }
}

// Start auto emotion cycle
function startAutoEmotionCycle() {
    // Cycle through emotions
    const emotions = ['happy', 'sad', 'angry', 'surprise', 'neutral', 'fear'];
    let currentIndex = 0;
    
    autoEmotionInterval = setInterval(() => {
        const emotion = emotions[currentIndex];
        const confidence = Math.floor(Math.random() * 20) + 75;
        setEmotion(emotion, confidence);
        
        currentIndex = (currentIndex + 1) % emotions.length;
    }, 5000); // Change every 5 seconds
}

// Stop auto emotion cycle
function stopAutoEmotionCycle() {
    if (autoEmotionInterval) {
        clearInterval(autoEmotionInterval);
        autoEmotionInterval = null;
    }
}

// Initialize voice recognition
function initVoiceRecognition() {
    // Check if voice status element exists
    if (!voiceStatus) return;
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
        try {
            recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = false;
            recognition.lang = 'en-US';
            recognition.maxAlternatives = 1;
            
            recognition.onstart = function() {
                isListening = true;
                updateVoiceStatus('Listening... Speak now', 'listening');
                if (voiceButton) {
                    voiceButton.innerHTML = '<i class="fas fa-microphone-slash"></i> Stop';
                    voiceButton.classList.add('listening');
                }
            };
            
            recognition.onresult = function(event) {
                const transcript = event.results[0][0].transcript;
                if (userInput) {
                    userInput.value = transcript;
                }
                updateVoiceStatus('Processing speech...', 'processing');
                
                // Auto-send after short delay
                setTimeout(() => {
                    sendMessage();
                }, 800);
            };
            
            recognition.onerror = function(event) {
                console.log('Speech recognition error:', event.error);
                
                let errorMessage = 'Voice input error';
                if (event.error === 'not-allowed') {
                    errorMessage = 'Microphone access denied. Please allow microphone access.';
                } else if (event.error === 'no-speech') {
                    errorMessage = 'No speech detected. Please try again.';
                }
                
                updateVoiceStatus(errorMessage, 'error');
                stopListening();
            };
            
            recognition.onend = function() {
                stopListening();
            };
        } catch (error) {
            console.error('Error initializing speech recognition:', error);
            updateVoiceStatus('Voice recognition unavailable', 'error');
            if (voiceButton) {
                voiceButton.disabled = true;
            }
        }
    } else {
        if (voiceButton) {
            voiceButton.disabled = true;
            voiceButton.innerHTML = '<i class="fas fa-microphone-slash"></i> Not Supported';
        }
        updateVoiceStatus('Voice recognition not supported in this browser', 'error');
    }
}

// Toggle voice recognition
function toggleVoiceRecognition() {
    if (!recognition) {
        updateVoiceStatus('Voice recognition not available', 'error');
        return;
    }
    
    if (!isListening) {
        try {
            // Request microphone permission explicitly
            navigator.mediaDevices.getUserMedia({ audio: true })
                .then(() => {
                    recognition.start();
                })
                .catch((err) => {
                    console.error('Microphone permission denied:', err);
                    updateVoiceStatus('Microphone access required', 'error');
                });
        } catch (error) {
            console.error('Error starting voice recognition:', error);
            updateVoiceStatus('Error starting voice input', 'error');
        }
    } else {
        try {
            recognition.stop();
        } catch (error) {
            console.error('Error stopping recognition:', error);
        }
    }
}

// Stop listening
function stopListening() {
    isListening = false;
    if (voiceButton) {
        voiceButton.innerHTML = '<i class="fas fa-microphone"></i> Voice Input';
        voiceButton.classList.remove('listening');
    }
    updateVoiceStatus('Ready for voice input', 'ready');
}

// Update voice status
function updateVoiceStatus(message, type) {
    if (!voiceStatus) return;
    
    const icons = {
        listening: 'fa-circle',
        processing: 'fa-circle',
        error: 'fa-exclamation-circle',
        ready: 'fa-circle'
    };
    
    const colors = {
        listening: '#e74c3c',
        processing: '#f39c12',
        error: '#e74c3c',
        ready: '#27ae60'
    };
    
    const icon = icons[type] || 'fa-circle';
    const color = colors[type] || '#27ae60';
    
    voiceStatus.innerHTML = `<i class="fas ${icon}" style="color: ${color}"></i> ${message}`;
}

// Send message function
async function sendMessage() {
    if (!userInput || !chatMessages) return;
    
    const message = userInput.value.trim();
    if (!message) return;

    addMessageToChat(message, 'user');
    userInput.value = '';

    showTypingIndicator();

    try {
        // Try to use the server API if available
        const response = await fetch('http://localhost:3000/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message,
                emotion: currentEmotion
            })
        }).catch(() => null); // Catch network errors

        removeTypingIndicator();

        if (response && response.ok) {
            const data = await response.json();
            const aiReply = data?.choices?.[0]?.message?.content || 
                           "I received your message but couldn't generate a proper response.";
            addMessageToChat(aiReply, 'ai');
            speakResponse(aiReply);
        } else {
            // Fallback to local response generation
            const localResponse = getAIResponse(message);
            addMessageToChat(localResponse, 'ai');
            speakResponse(localResponse);
        }
    } catch (error) {
        console.error('Error sending message:', error);
        removeTypingIndicator();
        
        // Fallback to local response
        const localResponse = getAIResponse(message);
        addMessageToChat(localResponse, 'ai');
        speakResponse(localResponse);
    }
}

// Get AI response with perfect English
function getAIResponse(message) {
    const lowerMsg = message.toLowerCase().trim();
    const emotion = currentEmotion;
    
    // Check for exact matches first
    const exactResponses = getExactMatchResponses(lowerMsg, emotion);
    if (exactResponses) return exactResponses;
    
    // Check for greeting patterns
    if (isGreeting(lowerMsg)) {
        return getGreetingResponse(emotion);
    }
    
    // Check for feeling expressions
    if (isFeelingExpression(lowerMsg)) {
        return getFeelingResponse(lowerMsg, emotion);
    }
    
    // Check for questions
    if (isQuestion(lowerMsg)) {
        return getQuestionResponse(lowerMsg, emotion);
    }
    
    // Check for specific topics
    const topicResponse = getTopicResponse(lowerMsg, emotion);
    if (topicResponse) return topicResponse;
    
    // Default contextual response
    return getContextualResponse(message, emotion);
}

// Check for exact matches
function getExactMatchResponses(message, emotion) {
    const exactMatches = {
        // Greetings
        'hello': getGreetingResponse(emotion),
        'hi': getGreetingResponse(emotion),
        'hey': getGreetingResponse(emotion),
        'good morning': getGreetingResponse(emotion),
        'good afternoon': getGreetingResponse(emotion),
        'good evening': getGreetingResponse(emotion),
        
        // Common questions
        'how are you': `I am functioning optimally, thank you for asking. ${getEmotionContext(emotion)}How are you feeling today?`,
        'what is your name': "I am an Emotional AI Assistant designed to provide meaningful conversation and support based on emotional context.",
        'who are you': "I am an AI assistant specialized in emotional intelligence and contextual response generation.",
        
        // Simple responses
        'thank you': "You are most welcome. I am pleased to be of assistance.",
        'thanks': "You're welcome. Is there anything else I can help you with?",
        'bye': `Goodbye. ${getEmotionGoodbye(emotion)}Thank you for the conversation.`,
        'goodbye': `Farewell. ${getEmotionGoodbye(emotion)}It was a pleasure speaking with you.`,
        
        // Emotions
        'i am happy': "That is wonderful to hear! Happiness is a positive state that enhances overall wellbeing. What is contributing to your happiness today?",
        'i am sad': "I understand you are feeling sad. It is completely natural to experience sadness at times. Would you like to discuss what is troubling you?",
        'i am angry': "I acknowledge your feelings of anger. It can be helpful to identify the source of frustration and address it constructively.",
        'i am tired': "Fatigue can affect both physical and mental wellbeing. Adequate rest and self-care are important for maintaining balance."
    };
    
    return exactMatches[message] || null;
}

// Check if message is a greeting
function isGreeting(message) {
    const greetings = ['hi', 'hello', 'hey', 'greetings', 'good morning', 'good afternoon', 'good evening'];
    return greetings.some(greeting => message.includes(greeting));
}

// Get greeting response
function getGreetingResponse(emotion) {
    const greetings = [
        `Hello! ${getEmotionContext(emotion)}How may I assist you today?`,
        `Greetings! ${getEmotionContext(emotion)}What would you like to discuss?`,
        `Good day! ${getEmotionContext(emotion)}I am ready to help with any questions or concerns you may have.`,
        `Hello there! ${getEmotionContext(emotion)}I am your emotional AI assistant. How can I be of service?`
    ];
    
    return greetings[Math.floor(Math.random() * greetings.length)];
}

// Check if message expresses feelings
function isFeelingExpression(message) {
    const feelingPatterns = [
        /i (feel|am feeling)/,
        /i am /,
        /i'm /,
        /i feel /,
        /feeling /
    ];
    
    return feelingPatterns.some(pattern => pattern.test(message));
}

// Get feeling response
function getFeelingResponse(message, emotion) {
    // Extract the feeling from the message
    let feeling = '';
    
    const patterns = [
        /i (feel|am feeling) (\w+)/,
        /i am (\w+)/,
        /i'm (\w+)/,
        /i feel (\w+)/,
        /feeling (\w+)/
    ];
    
    for (const pattern of patterns) {
        const match = message.match(pattern);
        if (match && match[2]) {
            feeling = match[2].toLowerCase();
            break;
        } else if (match && match[1]) {
            feeling = match[1].toLowerCase();
            break;
        }
    }
    
    // Common feelings and their responses
    const feelingResponses = {
        // Positive feelings
        'happy': "That is excellent! Positive emotions contribute to overall wellbeing. What specifically is bringing you happiness?",
        'good': "I am pleased to hear you are doing well. Maintaining positive states benefits both mental and physical health.",
        'great': "Wonderful! It is always encouraging to hear when someone is experiencing positive emotions.",
        'excited': "Excitement often accompanies new opportunities or positive developments. What has you feeling excited?",
        'joyful': "Joy is a profound positive emotion that enriches life experience. Cherish these moments.",
        
        // Negative feelings
        'sad': "I understand you are experiencing sadness. These feelings are valid and important to acknowledge. Would discussing them help?",
        'bad': "I am sorry to hear you are not feeling well. Difficult emotions are a natural part of human experience.",
        'angry': "Anger can signal that something important needs attention. Understanding the source can lead to constructive solutions.",
        'mad': "Feelings of anger are natural responses to certain situations. It may help to explore what triggered this response.",
        'tired': "Fatigue affects many aspects of life. Adequate rest and self-care practices can help restore energy levels.",
        'exhausted': "Exhaustion can be both physical and emotional. Prioritizing rest and recovery is essential.",
        'anxious': "Anxiety can be challenging to manage. Focusing on breathing and present moment awareness sometimes helps.",
        'nervous': "Nervousness often accompanies new experiences or important events. It typically decreases with familiarity.",
        'worried': "Worry focuses attention on potential problems. Sometimes examining worst-case scenarios realistically can reduce anxiety.",
        'stressed': "Stress is a common response to demands. Identifying specific stressors can help develop coping strategies.",
        'lonely': "Feelings of loneliness are common and valid. Human connection, even virtual, can help alleviate these feelings.",
        'bored': "Boredom can signal a need for engagement or novelty. Sometimes it sparks creativity or new interests.",
        'confused': "Confusion often precedes understanding. Breaking complex matters into smaller parts can sometimes bring clarity.",
        
        // Neutral feelings
        'okay': "That is reasonable. Many people experience neutral or okay states frequently.",
        'fine': "Being fine is a stable state that allows for productivity and routine activities.",
        'alright': "Alright is a satisfactory state that provides a foundation for daily functioning.",
        'neutral': "Neutral states provide emotional balance and stability, which can be beneficial for clear thinking."
    };
    
    // Return specific response if feeling is recognized
    if (feeling && feelingResponses[feeling]) {
        return feelingResponses[feeling];
    }
    
    // Default feeling response
    return `Thank you for sharing how you feel. ${getEmotionContext(emotion)}Is there anything specific you would like to discuss regarding these feelings?`;
}

// Check if message is a question
function isQuestion(message) {
    return message.endsWith('?') || 
           message.startsWith('what') || 
           message.startsWith('how') || 
           message.startsWith('why') || 
           message.startsWith('when') || 
           message.startsWith('where') || 
           message.startsWith('who') || 
           message.startsWith('can you') ||
           message.startsWith('could you') ||
           message.startsWith('would you');
}

// Get question response
function getQuestionResponse(message, emotion) {
    const questionMap = {
        // What questions
        'what can you do': "I can engage in meaningful conversation, provide emotional support based on context, answer questions across various topics, and adapt my responses based on emotional states.",
        'what is this': "This is an Emotional AI Assistant interface that simulates emotion detection and provides contextually appropriate responses.",
        'what is emotion': "Emotions are complex psychological and physiological states that influence thoughts, behaviors, and decisions. They serve important functions in human experience.",
        'what is ai': "Artificial Intelligence refers to computer systems designed to perform tasks requiring human-like intelligence, such as understanding language and recognizing patterns.",
        'what is mental health': "Mental health encompasses emotional, psychological, and social wellbeing. It affects how we think, feel, and act in daily life.",
        
        // How questions
        'how does this work': "This system uses simulated emotion states to demonstrate how emotional context can enhance AI interactions and response appropriateness.",
        'how are you': `I am functioning optimally, thank you. ${getEmotionContext(emotion)}How are you feeling today?`,
        'how can i be happy': "Happiness often involves gratitude, meaningful connections, engaging activities, physical wellbeing, and perspective. Small daily practices can contribute significantly.",
        'how can i improve': "Self-improvement typically involves setting clear goals, developing consistent habits, seeking knowledge, and practicing self-compassion during the process.",
        'how do i deal with': "Challenges often benefit from clear problem definition, consideration of multiple perspectives, breaking issues into manageable parts, and seeking appropriate support.",
        
        // Why questions
        'why am i': "Self-understanding is a complex process that involves reflection, experience, and sometimes professional guidance. Our feelings and behaviors have multiple influencing factors.",
        'why do i feel': "Feelings arise from complex interactions between thoughts, experiences, physiology, and circumstances. Understanding specific contexts often provides insight.",
        'why is this happening': "Situations typically have multiple contributing factors. Systematic examination of circumstances can sometimes reveal patterns or causes.",
        
        // Can/Could questions
        'can you help': `Certainly. ${getEmotionContext(emotion)}Please specify what kind of assistance you require, and I will do my best to provide helpful information or guidance.`,
        'could you explain': "I would be pleased to provide explanation. Please specify the topic or concept you would like me to elaborate on.",
        'would you tell me': "I am happy to share information. Please let me know what specific topic or question you have in mind.",
        
        // General knowledge
        'what time is it': `The current time is ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. ${getEmotionContext(emotion)}`,
        'what day is it': `Today is ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}. ${getEmotionContext(emotion)}`,
        'what is the weather': "I do not have real-time weather data access. However, weather often significantly influences mood and daily activities.",
        'what should i do': "Decision-making depends on individual circumstances, values, and goals. Sometimes listing options and considering consequences can provide clarity."
    };
    
    // Check for exact question matches
    for (const [question, response] of Object.entries(questionMap)) {
        if (message.includes(question)) {
            return response;
        }
    }
    
    // Default question response
    const defaultResponses = [
        `That is an interesting question. ${getEmotionContext(emotion)}Could you elaborate on what specifically you would like to know?`,
        `I appreciate your inquiry. ${getEmotionContext(emotion)}My knowledge on this topic may be limited, but I will provide the most accurate information available to me.`,
        `Thank you for your question. ${getEmotionContext(emotion)}This is a thoughtful topic worthy of consideration and discussion.`
    ];
    
    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
}

// Get topic-specific response
function getTopicResponse(message, emotion) {
    const topics = {
        // Technology
        'technology': "Technology continues to evolve rapidly, influencing how we communicate, work, and understand the world around us.",
        'computer': "Computers have transformed modern society, enabling unprecedented information access and communication capabilities.",
        'internet': "The internet has created global connectivity, fundamentally changing how we access information and interact with others.",
        'ai': "Artificial Intelligence represents a significant technological advancement with applications across numerous fields and industries.",
        
        // Health and wellness
        'health': "Health encompasses physical, mental, and social wellbeing. Balanced nutrition, exercise, and rest contribute to overall health.",
        'exercise': "Regular physical activity provides numerous benefits including improved mood, increased energy, and better overall health.",
        'sleep': "Adequate sleep is essential for cognitive function, emotional regulation, and physical recovery. Most adults require 7-9 hours nightly.",
        'diet': "Balanced nutrition provides necessary nutrients for bodily functions and can significantly impact energy levels and overall wellbeing.",
        'meditation': "Meditation practices can reduce stress, improve focus, and enhance emotional regulation through mindfulness and awareness.",
        
        // Psychology
        'psychology': "Psychology studies mind and behavior, examining how people think, feel, and act individually and in social contexts.",
        'emotion': "Emotions are complex responses involving physiological, cognitive, and behavioral components that influence decision-making and social interactions.",
        'mindfulness': "Mindfulness involves present-moment awareness without judgment, often reducing stress and improving emotional regulation.",
        'therapy': "Therapeutic approaches provide structured support for addressing psychological challenges and developing coping strategies.",
        
        // Daily life
        'work': "Work provides structure, purpose, and resources. Balance between work and personal life contributes to overall satisfaction.",
        'study': "Learning involves acquiring knowledge and skills through study, experience, or teaching. Effective strategies enhance retention and understanding.",
        'relationship': "Relationships involve connection, communication, and mutual understanding between individuals, contributing significantly to life satisfaction.",
        'family': "Family relationships provide fundamental social connections that influence development, support systems, and personal identity.",
        'friend': "Friendships offer social support, shared experiences, and mutual understanding outside family relationships.",
        
        // Current events
        'news': "Staying informed about current events is valuable, though balancing information consumption with emotional wellbeing is important.",
        'weather': "Weather conditions influence daily activities, mood, and planning. Seasonal changes often affect energy levels and routines.",
        'travel': "Travel exposes individuals to new cultures, perspectives, and experiences, often broadening understanding and creating memories."
    };
    
    // Check for topic keywords
    for (const [topic, response] of Object.entries(topics)) {
        if (message.includes(topic)) {
            return `${response} ${getEmotionContext(emotion)}`;
        }
    }
    
    return null;
}

// Get contextual response for non-specific messages
function getContextualResponse(message, emotion) {
    const responses = {
        happy: [
            `"${message}" - Thank you for sharing. Your positive perspective enhances our conversation.`,
            `I appreciate you mentioning "${message}". It is encouraging to discuss this while you are in a positive state.`,
            `Thank you for discussing "${message}". Your optimistic approach to this topic is noticeable and appreciated.`
        ],
        sad: [
            `Regarding "${message}" - I understand this topic may have particular significance given your current emotional state.`,
            `"${message}" - Thank you for bringing this up. These matters are important to acknowledge and discuss.`,
            `I hear you mentioning "${message}". Your perspective on this is valued, especially during challenging times.`
        ],
        angry: [
            `"${message}" - I acknowledge the importance of this matter. Constructive discussion can sometimes lead to resolution.`,
            `Regarding "${message}" - Your strong feelings about this are noted. Exploring this further might provide clarity.`,
            `Thank you for expressing this: "${message}". Addressing difficult topics honestly is important.`
        ],
        surprise: [
            `"${message}" - That is unexpected information. How do you feel about this development?`,
            `Regarding "${message}" - This surprising topic raises interesting considerations for discussion.`,
            `"${message}" - This unexpected mention introduces new dimensions to our conversation.`
        ],
        neutral: [
            `Thank you for mentioning: "${message}". I appreciate your contribution to our discussion.`,
            `Regarding "${message}" - This is a reasonable point for consideration and discussion.`,
            `"${message}" - Thank you for sharing this perspective. It adds depth to our conversation.`
        ]
    };
    
    const emotionResponses = responses[emotion] || [
        `Thank you for sharing: "${message}". I appreciate our conversation.`,
        `Regarding "${message}" - This contributes meaningfully to our discussion.`,
        `"${message}" - Thank you for this thoughtful contribution to our conversation.`
    ];
    
    return emotionResponses[Math.floor(Math.random() * emotionResponses.length)];
}

// Get emotion context for responses
function getEmotionContext(emotion) {
    const contexts = {
        happy: "I notice you appear to be in a positive emotional state. ",
        sad: "I understand you may be experiencing difficult emotions. ",
        angry: "I acknowledge the intensity of your current emotional state. ",
        surprise: "You seem surprised or particularly engaged. ",
        neutral: "I am attentive to your needs and perspectives. ",
        fear: "I sense some apprehension in your current state. ",
        disgust: "I notice signals of strong emotional response. "
    };
    
    return contexts[emotion] || "I am focused on providing meaningful response. ";
}

// Get emotion-based goodbye
function getEmotionGoodbye(emotion) {
    const goodbyes = {
        happy: "I hope your positive mood continues. ",
        sad: "Remember that difficult emotions typically pass with time and perspective. ",
        angry: "I hope you find constructive ways to process and address these feelings. ",
        surprise: "I hope whatever surprised you leads to positive outcomes. ",
        neutral: "I wish you a productive and balanced day. "
    };
    
    return goodbyes[emotion] || "I wish you well. ";
}

// Add message to chat
function addMessageToChat(message, sender) {
    if (!chatMessages) return;
    
    const messageElement = document.createElement('div');
    messageElement.className = 'message ' + sender + '-message';
    
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    messageElement.innerHTML = `
        <div class="message-avatar">
            <i class="fas fa-${sender === 'ai' ? 'robot' : 'user'}"></i>
        </div>
        <div class="message-content">
            <div class="message-sender">${sender === 'ai' ? 'AI Assistant' : 'You'}</div>
            <div class="message-text">${message}</div>
            <div class="message-time">${timeString}</div>
        </div>
    `;
    
    chatMessages.appendChild(messageElement);
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Show typing indicator
function showTypingIndicator() {
    if (!chatMessages) return;
    
    const typingElement = document.createElement('div');
    typingElement.className = 'message ai-message typing-indicator';
    typingElement.id = 'typingIndicator';
    
    typingElement.innerHTML = `
        <div class="message-avatar">
            <i class="fas fa-robot"></i>
        </div>
        <div class="message-content">
            <div class="message-sender">AI Assistant</div>
            <div class="message-text typing-dots">
                <span></span>
                <span></span>
                <span></span>
            </div>
        </div>
    `;
    
    chatMessages.appendChild(typingElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Remove typing indicator
function removeTypingIndicator() {
    const typingIndicator = document.getElementById('typingIndicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

// Speak response
function speakResponse(text) {
    if ('speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined') {
        try {
            // Cancel any ongoing speech
            window.speechSynthesis.cancel();
            
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 0.95;
            utterance.pitch = 1.0;
            utterance.volume = 1.0;
            
            // Get available voices
            const voices = window.speechSynthesis.getVoices();
            if (voices.length > 0) {
                // Try to find an English voice
                const englishVoice = voices.find(voice => voice.lang.startsWith('en')) || voices[0];
                utterance.voice = englishVoice;
            }
            
            window.speechSynthesis.speak(utterance);
        } catch (error) {
            console.error('Speech synthesis error:', error);
        }
    }
}

// Clear chat
function clearChat() {
    if (!chatMessages) return;
    
    chatMessages.innerHTML = `
        <div class="message ai-message">
            <div class="message-avatar">
                <i class="fas fa-robot"></i>
            </div>
            <div class="message-content">
                <div class="message-sender">AI Assistant</div>
                <div class="message-text">Chat cleared. Hello! I am your emotional AI assistant. You can manually set emotions using the buttons above, or enable auto-cycle mode.</div>
                <div class="message-time">Just now</div>
            </div>
        </div>
    `;
    
    conversationHistory = [];
    
    // Add initial message
    setTimeout(() => {
        addMessageToChat('How may I assist you today?', 'ai');
    }, 500);
}

// Suggest a conversation topic
function suggestTopic() {
    const topics = [
        "How are you feeling today?",
        "What has been on your mind recently?",
        "Is there anything you would like to discuss or ask about?",
        "How has your day been so far?",
        "Is there a particular topic or question you would like to explore?",
        "What are your thoughts on emotional intelligence?",
        "How do you typically handle challenging emotions?",
        "What brings you joy or satisfaction in daily life?"
    ];
    
    const randomTopic = topics[Math.floor(Math.random() * topics.length)];
    addMessageToChat(`Conversation suggestion: ${randomTopic}`, 'ai');
}