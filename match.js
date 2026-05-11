document.addEventListener('DOMContentLoaded', () => {
    const lettersColumn = document.getElementById('letters-column');
    const picturesColumn = document.getElementById('pictures-column');
    const canvas = document.getElementById('match-canvas');
    const ctx = canvas.getContext('2d');
    const container = document.querySelector('.match-game-container');
    const successMessage = document.getElementById('success-message');
    const feedbackMessage = document.getElementById('feedback-message');
    let feedbackTimeout;

    let currentPairs = [];
    let lines = [];
    let activeLine = null;
    let draggingNode = null;

    function resizeCanvas() {
        const rect = container.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
        drawAll();
    }

    window.addEventListener('resize', resizeCanvas);

    function generateGame() {
        lettersColumn.innerHTML = '';
        picturesColumn.innerHTML = '';
        lines = [];
        
        // Pick 3 random unique letters
        let shuffledLetters = [...letters].sort(() => 0.5 - Math.random());
        let selectedLetters = shuffledLetters.slice(0, 3);
        
        currentPairs = selectedLetters.map(l => ({
            letter: l,
            data: emojiMap[l],
            isMatched: false
        }));

        // Shuffle pictures independently
        let rightSide = [...currentPairs].sort(() => 0.5 - Math.random());

        // Render left side (Letters)
        currentPairs.forEach((pair, index) => {
            const el = document.createElement('div');
            el.className = 'match-item letter-item';
            el.textContent = pair.letter;
            el.dataset.letter = pair.letter;
            el.dataset.side = 'left';
            
            // Connection node
            const node = document.createElement('div');
            node.className = 'connect-node node-right';
            el.appendChild(node);
            
            lettersColumn.appendChild(el);
        });

        // Render right side (Pictures)
        rightSide.forEach((pair, index) => {
            const el = document.createElement('div');
            el.className = 'match-item picture-item';
            el.dataset.letter = pair.letter;
            el.dataset.side = 'right';
            
            el.innerHTML = `<div class="emoji-icon">${pair.data.emoji}</div><div class="emoji-word" style="font-size: 0.8rem">${pair.data.word}</div>`;
            
            // Connection node
            const node = document.createElement('div');
            node.className = 'connect-node node-left';
            el.appendChild(node);
            
            picturesColumn.appendChild(el);
        });
        
        setTimeout(resizeCanvas, 100);
    }

    // Drawing loop
    function drawAll() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw permanent lines
        lines.forEach(line => {
            drawLine(line.x1, line.y1, line.x2, line.y2, line.color);
        });
        
        // Draw active drag line
        if (activeLine) {
            drawLine(activeLine.x1, activeLine.y1, activeLine.x2, activeLine.y2, '#bdc3c7'); // Grey while dragging
        }
    }

    function drawLine(x1, y1, x2, y2, color) {
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = color;
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.stroke();
    }

    function getRelativeCoords(clientX, clientY) {
        const rect = canvas.getBoundingClientRect();
        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    }
    
    function getNodeCenter(node) {
        const nodeRect = node.getBoundingClientRect();
        const canvasRect = canvas.getBoundingClientRect();
        return {
            x: nodeRect.left + nodeRect.width / 2 - canvasRect.left,
            y: nodeRect.top + nodeRect.height / 2 - canvasRect.top
        };
    }

    function handlePointerDown(e) {
        // Find if clicked on a connect node or item
        let target = e.target.closest('.match-item');
        if (!target) return;
        
        // Check if already matched
        if (target.classList.contains('matched')) return;

        draggingNode = target;
        const center = getNodeCenter(target.querySelector('.connect-node'));
        const pointer = getRelativeCoords(e.clientX, e.clientY);
        
        activeLine = {
            x1: center.x,
            y1: center.y,
            x2: pointer.x,
            y2: pointer.y
        };
        
        container.setPointerCapture(e.pointerId);
        drawAll();
        e.preventDefault();
    }

    function handlePointerMove(e) {
        if (!draggingNode || !activeLine) return;
        
        const pointer = getRelativeCoords(e.clientX, e.clientY);
        activeLine.x2 = pointer.x;
        activeLine.y2 = pointer.y;
        
        drawAll();
        e.preventDefault();
    }

    function speakWord(index) {
        if (index !== -1) {
            const audio = new Audio(`audio/word_${index}.mp3`);
            audio.play().catch(err => {
                console.warn("Local audio failed, falling back to TTS:", err);
                // Fallback to TTS if audio file is missing
                const word = emojiMap[letters[index]].word;
                const utterance = new SpeechSynthesisUtterance(word);
                utterance.lang = 'mr-IN';
                window.speechSynthesis.speak(utterance);
            });
        }
    }

    function showFeedback(text, type) {
        clearTimeout(feedbackTimeout);
        feedbackMessage.textContent = text;
        feedbackMessage.className = type; // e.g. 'correct' or 'wrong'
        
        feedbackTimeout = setTimeout(() => {
            feedbackMessage.classList.add('hidden');
        }, 1500);
    }

    function handlePointerUp(e) {
        if (!draggingNode) return;
        container.releasePointerCapture(e.pointerId);
        
        // Find element under pointer
        // Temporarily hide canvas so elementFromPoint sees the elements underneath
        canvas.style.pointerEvents = 'none'; 
        const dropTarget = document.elementFromPoint(e.clientX, e.clientY)?.closest('.match-item');
        
        if (dropTarget && dropTarget !== draggingNode && dropTarget.dataset.side !== draggingNode.dataset.side) {
            // Check match
            const isMatch = dropTarget.dataset.letter === draggingNode.dataset.letter;
            
            const startCenter = getNodeCenter(draggingNode.querySelector('.connect-node'));
            const endCenter = getNodeCenter(dropTarget.querySelector('.connect-node'));
            
            const newLine = {
                x1: startCenter.x,
                y1: startCenter.y,
                x2: endCenter.x,
                y2: endCenter.y,
                color: isMatch ? '#2ecc71' : '#e74c3c'
            };
            
            lines.push(newLine);
            
            // Universal Audio Feedback: Letter from left side then Word from right side
            const leftItem = draggingNode.dataset.side === 'left' ? draggingNode : dropTarget;
            const rightItem = draggingNode.dataset.side === 'right' ? draggingNode : dropTarget;
            
            const letterIndex = letters.indexOf(leftItem.dataset.letter);
            const wordIndex = letters.indexOf(rightItem.dataset.letter);

            if (letterIndex !== -1 && wordIndex !== -1) {
                const audio = new Audio(`audio/${letterIndex}.mp3`);
                audio.play().then(() => {
                    // Wait a bit before saying the word
                    setTimeout(() => speakWord(wordIndex), 800);
                }).catch(e => {
                    console.log(e);
                    speakWord(wordIndex);
                });
            }

            if (isMatch) {
                draggingNode.classList.add('matched');
                dropTarget.classList.add('matched');
                showFeedback('Correct! 🎉', 'correct');
                checkWinCondition();
            } else {
                showFeedback('Try again ❌', 'wrong');
                // Wrong match: remove line after 2 seconds
                setTimeout(() => {
                    const idx = lines.indexOf(newLine);
                    if (idx > -1) {
                        lines.splice(idx, 1);
                        drawAll();
                    }
                }, 2000);
            }
        } else if (dropTarget === draggingNode) {
            // It was just a click/tap on the item
            const letter = draggingNode.dataset.letter;
            
            if (draggingNode.classList.contains('picture-item')) {
                // Play word sound for pictures
                const letterIndex = letters.indexOf(letter);
                speakWord(letterIndex);
            } else {
                // Play letter sound for letters
                const letterIndex = letters.indexOf(letter);
                if(letterIndex !== -1) {
                    const audio = new Audio(`audio/${letterIndex}.mp3`);
                    audio.play().catch(e => console.log(e));
                }
            }
            
            // Add a temporary pop animation to give visual feedback
            draggingNode.classList.remove('popBounce');
            void draggingNode.offsetWidth; // trigger reflow
            draggingNode.classList.add('popBounce');
        }
        
        activeLine = null;
        draggingNode = null;
        drawAll();
        e.preventDefault();
    }
    
    function checkWinCondition() {
        const matchedItems = document.querySelectorAll('.match-item.matched');
        if (matchedItems.length === 6) { // 3 pairs * 2
            successMessage.classList.remove('hidden');
            setTimeout(() => {
                successMessage.classList.add('hidden');
                generateGame();
            }, 3000); // Wait 3 seconds before next set
        }
    }

    container.addEventListener('pointerdown', handlePointerDown);
    container.addEventListener('pointermove', handlePointerMove);
    container.addEventListener('pointerup', handlePointerUp);
    container.addEventListener('pointercancel', handlePointerUp);

    // Initial render
    document.fonts.ready.then(() => {
        generateGame();
    });
});
