document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('tracing-canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    
    // UI Elements
    const btnSpeak = document.getElementById('btn-speak');
    const btnPrev = document.getElementById('btn-prev');
    const btnNext = document.getElementById('btn-next');
    const btnClear = document.getElementById('btn-clear');
    const successMessage = document.getElementById('success-message');
    
    const gameSection = document.getElementById('game-section');
    const pictureCards = [
        document.querySelector('.picture-card[data-index="0"]'),
        document.querySelector('.picture-card[data-index="1"]'),
        document.querySelector('.picture-card[data-index="2"]')
    ];
    
    // letters and emojiMap are now loaded from data.js
    
    let currentIndex = 0;
    let isDrawing = false;
    let lastX = 0;
    let lastY = 0;
    
    // Offscreen canvas for pixel comparison
    const offCanvas = document.createElement('canvas');
    const offCtx = offCanvas.getContext('2d', { willReadFrequently: true });
    
    let targetPixelCount = 0;
    
    // Initialize
    function resizeCanvas() {
        const container = canvas.parentElement;
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
        offCanvas.width = canvas.width;
        offCanvas.height = canvas.height;
        drawLetter();
    }
    
    window.addEventListener('resize', resizeCanvas);
    
    function drawLetter() {
        // Reset to default composite operation to allow clearing and base drawing
        ctx.globalCompositeOperation = 'source-over';
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        offCtx.clearRect(0, 0, offCanvas.width, offCanvas.height);
        
        const letter = letters[currentIndex];
        
        // Setup font
        const fontSize = Math.min(canvas.width, canvas.height) * 0.8;
        const fontStr = `bold ${fontSize}px 'Baloo 2', 'Fredoka One', sans-serif`;
        
        // Draw on main canvas (light grey)
        ctx.font = fontStr;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#e0e0e0';
        ctx.fillText(letter, canvas.width / 2, canvas.height / 2);
        
        // IMPORTANT: Change composite operation so that all future brush strokes 
        // will ONLY be drawn where the pixels of the letter already exist!
        ctx.globalCompositeOperation = 'source-atop';
        
        // Draw on offscreen canvas for pixel hit testing
        offCtx.font = fontStr;
        offCtx.textAlign = 'center';
        offCtx.textBaseline = 'middle';
        offCtx.fillStyle = '#000000'; // Black for easy pixel checking
        offCtx.fillText(letter, offCanvas.width / 2, offCanvas.height / 2);
        
        // Calculate target pixels
        const imageData = offCtx.getImageData(0, 0, offCanvas.width, offCanvas.height);
        targetPixelCount = 0;
        for (let i = 3; i < imageData.data.length; i += 4) {
            if (imageData.data[i] > 128) {
                targetPixelCount++;
            }
        }
        
        successMessage.classList.add('hidden');
        setupGame();
    }
    
    function setupGame() {
        // Clear previous animations
        pictureCards.forEach(card => {
            card.classList.remove('card-correct', 'card-wrong');
        });
        gameSection.classList.remove('hidden');

        const currentLetter = letters[currentIndex];
        const correctEmoji = emojiMap[currentLetter];
        
        // Pick 2 random wrong emojis
        let wrongEmojis = [];
        const allEmojis = Object.values(emojiMap);
        while (wrongEmojis.length < 2) {
            const randomEmoji = allEmojis[Math.floor(Math.random() * allEmojis.length)];
            if (randomEmoji !== correctEmoji && !wrongEmojis.includes(randomEmoji)) {
                wrongEmojis.push(randomEmoji);
            }
        }
        
        // Shuffle
        let options = [correctEmoji, ...wrongEmojis];
        options.sort(() => Math.random() - 0.5);
        
        // Assign to cards
        pictureCards.forEach((card, index) => {
            const data = options[index];
            card.innerHTML = `<div class="emoji-icon">${data.emoji}</div><div class="emoji-word">${data.word}</div>`;
            card.dataset.isCorrect = (data.emoji === correctEmoji.emoji);
        });
    }
    
    let availableVoices = [];
    
    function populateVoices() {
        availableVoices = window.speechSynthesis.getVoices();
    }
    
    // Load voices immediately if available, and listen for them to be loaded asynchronously
    populateVoices();
    if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = populateVoices;
    }

    function speakLetter() {
        // Use the pre-downloaded high-quality MP3 files for 100% reliable natural audio
        const audio = new Audio(`audio/${currentIndex}.mp3`);
        
        audio.play().catch(err => {
            console.warn("Local audio playback failed, falling back to browser TTS:", err);
            
            // Absolute last resort fallback
            const letter = letters[currentIndex];
            const textToSpeak = letter + ".";
            const utterance = new SpeechSynthesisUtterance(textToSpeak);
            
            const voice = availableVoices.find(v => v.lang.includes('mr') || v.lang.includes('hi'));
            if (voice) {
                utterance.voice = voice;
            } else {
                utterance.lang = 'hi-IN';
            }
            
            utterance.rate = 0.9; 
            utterance.pitch = 1.0; 
            
            window.speechSynthesis.cancel();
            setTimeout(() => {
                window.speechSynthesis.speak(utterance);
            }, 50);
        });
    }
    
    function checkSuccess() {
        if (targetPixelCount === 0) return;
        
        const mainImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const offImageData = offCtx.getImageData(0, 0, offCanvas.width, offCanvas.height);
        
        let coveredPixels = 0;
        
        for (let i = 0; i < mainImageData.data.length; i += 4) {
            // Check if offscreen has the letter here
            if (offImageData.data[i+3] > 128) {
                const r = mainImageData.data[i];
                const g = mainImageData.data[i+1];
                const b = mainImageData.data[i+2];
                const a = mainImageData.data[i+3];
                
                // #ff9f43 -> R:255, G:159, B:67
                if (a > 0 && (Math.abs(r - 255) < 30 && Math.abs(g - 159) < 30)) {
                    coveredPixels++;
                }
            }
        }
        
        const coverage = coveredPixels / targetPixelCount;
        
        if (coverage > 0.6) {
            successMessage.classList.remove('hidden');
            speakLetter();
            // Wait a bit then hide the message, but do NOT automatically go to the next letter.
            // The user must manually click 'Next' to proceed.
            setTimeout(() => {
                successMessage.classList.add('hidden');
            }, 2000);
        }
    }
    
    // Pointer Events
    function startDrawing(e) {
        isDrawing = true;
        const rect = canvas.getBoundingClientRect();
        lastX = e.clientX - rect.left;
        lastY = e.clientY - rect.top;
        
        // Stop default behavior to prevent scrolling
        e.preventDefault();
        
        // Draw initial dot
        ctx.beginPath();
        ctx.arc(lastX, lastY, 20, 0, Math.PI * 2);
        ctx.fillStyle = '#ff9f43';
        ctx.fill();
    }
    
    function draw(e) {
        if (!isDrawing) return;
        
        const rect = canvas.getBoundingClientRect();
        const currentX = e.clientX - rect.left;
        const currentY = e.clientY - rect.top;
        
        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(currentX, currentY);
        ctx.strokeStyle = '#ff9f43';
        ctx.lineWidth = 40; // Thick line for kids
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
        
        lastX = currentX;
        lastY = currentY;
        
        e.preventDefault();
    }
    
    function stopDrawing(e) {
        if (!isDrawing) return;
        isDrawing = false;
        checkSuccess();
    }
    
    canvas.addEventListener('pointerdown', startDrawing);
    canvas.addEventListener('pointermove', draw);
    canvas.addEventListener('pointerup', stopDrawing);
    canvas.addEventListener('pointercancel', stopDrawing);
    canvas.addEventListener('pointerout', stopDrawing);
    
    // Picture Cards Events
    pictureCards.forEach(card => {
        card.addEventListener('click', () => {
            if (card.dataset.isCorrect === "true") {
                card.classList.add('card-correct');
                speakLetter(); // Say the letter on correct guess
                successMessage.classList.remove('hidden');
                setTimeout(() => {
                    successMessage.classList.add('hidden');
                }, 1500);
            } else {
                card.classList.remove('card-wrong');
                // trigger reflow to restart animation
                void card.offsetWidth;
                card.classList.add('card-wrong');
            }
        });
    });
    
    // Event Listeners for UI
    btnSpeak.addEventListener('click', speakLetter);
    
    btnPrev.addEventListener('click', () => {
        if (currentIndex > 0) {
            currentIndex--;
            drawLetter();
        }
    });
    
    btnNext.addEventListener('click', () => {
        if (currentIndex < letters.length - 1) {
            currentIndex++;
            drawLetter();
        }
    });
    
    btnClear.addEventListener('click', () => {
        drawLetter();
    });
    
    // Initialize first render (wait for font load if possible)
    document.fonts.ready.then(() => {
        resizeCanvas();
        // Delay speaking A slightly so the user is ready
        setTimeout(speakLetter, 500);
    });
});
