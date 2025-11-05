// --- Assignment 3: RSA and Frequency Analysis ---

document.addEventListener('DOMContentLoaded', () => {

    // --- 1. Get HTML Elements ---
    const textInput = document.getElementById('rsaText');
    const runButton = document.getElementById('runRsaBtn');
    const attackResultOutput = document.getElementById('rsaAttackResult');
    const originalCtx = document.getElementById('originalRsaChart')?.getContext('2d');
    const cipheredCtx = document.getElementById('cipheredRsaChart')?.getContext('2d');

    // Chart instances
    let originalChartInstance = null;
    let cipheredChartInstance = null;

    // --- 2. Define RSA Keys and Language Frequency ---

    // Public Key: (n=221, e=5)
    // Private Key: (n=221, d=77)
    // (Generated from p=13, q=17)
    const RSA_N = 221;
    const RSA_E = 5;
    // const RSA_D = 77; // We don't need 'd' for the attack

    // Standard Italian letter frequencies
    const italianFreq = {
        'e': 11.79, 'a': 11.74, 'i': 11.28, 'o': 9.83, 'n': 6.88, 'l': 6.51, 
        'r': 6.37, 't': 5.62, 's': 4.98, 'c': 4.50, 'd': 3.73, 'u': 3.01, 
        'p': 3.05, 'm': 2.51, 'v': 2.10, 'g': 1.64, 'h': 1.54, 'b': 0.92, 
        'f': 0.95, 'q': 0.51, 'z': 0.49,
        'j': 0.01, 'k': 0.01, 'w': 0.01, 'x': 0.01, 'y': 0.01
    };
    
    // Sort language letters by frequency (most to least)
    const sortedItalianLetters = Object.keys(italianFreq).sort((b, a) => {
        return italianFreq[a] - italianFreq[b];
    });


    // --- 3. Core Functions ---

    /**
     * Efficiently calculates (base^exponent) % modulus
     * Necessary because Math.pow() overflows with large numbers.
     * Uses modular exponentiation.
     */
    function modPow(base, exponent, modulus) {
        if (modulus === 1) return 0;
        let result = 1;
        base = base % modulus;
        while (exponent > 0) {
            if (exponent % 2 === 1) { // if exponent is odd
                result = (result * base) % modulus;
            }
            exponent = exponent >> 1; // exponent = Math.floor(exponent / 2)
            base = (base * base) % modulus;
        }
        return result;
    }

    /**
     * Encrypts a text string, letter by letter, using RSA.
     * @returns {number[]} An array of encrypted numbers.
     */
    function rsaEncrypt(text, e, n) {
        const cipherNumbers = [];
        for (let i = 0; i < text.length; i++) {
            const charCode = text.charCodeAt(i);
            
            // Only encrypt valid ASCII characters (which are < n)
            // We only care about letters for the attack
            if (charCode >= 97 && charCode <= 122) { // 'a' to 'z'
                const encryptedChar = modPow(charCode, e, n);
                cipherNumbers.push(encryptedChar);
            }
            // We ignore spaces, punctuation, etc. for this demo
        }
        return cipherNumbers;
    }

    /**
     * Calculates the frequency of letters in a text.
     * @returns {object} {a: 5, b: 2, ...}
     */
    function computeLetterDistribution(text) {
        const distribution = {};
        const normalized = text.toLowerCase();
        for (const char of normalized) {
            if (char >= 'a' && char <= 'z') {
                distribution[char] = (distribution[char] || 0) + 1;
            }
        }
        return distribution;
    }
    
    /**
     * Calculates the frequency of *numbers* in an array.
     * @returns {object} {150: 5, 88: 2, ...}
     */
    function computeNumberDistribution(numbers) {
        const distribution = {};
        for (const num of numbers) {
            distribution[num] = (distribution[num] || 0) + 1;
        }
        return distribution;
    }

    /**
     * The frequency attack decoder.
     * @param {number[]} cipherNumbers - The array of encrypted numbers.
     * @returns {string} The decoded (attacked) text.
     */
    function frequencyAttack(cipherNumbers) {
        // 1. Get frequency distribution of the *ciphered numbers*
        const cipherFreq = computeNumberDistribution(cipherNumbers);
        
        // 2. Sort the ciphered numbers by frequency (most to least)
        const sortedCipherNumbers = Object.keys(cipherFreq).sort((b, a) => {
            return cipherFreq[a] - cipherFreq[b];
        });

        // 3. Create the attack mapping
        // Assumes: most frequent number -> most frequent Italian letter
        //          second most frequent number -> second most frequent... etc.
        const attackMap = new Map();
        for(let i = 0; i < sortedCipherNumbers.length; i++) {
            const cipherNum = sortedCipherNumbers[i];
            const languageLetter = sortedItalianLetters[i] || '?'; // '?' if we run out
            attackMap.set(parseInt(cipherNum), languageLetter);
        }

        // 4. "Decrypt" the text using the flawed attack map
        let decodedText = "";
        for (const num of cipherNumbers) {
            decodedText += attackMap.get(num) || '?';
        }
        return decodedText;
    }

    /**
     * Draws a bar chart on a canvas.
     */
    function drawDistributionChart(ctx, data, label, existingChart, isNumeric = false) {
        if (existingChart) {
            existingChart.destroy();
        }

        let labels, dataPoints;
        
        if (isNumeric) {
            // For ciphered numbers
            labels = Object.keys(data).sort((a,b) => a - b);
            dataPoints = labels.map(key => data[key]);
        } else {
            // For letters 'a' to 'z'
            labels = [];
            dataPoints = [];
            for (let i = 0; i < 26; i++) {
                const char = String.fromCharCode(97 + i);
                labels.push(char);
                dataPoints.push(data[char] || 0);
            }
        }

        return new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: label,
                    data: dataPoints,
                    backgroundColor: isNumeric ? 'rgba(220, 53, 69, 0.6)' : 'rgba(0, 123, 255, 0.6)',
                }]
            },
            options: {
                scales: {
                    y: { beginAtZero: true, title: { display: true, text: 'Frequency Count' } },
                    x: { title: { display: true, text: isNumeric ? 'Ciphered Number' : 'Letter' } }
                },
                plugins: { legend: { display: false } }
            }
        });
    }

    // --- 4. Event Handler ---
    if (runButton) {
        runButton.addEventListener('click', () => {
            const originalText = textInput.value;
            
            if (!originalText || !originalCtx || !cipheredCtx) {
                alert("Error: could not find all required elements.");
                return;
            }

            // 1. Plot original text distribution
            const originalDist = computeLetterDistribution(originalText);
            originalChartInstance = drawDistributionChart(
                originalCtx, 
                originalDist, 
                'Original Count', 
                originalChartInstance,
                false
            );

            // 2. Encrypt the text
            const cipherNumbers = rsaEncrypt(originalText, RSA_E, RSA_N);
            
            // 3. Plot encrypted text distribution
            const cipheredDist = computeNumberDistribution(cipherNumbers);
            cipheredChartInstance = drawDistributionChart(
                cipheredCtx, 
                cipheredDist, 
                'Ciphered Count', 
                cipheredChartInstance,
                true // isNumeric = true
            );

            // 4. Run the attack
            const attackedText = frequencyAttack(cipherNumbers);
            attackResultOutput.textContent = attackedText;
        });
    }
});