// --- Assignment 4: Law of Large Numbers (LLN) & Central Limit Theorem (CLT) ---

document.addEventListener('DOMContentLoaded', () => {

    // --- 1. Get HTML Elements ---
    const runBtn = document.getElementById('runSimulationBtn');
    const resetBtn = document.getElementById('resetSimulationBtn');
    const mInput = document.getElementById('simM');
    const nInput = document.getElementById('simN');
    const pInput = document.getElementById('simP');
    
    const convergenceCtx = document.getElementById('convergenceChart')?.getContext('2d');
    const histogramCtx = document.getElementById('histogramChart')?.getContext('2d');
    
    // --- 2. Chart Instances ---
    let convergenceChartInstance = null;
    let histogramChartInstance = null;

    // --- 3. Core Simulation Function ---
    
    const NUM_TRAJECTORIES_TO_PLOT = 30; // Mostra 10 traiettorie

    /**
     * Runs the full simulation
     * @param {number} M - Number of trajectories
     * @param {number} N - Number of trials per trajectory
     * @param {number} p - Success probability
     * @returns {object} - { trajectoriesToPlot, finalFrequencies }
     */
    function runFullSimulation(M, N, p) {
        let finalFrequencies = []; 
        let trajectoriesToPlot = []; 
        
        for (let m = 0; m < M; m++) {
            let successCount = 0;
            let currentTrajectoryPath = [];
            
            for (let n = 1; n <= N; n++) {
                if (Math.random() < p) {
                    successCount++;
                }
                
                if (m < NUM_TRAJECTORIES_TO_PLOT) {
                    const currentFrequency = successCount / n;
                    currentTrajectoryPath.push(currentFrequency);
                }
            }
            
            const finalFrequency = successCount / N;
            finalFrequencies.push(finalFrequency);
            
            if (m < NUM_TRAJECTORIES_TO_PLOT) {
                trajectoriesToPlot.push(currentTrajectoryPath);
            }
        }
        
        return { trajectoriesToPlot, finalFrequencies };
    }

    // --- 4. Plotting Functions ---

    /**
     * Plots the convergence path of the first trajectories.
     * @param {number[][]} trajectoriesData - Array di array di frequenze
     * @param {number} N - Total trials
     * @param {number} p - Theoretical probability
     */
    function drawConvergencePlot(trajectoriesData, N, p) {
        if (!convergenceCtx) return;
        if (convergenceChartInstance) {
            convergenceChartInstance.destroy();
        }

        const labels = Array.from({length: N}, (_, i) => i + 1);

        // Colori per le prime 10 traiettorie
        const colors = [
            'rgba(0, 123, 255, 0.7)',  // Blu
            'rgba(255, 193, 7, 0.7)', // Giallo
            'rgba(40, 167, 69, 0.7)',  // Verde
            'rgba(23, 162, 184, 0.7)', // Ciano
            'rgba(108, 117, 125, 0.7)',// Grigio
            'rgba(253, 126, 20, 0.7)', // Arancione
            'rgba(111, 66, 193, 0.7)', // Viola
            'rgba(232, 62, 140, 0.7)', // Rosa
            'rgba(32, 201, 151, 0.7)', // Verde acqua
            'rgba(102, 16, 242, 0.7)'  // Indaco
        ];

        const datasets = trajectoriesData.map((trajectory, index) => ({
            label: `Trajectory ${index + 1}`,
            data: trajectory,
            borderColor: colors[index % colors.length],
            backgroundColor: 'transparent',
            borderWidth: 1.5,
            pointRadius: 0
        }));

        datasets.push({
            label: `Theoretical Probability (p=${p.toFixed(2)})`,
            data: Array(N).fill(p),
            borderColor: 'rgba(220, 53, 69, 1)',
            backgroundColor: 'transparent',
            borderWidth: 3,
            pointRadius: 0
        });

        convergenceChartInstance = new Chart(convergenceCtx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: datasets
            },
            options: {
                scales: {
                    y: { 
                        beginAtZero: false, 
                        min: 0.0,
                        max: 1.0, 
                        title: { display: true, text: 'Frequency' } 
                    },
                    x: { 
                        title: { display: true, text: 'Number of Trials (n)' } 
                    }
                },
                animation: false,
                plugins: {
                    tooltip: { 
                        enabled: false,
                        mode: 'index',
                        intersect: false
                    },
                    legend: {
                        display: false // Leggenda nascosta come da tua richiesta
                    }
                }
            }
        });
    }

    /**
     * Plots the histogram of final frequencies (f_N) for all M trajectories.
     */
    function drawHistogram(finalFrequencies, p) {
        if (!histogramCtx) return;
        if (histogramChartInstance) {
            histogramChartInstance.destroy();
        }
        
        const numBins = Math.max(10, Math.ceil(Math.sqrt(finalFrequencies.length)));
        let min = Math.min(...finalFrequencies);
        let max = Math.max(...finalFrequencies);
        
        if (min === max) {
            min = min - 0.01;
            max = max + 0.01;
        }

        const binWidth = (max - min) / numBins;
        let bins = new Array(numBins).fill(0);
        let binLabels = [];

        for (let i = 0; i < numBins; i++) {
            const binStart = min + (i * binWidth);
            const binEnd = binStart + binWidth;
            binLabels.push(`${binStart.toFixed(3)}`);
            
            for (const freq of finalFrequencies) {
                if ((freq >= binStart && freq < binEnd) || (i === numBins - 1 && freq === max)) {
                    bins[i]++;
                }
            }
        }
        
        histogramChartInstance = new Chart(histogramCtx, {
            type: 'bar',
            data: {
                labels: binLabels,
                datasets: [{
                    label: 'Frequency Count',
                    data: bins,
                    backgroundColor: 'rgba(0, 123, 255, 0.6)',
                    borderColor: 'rgba(0, 123, 255, 1)',
                    borderWidth: 1,
                    barPercentage: 1.0,
                    categoryPercentage: 1.0
                }]
            },
            options: {
                scales: {
                    y: { 
                        beginAtZero: true, 
                        title: { display: true, text: 'Count (out of M)' } 
                    },
                    x: { 
                        title: { display: true, text: 'Final Frequency (f_N)' } 
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            title: (tooltipItems) => `Bin ~ ${tooltipItems[0].label}`,
                            label: (tooltipItem) => `Count: ${tooltipItem.raw}`
                        }
                    }
                }
            }
        });
    }
    
    /**
     * Resets all simulations and charts
     */
    function resetSims() {
        if (convergenceChartInstance) {
            convergenceChartInstance.destroy();
            convergenceChartInstance = null;
        }
        if (histogramChartInstance) {
            histogramChartInstance.destroy();
            histogramChartInstance = null;
        }
    }

    // --- NUOVA FUNZIONE PER ESEGUIRE LA SIMULAZIONE ---
    /**
     * Estrae i valori, esegue la simulazione e disegna i grafici.
     */
    function runAndPlotSimulation() {
        // 1. Get inputs
        // Usa i valori predefiniti nell'HTML (es. 100, 500, 0.5)
        const M = parseInt(mInput.value) || 100; 
        const N = parseInt(nInput.value) || 500;
        const p = parseFloat(pInput.value) || 0.5;
        
        if (p < 0 || p > 1) {
            alert("Probability 'p' must be between 0.0 and 1.0");
            return;
        }

        // 2. Pulisci i grafici precedenti
        resetSims();

        // 3. Disabilita i bottoni durante il calcolo
        runBtn.disabled = true;
        resetBtn.disabled = true;
        runBtn.textContent = "Running Simulation...";

        // 4. Esegui la simulazione
        // Usiamo un setTimeout per far aggiornare il testo del bottone prima che il browser si blocchi
        setTimeout(() => {
            const { trajectoriesToPlot, finalFrequencies } = runFullSimulation(M, N, p);
        
            // 5. Disegna i risultati
            drawConvergencePlot(trajectoriesToPlot, N, p);
            drawHistogram(finalFrequencies, p);

            // 6. Riabilita i bottoni
            runBtn.disabled = false;
            resetBtn.disabled = false;
            runBtn.textContent = "Run Simulation";
        }, 10); // 10ms di ritardo
    }

    // --- 5. Event Listeners ---
    if (runBtn && resetBtn && convergenceCtx && histogramCtx) {
        
        // 1. Collega il bottone "Run" alla nostra nuova funzione
        runBtn.addEventListener('click', runAndPlotSimulation);

        // 2. Collega il bottone "Reset"
        resetBtn.addEventListener('click', resetSims);
        
        // --- ESEGUI AL CARICAMENTO ---
        // 3. Esegui la simulazione una volta, automaticamente
        runAndPlotSimulation(); 
        
    } else {
        console.error("Could not find all required elements for HW4 simulation.");
    }
});