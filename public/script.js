// AI Emotional Assistant - FIXED VERSION WITH PROPER EMOTION DETECTION

// Global variables
let currentEmotion = 'neutral';
let isAutoEmotionEnabled = false;
let autoEmotionInterval = null;
let isListening = false;
let recognition = null;
let conversationHistory = [];
let mediaRecorder = null;
let audioChunks = [];
let isRecording = false;
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
const voiceButtonInside = document.getElementById('voiceButtonInside');
const sendButtonInside = document.getElementById('sendButtonInside');
const voiceStatus = document.getElementById('voiceStatus');
const clearChatButton = document.getElementById('clearChat');
const suggestTopicButton = document.getElementById('suggestTopic');
const responseStyleDisplay = document.getElementById('responseStyle');
const mobileStateIcon = document.getElementById('mobileStateIcon');
const mobileStateText = document.getElementById('mobileStateText');
const mobileStateConfidence = document.getElementById('mobileStateConfidence');
const mobileResponseStyle = document.getElementById('mobileResponseStyle');

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

// Enhanced emotion keywords with weights
const emotionKeywords = {
    happy: {
        keywords: ['happy', 'great', 'awesome', 'excellent', 'wonderful', 'good', 'love', 'amazing', 'fantastic', 'joy', 'excited', 'delighted', 'pleased', 'cheerful', 'thrilled', 'ecstatic'],
        weight: 25
    },
    sad: {
        keywords: ['sad', 'unhappy', 'depressed', 'down', 'upset', 'heartbroken', 'miserable', 'terrible', 'awful', 'crying', 'lonely', 'gloomy', 'melancholy', 'disappointed', 'hurt'],
        weight: 25
    },
    angry: {
        keywords: ['angry', 'mad', 'furious', 'annoyed', 'frustrated', 'irritated', 'hate', 'rage', 'pissed', 'outrage', 'resentful', 'bitter', 'enraged'],
        weight: 25
    },
    surprise: {
        keywords: ['wow', 'surprised', 'shocked', 'amazing', 'unexpected', 'omg', 'oh my god', 'no way', 'really', 'what', 'astonished', 'stunned', 'startled'],
        weight: 20
    },
    fear: {
        keywords: ['scared', 'afraid', 'fear', 'terrified', 'worried', 'anxious', 'nervous', 'panic', 'horror', 'frightened', 'dread', 'alarmed', 'uneasy'],
        weight: 25
    },
    neutral: {
        keywords: ['okay', 'fine', 'alright', 'neutral', 'normal', 'regular', 'standard', 'typical'],
        weight: 15
    }
};

// Detect if user is on mobile device
function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    console.log('🤖 AI Emotional Assistant Initialized');
    console.log('📱 Device detected:', isMobileDevice() ? 'Mobile' : 'Desktop/Laptop');
    
    // Initialize with default emotion
    setEmotion('neutral', 85);
    
    // Set up event listeners
    setupEventListeners();
    
    // Initialize voice recognition
    initVoiceRecognition();
    
    // Pre-load voices for mobile
    if (isMobileDevice()) {
        window.speechSynthesis.getVoices();
    }
    
    // Add welcome message
    setTimeout(() => {
        const welcomeMsg = isMobileDevice() 
            ? "👋 Welcome! Type a message with emotional keywords like 'happy', 'sad', or 'angry' and I'll detect your emotion! You can also use voice input."
            : "👋 Welcome! Type messages with emotional keywords or use voice input. I'll detect your emotion from your words!";
        addMessageToChat(welcomeMsg, 'ai');
    }, 500);
});

