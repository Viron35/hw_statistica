// --- Assignment 11: Wiener Process (Euler-Maruyama) ---

document.addEventListener('DOMContentLoaded', () => {

    // --- 1. Get Elements ---
    const runBtn = document.getElementById('runSimulationBtn');
    
    // Inputs
    const muInput = document.getElementById('simMu');
    const sigmaInput = document.getElementById('simSigma');
    const x0Input = document.getElementById('simX0');
    const tInput = document.getElementById('simT');
    const nInput = document.getElementById('simN');
    const mInput = document.getElementById('simM');
    const linesInput = document.getElementById('simLines');

    // Displays
    const linesCountDisplay = document.getElementById('linesCountDisplay');
    const totalMDisplay = document.getElementById('totalMDisplay');
    
    // Charts
    const sdeCtx = document.getElementById('sdeChart')?.getContext('2d');
    const histogramCtx = document.getElementById('histogramChart')?.getContext('2d');
    
    let sdeChartInstance = null;
    let histogramChartInstance = null;

    // --- 2. Math Helpers ---

    // Box-Muller for Normal Distribution Z ~ N(0,1)
    function boxMullerRandom() {
        let u = 0, v = 0;
        while(u === 0) u = Math.random(); 
        while(v === 0) v = Math.random();
        return Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
    }

    // --- 3. Euler-Maruyama Simulation ---

    function runEulerMaruyama(mu, sigma, X0, T, N, M, linesToPlot) {
        const dt = T / N;
        const sqrtDt = Math.sqrt(dt);

        const trajectories = []; // Stores full paths only for linesToPlot
        const finalValues = [];  // Stores final X(T) for ALL M trajectories

        for (let m = 0; m < M; m++) {
            let x = X0;
            
            // We only need to store the path array if this trajectory will be plotted
            const shouldStorePath = (m < linesToPlot);
            let path = null;
            
            if (shouldStorePath) {
                path = [{x: 0, y: x}];
            }

            for (let i = 1; i <= N; i++) {
                // Generate Brownian Increment dW = sqrt(dt) * Z
                const dW = boxMullerRandom() * sqrtDt;

                // Euler-Maruyama Step:
                // X(t+dt) = X(t) + mu*dt + sigma*dW
                x = x + (mu * dt) + (sigma * dW);

                // Optimization: Don't store every single point if N is massive
                // e.g. if N=10000, store every 10th point
                if (shouldStorePath) {
                    const stepSize = Math.max(1, Math.ceil(N / 1000)); 
                    if (i % stepSize === 0 || i === N) {
                        path.push({x: i * dt, y: x});
                    }
                }
            }
            
            finalValues.push(x);
            
            if (shouldStorePath) {
                trajectories.push(path);
            }
        }

        return { trajectories, finalValues };
    }

    // --- 4. Plotting ---

    function drawResults(trajectories, finalValues, T, mu, X0) {
        // --- Plot 1: Trajectories ---
        if (sdeChartInstance) sdeChartInstance.destroy();

        // Color Palette
        const colors = [
            '#007bff', '#e83e8c', '#28a745', '#fd7e14', '#6f42c1', 
            '#17a2b8', '#ffc107', '#20c997', '#dc3545', '#6610f2'
        ];

        const datasets = trajectories.map((path, i) => ({
            label: `Path ${i+1}`,
            data: path,
            borderColor: colors[i % colors.length], // Cycle colors
            borderWidth: 2,
            fill: false,
            pointRadius: 0
        }));

        // Add Expected Trend Line: E[X(t)] = X0 + mu*t
        datasets.push({
            label: `Expected (Drift)`,
            data: [{x: 0, y: X0}, {x: T, y: X0 + mu * T}],
            borderColor: 'rgba(50, 50, 50, 0.8)',
            borderWidth: 3,
            borderDash: [5, 5],
            pointRadius: 0
        });

        sdeChartInstance = new Chart(sdeCtx, {
            type: 'line',
            data: { datasets },
            options: {
                responsive: true,
                maintainAspectRatio: false, // Critical for fixed height div
                scales: {
                    x: { type: 'linear', position: 'bottom', title: {display:true, text:'Time (t)'}, max: T },
                    y: { title: {display:true, text:'Value X(t)'} }
                },
                plugins: { legend: { display: true } },
                animation: false
            }
        });

        // --- Plot 2: Histogram ---
        if (histogramChartInstance) histogramChartInstance.destroy();

        const numBins = 30;
        const min = Math.min(...finalValues);
        const max = Math.max(...finalValues);
        const binWidth = (max - min) / numBins;
        
        let labels = [], data = [];
        
        if (binWidth > 0) {
            const bins = new Array(numBins).fill(0);
            for (let i=0; i<numBins; i++) {
                labels[i] = (min + (i + 0.5) * binWidth).toFixed(2);
            }
            finalValues.forEach(val => {
                let idx = Math.floor((val - min) / binWidth);
                if (idx >= numBins) idx = numBins - 1;
                bins[idx]++;
            });
            data = bins;
        } else {
            labels = [min.toFixed(2)];
            data = [finalValues.length];
        }

        histogramChartInstance = new Chart(histogramCtx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Final Value Distribution',
                    data: data,
                    backgroundColor: 'rgba(40, 167, 69, 0.6)',
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false, // Critical for fixed height div
                scales: {
                    x: { title: {display:true, text:'Final Value X(T)'} },
                    y: { title: {display:true, text:'Frequency'} }
                }
            }
        });
    }

    // --- 5. Main Execution ---

    function runSimulation() {
        const mu = parseFloat(muInput.value) || 0;
        const sigma = parseFloat(sigmaInput.value) || 1;
        const X0 = parseFloat(x0Input.value) || 0;
        const T = parseFloat(tInput.value) || 1;
        const N = parseInt(nInput.value) || 1000;
        const M = parseInt(mInput.value) || 2000;
        let linesToPlot = parseInt(linesInput.value) || 5;

        // Validation
        if (linesToPlot > M) linesToPlot = M;

        // Update Text Displays
        linesCountDisplay.textContent = linesToPlot;
        totalMDisplay.textContent = M;

        runBtn.disabled = true;
        runBtn.textContent = "Running...";

        // Timeout to allow UI to update before heavy calc
        setTimeout(() => {
            const { trajectories, finalValues } = runEulerMaruyama(mu, sigma, X0, T, N, M, linesToPlot);
            drawResults(trajectories, finalValues, T, mu, X0);
            
            runBtn.disabled = false;
            runBtn.textContent = "Run Simulation";
        }, 10);
    }

    // --- Listeners ---
    if(runBtn) {
        runBtn.addEventListener('click', runSimulation);
        setTimeout(runSimulation, 500); // Auto-run
    }

});