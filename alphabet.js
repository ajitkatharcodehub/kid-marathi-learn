document.addEventListener('DOMContentLoaded', () => {
    const vowelsGrid = document.getElementById('vowels-grid');
    const consonantsGrid = document.getElementById('consonants-grid');

    // The 'letters' array is globally available from data.js
    // Vowels: 0 to 11 (12 total)
    // Consonants: 12 to 45 (34 total)

    letters.forEach((letter, index) => {
        const card = document.createElement('div');
        card.classList.add('alphabet-card');
        card.textContent = letter;
        
        card.addEventListener('click', () => {
            // Add temporary pop animation class
            card.classList.remove('popBounce');
            void card.offsetWidth; // Trigger reflow to restart animation
            card.classList.add('popBounce');
            
            // Play the corresponding pre-downloaded high quality audio file
            const audio = new Audio(`audio/${index}.mp3`);
            audio.play().catch(err => console.error("Audio failed to play:", err));
        });

        // Append to the correct grid section
        if (index < 12) {
            vowelsGrid.appendChild(card);
        } else {
            consonantsGrid.appendChild(card);
        }
    });
});