// Set up all event listeners
function setupEventListeners() {
    // Send message button (desktop)
    if (sendButton) {
        sendButton.addEventListener('click', function() {
            sendMessage();
        });
    }
    
    // Send message button (mobile inside)
    if (sendButtonInside) {
        sendButtonInside.addEventListener('click', function() {
            sendMessage();
        });
    }
    
    // Send message on Enter key
    if (userInput) {
        userInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
        
        // Real-time emotion detection as user types (optional)
        userInput.addEventListener('input', function(e) {
            const text = e.target.value;
            if (text.length > 3) {
                const detected = detectTextEmotion(text);
                // Preview emotion (subtle hint)
                console.log('📝 Detected emotion from text:', detected.emotion, 'Confidence:', detected.confidence);
            }
        });
    }
    
    // Voice button (desktop)
    if (voiceButton) {
        voiceButton.addEventListener('click', toggleVoiceRecognition);
    }
    
    // Voice button (mobile inside)
    if (voiceButtonInside) {
        voiceButtonInside.addEventListener('click', toggleVoiceRecognition);
    }
    
    // Clear chat button
    if (clearChatButton) {
        clearChatButton.addEventListener('click', clearChat);
    }
    
    // Suggest topic button
    if (suggestTopicButton) {
        suggestTopicButton.addEventListener('click', suggestTopic);
    }
    
    // Emotion buttons
    document.querySelectorAll('.emotion-btn').forEach(button => {
        button.addEventListener('click', function() {
            const emotion = this.getAttribute('data-emotion');
            const confidence = Math.floor(Math.random() * 20) + 75; // 75-95%
            setEmotion(emotion, confidence);
            
            // Stop auto emotion if manually selecting
            if (isAutoEmotionEnabled) {
                const autoToggle = document.getElementById('autoEmotionToggle');
                const autoToggleMobile = document.getElementById('autoEmotionToggleMobile');
                if (autoToggle) autoToggle.checked = false;
                if (autoToggleMobile) autoToggleMobile.checked = false;
                toggleAutoEmotion();
            }
            
            // Add feedback message
            addMessageToChat(`✋ Emotion manually set to ${emotion}. I'll respond with a ${getResponseStyle(emotion).toLowerCase()} tone.`, 'ai');
        });
    });
    
    // Auto emotion toggle (desktop)
    if (autoEmotionToggle) {
        autoEmotionToggle.addEventListener('change', function() {
            const mobileToggle = document.getElementById('autoEmotionToggleMobile');
            if (mobileToggle) mobileToggle.checked = this.checked;
            toggleAutoEmotion();
        });
    }
    
    // Auto emotion toggle (mobile)
    const autoEmotionToggleMobile = document.getElementById('autoEmotionToggleMobile');
    if (autoEmotionToggleMobile) {
        autoEmotionToggleMobile.addEventListener('change', function() {
            const desktopToggle = document.getElementById('autoEmotionToggle');
            if (desktopToggle) desktopToggle.checked = this.checked;
            toggleAutoEmotion();
        });
    }
}

// Enhanced emotion detection from text
function detectTextEmotion(text) {
    text = text.toLowerCase();
    
    let scores = {
        happy: 0,
        sad: 0,
        angry: 0,
        surprise: 0,
        fear: 0,
        neutral: 15 // Base neutral score
    };
    
    // Score based on keyword matches with weights
    for (const [emotion, data] of Object.entries(emotionKeywords)) {
        for (const keyword of data.keywords) {
            if (text.includes(keyword)) {
                scores[emotion] += data.weight;
                // Reduce neutral score when emotion detected
                if (emotion !== 'neutral') {
                    scores.neutral = Math.max(0, scores.neutral - 5);
                }
            }
        }
    }
    
    // Check for negations (e.g., "not happy")
    const negations = ['not', 'no', 'never', 'hardly', 'barely', "don't", "doesn't", "didn't"];
    negations.forEach(neg => {
        if (text.includes(neg)) {
            // Reduce positive emotions when negated
            scores.happy = Math.max(0, scores.happy - 15);
            scores.neutral += 10;
        }
    });
    
    // Find highest scoring emotion
    let maxEmotion = 'neutral';
    let maxScore = 0;
    
    for (const [emotion, score] of Object.entries(scores)) {
        if (score > maxScore) {
            maxScore = score;
            maxEmotion = emotion;
        }
    }
    
    // Calculate confidence based on score
    let confidence = 60; // Base confidence
    if (maxScore > 0) {
        confidence = Math.min(98, 60 + (maxScore * 1.5));
    }
    
    console.log('🔍 Emotion Detection Results:', {
        text: text,
        scores: scores,
        detected: maxEmotion,
        confidence: Math.round(confidence)
    });
    
    return { 
        emotion: maxEmotion, 
        confidence: Math.round(confidence),
        scores: scores 
    };
}

