// --- Assignment 4: Caesar Cipher and Frequency Analysis ---

document.addEventListener('DOMContentLoaded', () => {

    // Trova gli elementi HTML di cui abbiamo bisogno
    const textInput = document.getElementById('cipherText');
    const shiftInput = document.getElementById('cipherShift');
    const runButton = document.getElementById('runCipherBtn');
    
    // MODIFICATO: Ottieni i "contesti" dei canvas, non gli elementi <pre>
    const originalCtx = document.getElementById('originalDistChart')?.getContext('2d');
    const cipheredCtx = document.getElementById('cipheredDistChart')?.getContext('2d');
    
    const foundKeyOutput = document.getElementById('foundKeyOutput');

    // Variabili per tenere traccia delle istanze dei grafici (per distruggerle prima di ridisegnarle)
    let originalChartInstance = null;
    let cipheredChartInstance = null;

    // Frequenze standard delle lettere inglesi (per la Funzione 3)
    // Standard Italian letter frequencies (in percentages)
    // Source: Wikipedia
    const italianFreq = {
        'a': 11.74, 'e': 11.79, 'i': 11.28, 'o': 9.83, 'n': 6.88, 'l': 6.51, 
        'r': 6.37, 't': 5.62, 's': 4.98, 'c': 4.50, 'd': 3.73, 'u': 3.01, 
        'p': 3.05, 'm': 2.51, 'v': 2.10, 'g': 1.64, 'h': 1.54, 'b': 0.92, 
        'f': 0.95, 'q': 0.51, 'z': 0.49,
        // Lettere straniere (j, k, w, x, y) con frequenza quasi zero
        'j': 0.01, 'k': 0.01, 'w': 0.01, 'x': 0.01, 'y': 0.01 
    };

    /**
     * Funzione 1: Calcola la distribuzione delle lettere (conteggi grezzi)
     * MODIFICATA: Ora restituisce i conteggi grezzi, non le percentuali,
     * che è più facile da plottare.
     */
    function computeDistribution(text) {
        const distribution = {};
        const normalized = text.toLowerCase();

        for (const char of normalized) {
            // Controlla se è una lettera da 'a' a 'z'
            if (char >= 'a' && char <= 'z') {
                distribution[char] = (distribution[char] || 0) + 1;
            }
        }
        return distribution; // Es: {a: 5, b: 2, ...}
    }

    /**
     * Funzione 2: Applica il Cifrario di Cesare (NESSUNA MODIFICA)
     */
    function caesarCipher(text, shift) {
        let cipherText = "";
        const actualShift = ((shift % 26) + 26) % 26;

        for (let i = 0; i < text.length; i++) {
            let charCode = text.charCodeAt(i);
            if (charCode >= 65 && charCode <= 90) { // Maiuscole
                cipherText += String.fromCharCode(((charCode - 65 + actualShift) % 26) + 65);
            } else if (charCode >= 97 && charCode <= 122) { // Minuscole
                cipherText += String.fromCharCode(((charCode - 97 + actualShift) % 26) + 97);
            } else {
                cipherText += text[i];
            }
        }
        return cipherText;
    }

    /**
     * Funzione 3: Trova la chiave di shift (NESSUNA MODIFICA)
     * (Questa funzione calcola i propri conteggi interni, quindi non è
     * influenzata dalla modifica alla Funzione 1)
     */
    function findShiftKey(cipherText) {
        let bestShift = 0;
        let minChiSquared = Infinity;
        const cipherCounts = {};
        let totalLetters = 0;
        const normalizedCipher = cipherText.toLowerCase();
        
        for (const char of normalizedCipher) {
            if (char >= 'a' && char <= 'z') {
                cipherCounts[char] = (cipherCounts[char] || 0) + 1;
                totalLetters++;
            }
        }
        
        if (totalLetters === 0) return 0;

        for (let shift = 0; shift < 26; shift++) {
            let currentChiSquared = 0;
            for (let i = 0; i < 26; i++) {
                const cipherChar = String.fromCharCode(97 + i);
                const originalChar = String.fromCharCode(((i - shift + 26) % 26) + 97);
                const observedCount = cipherCounts[cipherChar] || 0;
                const expectedCount = (italianFreq[originalChar] / 100) * totalLetters;
                currentChiSquared += ((observedCount - expectedCount) ** 2) / expectedCount;
            }

            if (currentChiSquared < minChiSquared) {
                minChiSquared = currentChiSquared;
                bestShift = shift;
            }
        }
        return bestShift;
    }

    /**
     * NUOVA Funzione: Disegna il grafico a barre
     * @param {CanvasRenderingContext2D} ctx - Il contesto del canvas su cui disegnare
     * @param {object} distribution - L'oggetto dati (es. {a: 5, b: 2})
     * @param {string} label - L'etichetta per il set di dati
     * @param {Chart} existingChart - L'istanza del grafico precedente da distruggere
     * @param {string} color - Colore per le barre
     * @returns {Chart} La nuova istanza del grafico
     */
    function drawDistributionChart(ctx, distribution, label, existingChart, color) {
        // Se un grafico esiste già su questo canvas, distruggilo
        if (existingChart) {
            existingChart.destroy();
        }

        // Prepara i dati per Chart.js (etichette a-z e dati corrispondenti)
        const labels = [];
        const data = [];
        for (let i = 0; i < 26; i++) {
            const char = String.fromCharCode(97 + i);
            labels.push(char); // ['a', 'b', 'c', ...]
            data.push(distribution[char] || 0); // [5, 2, 0, ...] Aggiunge 0 se la lettera non è presente
        }

        // Crea il nuovo grafico
        return new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: label,
                    data: data,
                    backgroundColor: color,
                    borderWidth: 1
                }]
            },
            options: {
                scales: {
                    y: { beginAtZero: true, title: { display: true, text: 'Count' } },
                    x: { title: { display: true, text: 'Letter' } }
                },
                plugins: { legend: { display: false } }
            }
        });
    }


    // --- Gestore dell'Evento Principale (MODIFICATO) ---
    
    // Controlla che il bottone esista (è buona norma se hai più pagine
    // che usano lo stesso file .js)
    if (runButton) {
        runButton.addEventListener('click', () => {
            const originalText = textInput.value;
            const shift = parseInt(shiftInput.value) || 0;

            if (originalText.length === 0) {
                alert("Please enter some text to analyze.");
                return;
            }
            
            // Assicurati che i canvas esistano prima di disegnare
            if (!originalCtx || !cipheredCtx) {
                console.error("Canvas elements not found!");
                return;
            }

            // 1. Ottieni la distribuzione originale e DISEGNALA
            const originalDist = computeDistribution(originalText);
            originalChartInstance = drawDistributionChart(
                originalCtx, 
                originalDist, 
                'Original Count', 
                originalChartInstance, 
                'rgba(0, 123, 255, 0.6)' // Colore blu
            );

            // 2. Cifra il testo
            const cipheredText = caesarCipher(originalText, shift);

            // 3. Ottieni la distribuzione cifrata e DISEGNALA
            const cipheredDist = computeDistribution(cipheredText);
            cipheredChartInstance = drawDistributionChart(
                cipheredCtx, 
                cipheredDist, 
                'Ciphered Count', 
                cipheredChartInstance, 
                'rgba(220, 53, 69, 0.6)' // Colore rosso
            );
            
            // 4. Trova la chiave
            const foundKey = findShiftKey(cipheredText);
            foundKeyOutput.innerHTML = `<strong>Found Shift Key:</strong> ${foundKey}`;
        });
    }

}); // Fine di DOMContentLoaded