// Run this in your browser console to check if models load
console.log('Testing face-api.js model loading...');

// Try loading from alternative CDN
const modelPath = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights';

Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri(modelPath),
    faceapi.nets.faceLandmark68Net.loadFromUri(modelPath),
    faceapi.nets.faceRecognitionNet.loadFromUri(modelPath),
    faceapi.nets.faceExpressionNet.loadFromUri(modelPath)
]).then(() => {
    console.log('Models loaded successfully from CDN');
}).catch(error => {
    console.error('Failed to load models from CDN:', error);
    console.log('Using fallback mock detection');
});