// Set emotion manually
function setEmotion(emotion, confidence) {
    currentEmotion = emotion;
    
    // Update emotion intensity
    currentEmotionIntensity[emotion] = confidence;
    
    // Update other emotions with contextual values
    Object.keys(currentEmotionIntensity).forEach(key => {
        if (key !== emotion && key !== 'neutral') {
            // Set related emotions based on the main emotion
            if (emotion === 'happy' && key === 'sad') {
                currentEmotionIntensity[key] = Math.floor(Math.random() * 15);
            } else if (emotion === 'sad' && key === 'happy') {
                currentEmotionIntensity[key] = Math.floor(Math.random() * 15);
            } else {
                currentEmotionIntensity[key] = Math.floor(Math.random() * 25);
            }
        }
    });
    
    // Update display
    updateEmotionDisplay(emotion, confidence);
    updateEmotionBars();
    updateEmotionIcon(emotion);
    updateConfidenceRing(confidence);
    
    // Update response style
    if (responseStyleDisplay) responseStyleDisplay.textContent = getResponseStyle(emotion);
    if (mobileResponseStyle) mobileResponseStyle.textContent = getResponseStyle(emotion);
    
    console.log('✅ Emotion set to:', emotion, 'Confidence:', confidence + '%');
}

// Update confidence ring
function updateConfidenceRing(confidence) {
    const ring = document.getElementById('confidenceRing');
    const label = document.getElementById('confidenceRingLabel');
    
    if (ring && label) {
        const circumference = 201; // 2 * π * 32
        const offset = circumference - (confidence / 100) * circumference;
        ring.style.strokeDashoffset = offset;
        label.textContent = confidence + '%';
        
        // Update color based on confidence
        if (confidence >= 80) {
            ring.style.stroke = '#27ae60';
        } else if (confidence >= 60) {
            ring.style.stroke = '#f39c12';
        } else {
            ring.style.stroke = '#e74c3c';
        }
    }
}

// Update emotion display
function updateEmotionDisplay(emotion, confidence) {
    if (!emotionValue || !confidenceValue || !currentEmotionDisplay) return;
    
    const displayEmotion = emotion.charAt(0).toUpperCase() + emotion.slice(1);
    emotionValue.textContent = displayEmotion;
    confidenceValue.textContent = confidence + '%';
    currentEmotionDisplay.textContent = displayEmotion;
    
    // Update mobile UI if elements exist
    if (mobileStateText) mobileStateText.textContent = displayEmotion;
    if (mobileStateConfidence) mobileStateConfidence.textContent = confidence + '%';
    if (mobileResponseStyle) mobileResponseStyle.textContent = getResponseStyle(emotion);
    
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
    
    // Update mobile icon
    if (mobileStateIcon) {
        mobileStateIcon.innerHTML = `<i class="fas ${iconClass}"></i>`;
    }
}

