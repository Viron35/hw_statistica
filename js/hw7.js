// --- Assignment 7: Attacker Random Walks ---

document.addEventListener('DOMContentLoaded', () => {

    // --- 1. Get HTML Elements ---
    const runBtn = document.getElementById('runSimulationBtn');
    const resetBtn = document.getElementById('resetSimulationBtn');
    
    // Nomi degli ID aggiornati
    const mInput = document.getElementById('simM_att'); 
    const nInput = document.getElementById('simN_weeks');
    
    const trajectoryCtx = document.getElementById('trajectoryChart')?.getContext('2d');
    const histogramCtx = document.getElementById('histogramChart')?.getContext('2d');
    
    // --- 2. Chart Instances ---
    let trajectoryChartInstance = null;
    let histogramChartInstance = null;
    
    // Limita il "spaghetti plot" a 10 linee
    const MAX_TRAJECTORIES_TO_PLOT = 30;
    // Probabilità di successo (+1) per l'attaccante
    const ATTACKER_P_SUCCESS = 0.5;

    // --- 3. Math Helper Functions (per Binomial PMF) ---

    // Cache per log-fattoriali
    let logFactorialCache = [NaN, 0]; // 0! = 1, log(1) = 0
    
    /**
     * Calcola log(n!) con caching.
     */
    function logFactorial(n) {
        if (n < 0) return NaN;
        if (n < logFactorialCache.length) {
            return logFactorialCache[n];
        }
        let sum = logFactorialCache[logFactorialCache.length - 1];
        for (let i = logFactorialCache.length; i <= n; i++) {
            sum += Math.log(i);
            logFactorialCache[i] = sum;
        }
        return sum;
    }

    /**
     * Calcola log(C(n, k))
     */
    function logCombinations(n, k) {
        if (k < 0 || k > n) return -Infinity; // Log(0)
        return logFactorial(n) - logFactorial(k) - logFactorial(n - k);
    }
    
    /**
     * Calcola il Binomial PMF P(k successi in n tentativi)
     */
    function binomialPMF(n, k, p) {
        const logProb = logCombinations(n, k) + k * Math.log(p) + (n - k) * Math.log(1 - p);
        return Math.exp(logProb);
    }

    // --- 4. Core Simulation Function ---

    /**
     * Esegue la simulazione
     * @param {number} m - Numero di attaccanti (traiettorie)
     * @param {number} n - Numero di settimane (passi)
     * @returns {object} - { trajectoriesToPlot, finalScores }
     */
    function runFullSimulation(m, n) {
        
        const p = ATTACKER_P_SUCCESS;

        let finalScores = [];       // Array di m punteggi finali
        let trajectoriesToPlot = [];
        
        // Loop M volte (un ciclo per ogni attaccante)
        for (let i_m = 0; i_m < m; i_m++) {
            let score = 0;
            let currentTrajectoryPath = [];
            
            // Loop N volte (un ciclo per ogni settimana)
            for (let i_n = 0; i_n < n; i_n++) {
                // Esegui un passo del Random Walk
                if (Math.random() < p) {
                    score += 1; // Successo (+1)
                } else {
                    score -= 1; // Fallimento (-1)
                }
                
                // Salva il percorso solo per le prime traiettorie (per Plot 1)
                if (i_m < MAX_TRAJECTORIES_TO_PLOT) {
                    currentTrajectoryPath.push(score);
                }
            }
            
            // Salva il punteggio finale di questo attaccante (per Plot 2)
            finalScores.push(score);
            
            // Salva il percorso di questo attaccante (per Plot 1)
            if (i_m < MAX_TRAJECTORIES_TO_PLOT) {
                trajectoriesToPlot.push(currentTrajectoryPath);
            }
        }
        
        return { trajectoriesToPlot, finalScores };
    }

    // --- 5. Plotting Functions ---

    /**
     * Disegna il grafico delle traiettorie
     */
    function drawTrajectoryPlot(trajectoriesData, n) {
        if (!trajectoryCtx) return;
        if (trajectoryChartInstance) {
            trajectoryChartInstance.destroy();
        }

        const labels = Array.from({length: n}, (_, i) => i + 1); // [1, 2, ..., n]
        const colors = [
            'rgba(0, 123, 255, 0.7)', 'rgba(255, 193, 7, 0.7)', 'rgba(40, 167, 69, 0.7)',
            'rgba(23, 162, 184, 0.7)', 'rgba(108, 117, 125, 0.7)', 'rgba(253, 126, 20, 0.7)',
            'rgba(111, 66, 193, 0.7)', 'rgba(232, 62, 140, 0.7)', 'rgba(32, 201, 151, 0.7)',
            'rgba(102, 16, 242, 0.7)'
        ];

        const datasets = trajectoriesData.map((trajectory, index) => ({
            label: `Attacker ${index + 1}`,
            data: trajectory,
            borderColor: colors[index % colors.length],
            backgroundColor: 'transparent',
            borderWidth: 1.5,
            pointRadius: 0
        }));

        trajectoryChartInstance = new Chart(trajectoryCtx, {
            type: 'line',
            data: { labels: labels, datasets: datasets },
            options: {
                scales: {
                    y: { title: { display: true, text: 'Attacker Score' } },
                    x: { title: { display: true, text: 'Week (n)' } }
                },
                animation: false,
                plugins: {
                    legend: { display: false },
                    tooltip: { enabled: true, mode: 'index', intersect: false }
                }
            }
        });
    }

    /**
     * Disegna l'istogramma dei punteggi finali
     */
    function drawHistogram(finalScores, n, m) {
        if (!histogramCtx) return;
        if (histogramChartInstance) {
            histogramChartInstance.destroy();
        }
        
        // --- Binning Logic ---
        // I punteggi possibili sono -n, -n+2, ..., n-2, n
        const minScore = -n;
        const numBins = n + 1; // Es. n=10, 11 bin possibili
        
        let bins = new Array(numBins).fill(0);
        let binLabels = new Array(numBins);
        let theoreticalData = new Array(numBins);

        // Popola i bin e calcola i dati teorici
        for (let i = 0; i < numBins; i++) {
            // i = S_n (numero di successi)
            const S_n = i; 
            
            // Score = 2*S_n - n
            const finalScore = 2 * S_n - n;
            binLabels[i] = finalScore.toString();
            
            // Calcola la probabilità Binomiale teorica P(S_n = i)
            const prob = binomialPMF(n, S_n, ATTACKER_P_SUCCESS);
            // Scala per M (il numero totale di attaccanti)
            theoreticalData[i] = prob * m; 
        }

        // Conta i risultati della simulazione
        for (const score of finalScores) {
            // Trova l'indice del bin per questo punteggio
            // Score = 2*S_n - n  =>  S_n = (Score + n) / 2
            const S_n_index = (score + n) / 2;
            
            // Incrementa il bin corretto
            if (S_n_index >= 0 && S_n_index < numBins && Number.isInteger(S_n_index)) {
                bins[S_n_index]++;
            }
        }
        
        // --- Crea il grafico ---
        histogramChartInstance = new Chart(histogramCtx, {
            type: 'bar', // Grafico a barre per l'istogramma
            data: {
                labels: binLabels,
                datasets: [
                    {
                        label: 'Simulated Count (m Attackers)',
                        data: bins,
                        backgroundColor: 'rgba(0, 123, 255, 0.6)',
                        borderColor: 'rgba(0, 123, 255, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'Theoretical Binomial (Scaled)',
                        data: theoreticalData,
                        type: 'line', // Sovrapponi come grafico a linee
                        borderColor: 'rgba(220, 53, 69, 1)',
                        backgroundColor: 'transparent',
                        borderWidth: 3,
                        pointRadius: 2
                    }
                ]
            },
            options: {
                scales: {
                    y: { 
                        beginAtZero: true, 
                        title: { display: true, text: 'Count (out of m)' } 
                    },
                    x: { 
                        title: { display: true, text: 'Final Attacker Score' } 
                    }
                }
            }
        });
    }
    
    /**
     * Resetta tutto
     */
    function resetSims() {
        if (trajectoryChartInstance) trajectoryChartInstance.destroy();
        if (histogramChartInstance) histogramChartInstance.destroy();
        trajectoryChartInstance = null;
        histogramChartInstance = null;
    }

    /**
     * Esegue la funzione principale
     */
    function runAndPlotSimulation() {
        const m = parseInt(mInput.value) || 1000;
        const n = parseInt(nInput.value) || 100;
        
        // Limite di sicurezza per il calcolo dei fattoriali
        if (n > 1000) { 
            alert("Please keep N (Weeks) <= 1000 for stable theoretical calculation.");
            return;
        }

        resetSims();
        runBtn.disabled = true;
        resetBtn.disabled = true;
        runBtn.textContent = "Running Simulation...";

        setTimeout(() => {
            const { trajectoriesToPlot, finalScores } = runFullSimulation(m, n);
            
            drawTrajectoryPlot(trajectoriesToPlot, n);
            drawHistogram(finalScores, n, m); // 'm' è il nostro M

            runBtn.disabled = false;
            resetBtn.disabled = false;
            runBtn.textContent = "Run Simulation";
        }, 10);
    }

    // --- 6. Event Listeners ---
    if (runBtn && resetBtn && trajectoryCtx && histogramCtx) {
        runBtn.addEventListener('click', runAndPlotSimulation);
        resetBtn.addEventListener('click', resetSims);
        
        // Esegui al caricamento
        runAndPlotSimulation(); 
        
    } else {
        console.error("Could not find all required elements for HW7 simulation.");
    }
});