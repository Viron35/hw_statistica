// --- Assignment 6: Online Mean and Variance ---

document.addEventListener('DOMContentLoaded', () => {

    // --- 1. Get HTML Elements ---
    const inputEl = document.getElementById('newValue');
    const addBtn = document.getElementById('addValueBtn');
    const resetBtn = document.getElementById('resetBtn');
    
    // Nuovi elementi
    const randomCountInput = document.getElementById('randomCount');
    const addRandomBtn = document.getElementById('addRandomBtn');

    // Elementi di output
    const countSpan = document.getElementById('statCount');
    const meanSpan = document.getElementById('statMean');
    const m2Span = document.getElementById('statM2');
    const varSpan = document.getElementById('statVar');
    const sampleVarSpan = document.getElementById('statSampleVar');

    // --- 2. State Variables ---
    let count = 0;
    let mean = 0;   // mu_n
    let M2 = 0;     // M_n

    /**
     * Aggiorna il display con lo stato corrente.
     */
    function updateDisplay() {
        countSpan.textContent = count;

        if (count === 0) {
            meanSpan.textContent = "N/A";
            m2Span.textContent = "N/A";
            varSpan.textContent = "N/A";
            sampleVarSpan.textContent = "N/A";
        } else {
            const popVariance = M2 / count;
            const sampleVariance = count > 1 ? M2 / (count - 1) : 0;

            meanSpan.textContent = mean.toFixed(4);
            m2Span.textContent = M2.toFixed(4);
            varSpan.textContent = popVariance.toFixed(4);
            sampleVarSpan.textContent = (count > 1) ? sampleVariance.toFixed(4) : "N/A";
        }
    }

    /**
     * Il "cuore" dell'algoritmo di Welford.
     * Aggiorna le variabili di stato con un nuovo valore.
     * @param {number} newValue - Il valore da aggiungere.
     */
    function updateStatistics(newValue) {
        count++;
        
        // Calcola delta (x_n - mu_{n-1})
        const delta = newValue - mean; 
        
        // 1. Aggiorna Media (mu_n = mu_{n-1} + delta / n)
        mean = mean + delta / count; 
        
        // 2. Aggiorna M2 (M_n = M_{n-1} + (x_n - mu_{n-1}) * (x_n - mu_n))
        const delta2 = newValue - mean; // (x_n - mu_n)
        M2 = M2 + delta * delta2;
    }

    /**
     * Gestisce l'aggiunta di un singolo valore manuale.
     */
    function addSingleValue() {
        const newValue = parseFloat(inputEl.value);

        if (isNaN(newValue)) {
            alert("Please enter a valid number.");
            inputEl.value = "";
            inputEl.focus();
            return;
        }

        // Chiama la funzione "cuore"
        updateStatistics(newValue);

        // Aggiorna il display e pulisci l'input
        updateDisplay();
        inputEl.value = "";
        inputEl.focus();
    }

    /**
     * NUOVA FUNZIONE: Aggiunge N valori casuali.
     */
    function addRandomValues() {
        const numToAdd = parseInt(randomCountInput.value) || 100;

        for (let i = 0; i < numToAdd; i++) {
            // Genera un numero casuale tra 0 e 100
            const randomVal = Math.random() * 100;
            
            // Chiama la funzione "cuore" (senza aggiornare il display ogni volta!)
            updateStatistics(randomVal);
        }

        // Aggiorna il display solo UNA VOLTA, alla fine del ciclo.
        updateDisplay();
        inputEl.focus();
    }

    /**
     * Resetta lo stato.
     */
    function resetState() {
        count = 0;
        mean = 0;
        M2 = 0;
        updateDisplay();
        inputEl.focus();
    }

    // --- 3. Attach Event Listeners ---
    addBtn.addEventListener('click', addSingleValue);
    addRandomBtn.addEventListener('click', addRandomValues); // Nuovo listener
    resetBtn.addEventListener('click', resetState);
    
    // Permetti 'Enter' sull'input manuale
    inputEl.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            addSingleValue();
        }
    });

    // Inizializza il display al caricamento
    updateDisplay();
});