// Update emotion bars
function updateEmotionBars() {
    // Update each emotion bar (desktop)
    Object.keys(emotionBars).forEach(emotion => {
        if (emotionBars[emotion] && emotionBars[emotion].bar && emotionBars[emotion].value) {
            const intensity = currentEmotionIntensity[emotion] || 0;
            emotionBars[emotion].bar.style.width = intensity + '%';
            emotionBars[emotion].value.textContent = intensity + '%';
            
            // Update bar color based on emotion
            const colors = {
                happy: '#f39c12',
                sad: '#3498db',
                angry: '#e74c3c',
                surprise: '#9b59b6'
            };
            emotionBars[emotion].bar.style.background = colors[emotion] || '#95a5a6';
        }
    });
    
    // Update mobile emotion bars
    document.querySelectorAll('.mobile-emotion-section .emotion-bar-fill').forEach(bar => {
        const emotion = bar.getAttribute('data-emotion');
        if (emotion && currentEmotionIntensity[emotion]) {
            bar.style.width = currentEmotionIntensity[emotion] + '%';
            
            // Update mobile bar colors
            const colors = {
                happy: '#f39c12',
                sad: '#3498db',
                angry: '#e74c3c',
                surprise: '#9b59b6'
            };
            bar.style.background = colors[emotion] || '#95a5a6';
        }
    });
    
    // Update mobile values
    document.querySelectorAll('.mobile-emotion-section .emotion-bar-value').forEach(valueSpan => {
        const container = valueSpan.closest('.emotion-bar-container');
        if (container) {
            const label = container.querySelector('.emotion-bar-label');
            if (label) {
                const text = label.textContent.toLowerCase();
                for (const [emotion, value] of Object.entries(currentEmotionIntensity)) {
                    if (text.includes(emotion)) {
                        valueSpan.textContent = value + '%';
                        break;
                    }
                }
            }
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
        startAutoEmotionCycle();
        addMessageToChat('🔄 Auto emotion cycling enabled. Emotions will change every 5 seconds.', 'ai');
    } else {
        stopAutoEmotionCycle();
        addMessageToChat('⏹️ Auto emotion cycling disabled.', 'ai');
    }
}

// Start auto emotion cycle
function startAutoEmotionCycle() {
    const emotions = ['happy', 'sad', 'angry', 'surprise', 'neutral', 'fear'];
    let currentIndex = 0;
    
    autoEmotionInterval = setInterval(() => {
        const emotion = emotions[currentIndex];
        const confidence = Math.floor(Math.random() * 20) + 75;
        setEmotion(emotion, confidence);
        
        currentIndex = (currentIndex + 1) % emotions.length;
    }, 5000);
}

// Stop auto emotion cycle
function stopAutoEmotionCycle() {
    if (autoEmotionInterval) {
        clearInterval(autoEmotionInterval);
        autoEmotionInterval = null;
    }
}

// Initialize voice recognition with emotion detection
function initVoiceRecognition() {
    if (!voiceStatus) return;
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
        try {
            recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = true; // Enable interim results for better detection
            recognition.lang = 'en-US';
            recognition.maxAlternatives = 3;
            
            recognition.onstart = function() {
                isListening = true;
                updateVoiceStatus('🎤 Listening... Speak clearly', 'listening');
                
                [voiceButton, voiceButtonInside].forEach(btn => {
                    if (btn) {
                        btn.innerHTML = '<i class="fas fa-microphone-slash"></i>';
                        btn.classList.add('listening');
                        if (btn === voiceButton) btn.innerHTML += '<span>Stop</span>';
                    }
                });
            };
            
            recognition.onresult = function(event) {
                const transcript = event.results[0][0].transcript;
                
                // Detect emotion from transcript immediately
                const detectedEmotion = detectTextEmotion(transcript);
                
                // Update emotion in real-time
                setEmotion(detectedEmotion.emotion, detectedEmotion.confidence);
                
                if (userInput) {
                    userInput.value = transcript;
                }
                
                updateVoiceStatus('✅ Speech detected! Processing...', 'processing');
                
                // Show detected emotion
                if (event.results[0].isFinal) {
                    addMessageToChat(`🎤 Voice detected: "${transcript}"`, 'user');
                    
                    // Add emotion detection feedback
                    setTimeout(() => {
                        addMessageToChat(
                            `🔍 I detected a ${detectedEmotion.emotion} tone (${detectedEmotion.confidence}% confidence). Responding accordingly...`,
                            'ai'
                        );
                        
                        // Auto-send after showing detection
                        setTimeout(() => {
                            sendMessage();
                        }, 500);
                    }, 300);
                }
            };
            
            recognition.onerror = function(event) {
                console.log('Speech recognition error:', event.error);
                
                let errorMessage = 'Voice input error';
                if (event.error === 'not-allowed') {
                    errorMessage = '❌ Microphone access denied. Please allow microphone access.';
                } else if (event.error === 'no-speech') {
                    errorMessage = '❌ No speech detected. Please try again.';
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
            disableVoiceButtons();
        }
    } else {
        disableVoiceButtons();
        updateVoiceStatus('Voice recognition not supported in this browser', 'error');
    }
}

// Disable voice buttons if not supported
function disableVoiceButtons() {
    [voiceButton, voiceButtonInside].forEach(btn => {
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-microphone-slash"></i>';
            if (btn === voiceButton) btn.innerHTML += '<span>Not Supported</span>';
            btn.title = 'Voice not supported in this browser';
        }
    });
}

// Stop listening
function stopListening() {
    isListening = false;
    
    [voiceButton, voiceButtonInside].forEach(btn => {
        if (btn) {
            btn.innerHTML = '<i class="fas fa-microphone"></i>';
            btn.classList.remove('listening');
            if (btn === voiceButton) btn.innerHTML += '<span>Voice</span>';
        }
    });
    
    updateVoiceStatus('🎙️ Ready for voice input', 'ready');
}

// Update voice status
function updateVoiceStatus(message, type) {
    if (!voiceStatus) return;
    
    const colors = {
        listening: '#e74c3c',
        processing: '#f39c12',
        error: '#e74c3c',
        ready: '#27ae60'
    };
    
    const color = colors[type] || '#27ae60';
    
    voiceStatus.innerHTML = `<i class="fas fa-circle" style="color: ${color}"></i><span>${message}</span>`;
}

// Toggle voice recognition
function toggleVoiceRecognition() {
    if (!recognition) {
        updateVoiceStatus('Voice recognition not available', 'error');
        return;
    }
    
    if (!isListening) {
        try {
            navigator.mediaDevices.getUserMedia({ audio: true })
                .then((stream) => {
                    if (window.audioStream) {
                        window.audioStream.getTracks().forEach(track => track.stop());
                    }
                    window.audioStream = stream;
                    recognition.start();
                })
                .catch((err) => {
                    console.error('Microphone permission denied:', err);
                    updateVoiceStatus('Microphone access required', 'error');
                    addMessageToChat('🎤 To use voice input, please allow microphone access when prompted.', 'ai');
                });
        } catch (error) {
            console.error('Error starting voice recognition:', error);
            updateVoiceStatus('Error starting voice input', 'error');
        }
    } else {
        try {
            recognition.stop();
            if (window.audioStream) {
                window.audioStream.getTracks().forEach(track => track.stop());
                window.audioStream = null;
            }
        } catch (error) {
            console.error('Error stopping recognition:', error);
        }
    }
}

// MAIN SEND MESSAGE FUNCTION with emotion detection
async function sendMessage() {
    if (!userInput || !chatMessages) return;
    
    const message = userInput.value.trim();
    if (!message) return;
    
    // Detect emotion from the message BEFORE sending
    const detectedEmotion = detectTextEmotion(message);
    
    // Update the emotion based on the message
    setEmotion(detectedEmotion.emotion, detectedEmotion.confidence);
    
    // Add user message to chat
    addMessageToChat(message, 'user');
    userInput.value = '';
    
    // Show emotion detection feedback
    setTimeout(() => {
        const emotionFeedback = `🔍 I detected a ${detectedEmotion.emotion} tone in your message (${detectedEmotion.confidence}% confidence)`;
        addMessageToChat(emotionFeedback, 'ai');
    }, 300);
    
    showTypingIndicator();
    
    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message,
                emotion: currentEmotion
            })
        }).catch(() => null);
        
        removeTypingIndicator();
        
        let aiReply;
        
        if (response && response.ok) {
            const data = await response.json();
            aiReply = data?.choices?.[0]?.message?.content;
            
            // Check for generic response
            const genericResponse = "Artificial Intelligence represents a significant technological advancement";
            
            if (!aiReply || aiReply.includes(genericResponse)) {
                aiReply = getEnhancedResponse(message, currentEmotion);
            }
        } else {
            aiReply = getEnhancedResponse(message, currentEmotion);
        }
        
        // Add AI response
        addMessageToChat(aiReply, 'ai');
        
        // Voice response
        if (isMobileDevice()) {
            mobileSafeSpeak(aiReply);
        } else {
            speakResponse(aiReply);
        }
        
    } catch (error) {
        console.error('Error sending message:', error);
        removeTypingIndicator();
        
        const localResponse = getEnhancedResponse(message, currentEmotion);
        addMessageToChat(localResponse, 'ai');
        
        if (isMobileDevice()) {
            mobileSafeSpeak(localResponse);
        } else {
            speakResponse(localResponse);
        }
    }
}

// Enhanced response generator
function getEnhancedResponse(message, emotion) {
    const lowerMsg = message.toLowerCase().trim();
    
    // Check for greetings
    if (isGreeting(lowerMsg)) {
        return isMobileDevice() ? getMobileGreeting(emotion) : getGreetingResponse(emotion);
    }
    
    // Check for common phrases
    if (lowerMsg.includes('hello') || lowerMsg.includes('hi')) {
        return isMobileDevice() ? getMobileGreeting(emotion) : getGreetingResponse(emotion);
    }
    
    // Check for joke requests
    if (lowerMsg.includes('joke') || lowerMsg.includes('funny')) {
        return getRandomJoke();
    }
    
    // Check for fact requests
    if (lowerMsg.includes('fact') || lowerMsg.includes('interesting')) {
        return getRandomFact();
    }
    
    // Check for feelings
    if (isFeelingExpression(lowerMsg)) {
        return getFeelingResponse(lowerMsg, emotion);
    }
    
    // Check for questions
    if (isQuestion(lowerMsg)) {
        return getQuestionResponse(lowerMsg, emotion);
    }
    
    // Check for topics
    const topicResponse = getTopicResponse(lowerMsg, emotion);
    if (topicResponse) return topicResponse;
    
    // Default response with emotion context
    if (isMobileDevice()) {
        return getMobileDefaultResponse(emotion);
    } else {
        return getContextualResponse(message, emotion);
    }
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
        `Good day! ${getEmotionContext(emotion)}I'm ready to help with any questions or concerns.`,
        `Hello there! ${getEmotionContext(emotion)}I'm your emotional AI assistant. How can I help?`
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
    
    const feelingResponses = {
        'happy': "That's excellent! Positive emotions contribute to overall wellbeing. What's bringing you happiness?",
        'good': "I'm pleased to hear you're doing well. Maintaining positive states benefits both mental and physical health.",
        'great': "Wonderful! It's always encouraging to hear when someone is experiencing positive emotions.",
        'excited': "Excitement often accompanies new opportunities or positive developments. What has you feeling excited?",
        'sad': "I understand you're experiencing sadness. These feelings are valid and important to acknowledge. Would discussing them help?",
        'bad': "I'm sorry to hear you're not feeling well. Difficult emotions are a natural part of human experience.",
        'angry': "Anger can signal that something important needs attention. Understanding the source can lead to constructive solutions.",
        'tired': "Fatigue affects many aspects of life. Adequate rest and self-care practices can help restore energy levels.",
        'anxious': "Anxiety can be challenging to manage. Focusing on breathing and present moment awareness sometimes helps.",
        'stressed': "Stress is a common response to demands. Identifying specific stressors can help develop coping strategies.",
        'lonely': "Feelings of loneliness are common and valid. Human connection, even virtual, can help alleviate these feelings."
    };
    
    if (feeling && feelingResponses[feeling]) {
        return feelingResponses[feeling];
    }
    
    return `Thank you for sharing how you feel. ${getEmotionContext(emotion)}Is there anything specific you'd like to discuss?`;
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
           message.startsWith('could you');
}

// Get question response
function getQuestionResponse(message, emotion) {
    const questionMap = {
        'what can you do': "I can engage in meaningful conversation, detect emotions from your words, provide emotional support, and adapt my responses based on your emotional state.",
        'what is this': "This is an Emotional AI Assistant that detects emotions from your messages and voice, providing contextually appropriate responses.",
        'how are you': `I'm functioning optimally, thank you. ${getEmotionContext(emotion)}How are you feeling today?`,
        'how does this work': "I analyze your words for emotional keywords and patterns, then adjust my responses to match your emotional state for more empathetic interaction.",
        'can you help': `Certainly. ${getEmotionContext(emotion)}Please specify what kind of assistance you need.`
    };
    
    for (const [question, response] of Object.entries(questionMap)) {
        if (message.includes(question)) {
            return response;
        }
    }
    
    const defaultResponses = [
        `That's an interesting question. ${getEmotionContext(emotion)}Could you elaborate?`,
        `I appreciate your inquiry. ${getEmotionContext(emotion)}Let me provide the best answer I can.`,
        `Thank you for your question. ${getEmotionContext(emotion)}This is a thoughtful topic to discuss.`
    ];
    
    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
}

// Get topic-specific response
function getTopicResponse(message, emotion) {
    const topics = {
        'technology': "Technology continues to evolve rapidly, influencing how we communicate, work, and understand the world.",
        'ai': "Artificial Intelligence represents a significant advancement, with applications across numerous fields and industries.",
        'health': "Health encompasses physical, mental, and social wellbeing. Balanced nutrition, exercise, and rest contribute to overall health.",
        'emotion': "Emotions are complex responses involving physiological, cognitive, and behavioral components that influence decision-making."
    };
    
    for (const [topic, response] of Object.entries(topics)) {
        if (message.includes(topic)) {
            return `${response} ${getEmotionContext(emotion)}`;
        }
    }
    
    return null;
}

// Get contextual response
function getContextualResponse(message, emotion) {
    const responses = {
        happy: [
            `"${message}" - Thank you for sharing. Your positive perspective enhances our conversation.`,
            `I appreciate you mentioning "${message}". It's encouraging to discuss this while you're in a positive state.`,
            `Thank you for discussing "${message}". Your optimistic approach is noticeable and appreciated.`
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
        neutral: [
            `Thank you for mentioning: "${message}". I appreciate your contribution to our discussion.`,
            `Regarding "${message}" - This is a reasonable point for consideration and discussion.`,
            `"${message}" - Thank you for sharing this perspective. It adds depth to our conversation.`
        ]
    };
    
    const emotionResponses = responses[emotion] || responses.neutral;
    return emotionResponses[Math.floor(Math.random() * emotionResponses.length)];
}

// Get emotion context for responses
function getEmotionContext(emotion) {
    const contexts = {
        happy: "I notice you appear to be in a positive emotional state. ",
        sad: "I understand you may be experiencing difficult emotions. ",
        angry: "I acknowledge the intensity of your current emotional state. ",
        surprise: "You seem surprised or particularly engaged. ",
        neutral: "I'm attentive to your needs and perspectives. ",
        fear: "I sense some apprehension in your current state. "
    };
    
    return contexts[emotion] || "I'm focused on providing a meaningful response. ";
}

// Mobile-optimized response functions
function getMobileGreeting(emotion) {
    const greetings = {
        happy: "Hey there! 😊 You seem happy today! What's on your mind?",
        sad: "Hello! 💙 I'm here to listen if you want to talk about anything.",
        angry: "Hi! 😤 Take a deep breath - I'm here to help however I can.",
        surprise: "Hey! 😲 You seem surprised! What's going on?",
        neutral: "Hello! 👋 Ready to chat? How can I help you today?",
        fear: "Hi there! 🤗 Don't worry, I'm here to help. What's on your mind?"
    };
    return greetings[emotion] || greetings.neutral;
}

function getRandomFact() {
    const facts = [
        "Did you know? Honey never spoils! Archaeologists found 3000-year-old honey in Egyptian tombs that's still edible. 🍯",
        "Fun fact: Octopuses have three hearts and blue blood! 🐙",
        "Interesting: Bananas are berries, but strawberries aren't! 🍌",
        "Did you know? A day on Venus is longer than its year! 🌕",
        "Fun fact: The Eiffel Tower can grow up to 15cm taller in summer due to thermal expansion! 🗼"
    ];
    return facts[Math.floor(Math.random() * facts.length)];
}

function getRandomJoke() {
    const jokes = [
        "Why don't scientists trust atoms? Because they make up everything! 😄",
        "What do you call a fake noodle? An impasta! 🍝",
        "Why did the scarecrow win an award? He was outstanding in his field! 🌾",
        "What do you call a bear with no teeth? A gummy bear! 🐻",
        "Why don't eggs tell jokes? They'd crack each other up! 🥚"
    ];
    return jokes[Math.floor(Math.random() * jokes.length)];
}

function getMobileDefaultResponse(emotion) {
    const responses = {
        happy: "That's interesting! 😊 Tell me more about that!",
        sad: "I understand. 💙 Would you like to talk more about this?",
        angry: "I hear you. 😤 Let's talk it through - what's bothering you?",
        surprise: "Wow! 😲 That's surprising! What happened next?",
        neutral: "Interesting! 👋 What else is on your mind?",
        fear: "I'm here for you. 🤗 Would discussing this help?"
    };
    return responses[emotion] || "Tell me more about that! I'm listening.";
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

// Desktop speak function
function speakResponse(text) {
    if (!('speechSynthesis' in window)) {
        console.log('Speech synthesis not supported');
        return;
    }
    
    try {
        window.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        const voices = window.speechSynthesis.getVoices();
        
        const voiceConfig = {
            happy: { rate: 1.1, pitch: 1.2, volume: 1.0 },
            sad: { rate: 0.8, pitch: 0.9, volume: 0.9 },
            angry: { rate: 1.2, pitch: 1.1, volume: 1.0 },
            surprise: { rate: 1.3, pitch: 1.3, volume: 1.0 },
            neutral: { rate: 0.95, pitch: 1.0, volume: 1.0 },
            fear: { rate: 0.9, pitch: 1.1, volume: 0.9 }
        };
        
        const config = voiceConfig[currentEmotion] || voiceConfig.neutral;
        
        const selectedVoice = voices.find(v => v.lang && v.lang.startsWith('en'));
        if (selectedVoice) {
            utterance.voice = selectedVoice;
        }
        
        utterance.rate = config.rate;
        utterance.pitch = config.pitch;
        utterance.volume = config.volume;
        
        window.speechSynthesis.speak(utterance);
        
    } catch (e) {
        console.log('Speech error:', e);
    }
}

// Mobile-safe speech function
function mobileSafeSpeak(text) {
    if (!('speechSynthesis' in window)) {
        console.log('Speech not supported on this device');
        return;
    }
    
    try {
        window.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        const voices = window.speechSynthesis.getVoices();
        
        const androidVoice = voices.find(v => 
            v.name && v.name.includes('Google') && v.lang && v.lang.startsWith('en')
        ) || voices.find(v => v.lang && v.lang.startsWith('en'));
        
        if (androidVoice) {
            utterance.voice = androidVoice;
        }
        
        utterance.rate = 0.9;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        
        window.speechSynthesis.speak(utterance);
        
    } catch (e) {
        console.log('Mobile speech failed:', e);
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
                <div class="message-text">Chat cleared! 👋 I'm still here to help. Type a message with emotional keywords like "happy", "sad", or "angry" and I'll detect your emotion!</div>
                <div class="message-time">Just now</div>
            </div>
        </div>
    `;
    
    conversationHistory = [];
}

// Suggest a conversation topic
function suggestTopic() {
    const topics = [
        "I'm feeling happy today!",
        "I'm a bit sad about something",
        "Tell me a joke!",
        "I'm feeling angry about work",
        "Tell me an interesting fact!",
        "I'm feeling anxious",
        "How are you?",
        "I'm excited about something!"
    ];
    
    const randomTopic = topics[Math.floor(Math.random() * topics.length)];
    if (userInput) {
        userInput.value = randomTopic;
        userInput.focus();
    }
    
    // Highlight that this will trigger emotion detection
    addMessageToChat(`💡 Try sending: "${randomTopic}" - I'll detect the emotion from your words!`, 'ai');
}