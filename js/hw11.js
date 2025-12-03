// --- Assignment 11: SDE Simulation with Euler-Maruyama ---

document.addEventListener('DOMContentLoaded', () => {

    // --- 1. Get Elements ---
    const runBtn = document.getElementById('runSimulationBtn');
    const modelSelect = document.getElementById('sdeModel');
    const paramsContainer = document.getElementById('modelParams');
    
    // General Inputs
    const tInput = document.getElementById('simT');
    const nInput = document.getElementById('simN');
    const mInput = document.getElementById('simM');
    const x0Input = document.getElementById('simX0');
    
    // Charts
    const sdeCtx = document.getElementById('sdeChart')?.getContext('2d');
    const histogramCtx = document.getElementById('histogramChart')?.getContext('2d');
    
    let sdeChartInstance = null;
    let histogramChartInstance = null;

    // --- 2. Model Definitions ---
    // This object defines the math and UI for each supported SDE
    const Models = {
        'wiener': {
            name: "Wiener Process",
            // Parameters needed for UI
            params: [], 
            // Default X0
            defaultX0: 0,
            // Drift function: mu(x, t)
            drift: (x, t, p) => 0, 
            // Diffusion function: sigma(x, t)
            diffusion: (x, t, p) => 1 
        },
        'gbm': {
            name: "Geometric Brownian Motion",
            params: [
                { id: 'gbm_mu', label: 'Drift (μ)', value: 0.5 },
                { id: 'gbm_sigma', label: 'Volatility (σ)', value: 0.2 }
            ],
            defaultX0: 100, // Stock price usually starts positive
            drift: (x, t, p) => p.gbm_mu * x,
            diffusion: (x, t, p) => p.gbm_sigma * x
        },
        'ou': {
            name: "Ornstein-Uhlenbeck",
            params: [
                { id: 'ou_theta', label: 'Reversion Speed (θ)', value: 2.0 },
                { id: 'ou_mu', label: 'Long-term Mean (μ)', value: 0 }, // Mean to revert to
                { id: 'ou_sigma', label: 'Volatility (σ)', value: 0.5 }
            ],
            defaultX0: 2, // Start away from mean to see reversion
            drift: (x, t, p) => p.ou_theta * (p.ou_mu - x),
            diffusion: (x, t, p) => p.ou_sigma
        }
    };

    // --- 3. UI Handling ---

    function updateUIForModel() {
        const modelKey = modelSelect.value;
        const model = Models[modelKey];
        
        // Update X0 default
        x0Input.value = model.defaultX0;

        // Clear and rebuild parameters area
        paramsContainer.innerHTML = '';
        
        if (model.params.length === 0) {
            paramsContainer.innerHTML = '<p style="color:#666; font-style:italic;">No extra parameters for this model.</p>';
            return;
        }

        model.params.forEach(param => {
            const div = document.createElement('div');
            div.className = 'demo-group';
            div.style.flex = '1';
            div.innerHTML = `
                <label for="${param.id}">${param.label}:</label>
                <input type="number" id="${param.id}" value="${param.value}" step="0.01">
            `;
            paramsContainer.appendChild(div);
        });
    }

    // --- 4. Math Helpers ---

    function boxMullerRandom() {
        let u = 0, v = 0;
        while(u === 0) u = Math.random(); 
        while(v === 0) v = Math.random();
        return Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
    }

    // --- 5. Euler-Maruyama Algorithm ---

    function runEulerMaruyama(modelKey, T, N, M, X0, params) {
        const dt = T / N;
        const sqrtDt = Math.sqrt(dt);
        const model = Models[modelKey];

        const trajectories = [];
        const finalValues = [];

        for (let m = 0; m < M; m++) {
            let x = X0;
            const path = [{x: 0, y: x}];

            for (let i = 1; i <= N; i++) {
                const t = (i - 1) * dt; // Current time
                
                // 1. Calculate Drift and Diffusion at current state
                const a = model.drift(x, t, params);
                const b = model.diffusion(x, t, params);
                
                // 2. Generate Brownian Increment dW
                const dW = boxMullerRandom() * sqrtDt;

                // 3. Euler-Maruyama Step
                // X(t+dt) = X(t) + a*dt + b*dW
                x = x + (a * dt) + (b * dW);

                // Optimization: Don't store every single point for plotting if N is huge
                // Store roughly 500 points max per line to keep chart fast
                const stepSize = Math.ceil(N / 500); 
                if (i % stepSize === 0 || i === N) {
                    path.push({x: i * dt, y: x});
                }
            }
            
            trajectories.push(path);
            finalValues.push(x);
        }

        return { trajectories, finalValues };
    }

    // --- 6. Plotting ---

    function drawResults(trajectories, finalValues, T) {
        // --- Plot 1: Trajectories ---
        if (sdeChartInstance) sdeChartInstance.destroy();

        const datasets = trajectories.slice(0, 20).map((path, i) => ({ // Plot max 20 lines
            label: `Path ${i+1}`,
            data: path,
            borderColor: `rgba(0, 123, 255, 0.4)`,
            borderWidth: 1.5,
            fill: false,
            pointRadius: 0
        }));

        sdeChartInstance = new Chart(sdeCtx, {
            type: 'line',
            data: { datasets },
            options: {
                responsive: true,
                scales: {
                    x: { type: 'linear', position: 'bottom', title: {display:true, text:'Time (t)'}, max: T },
                    y: { title: {display:true, text:'X(t)'} }
                },
                plugins: { legend: { display: false } },
                animation: false
            }
        });

        // --- Plot 2: Histogram ---
        if (histogramChartInstance) histogramChartInstance.destroy();

        const numBins = 30;
        const min = Math.min(...finalValues);
        const max = Math.max(...finalValues);
        const binWidth = (max - min) / numBins;
        
        // If all values are the same (e.g. deterministic), handle gracefully
        if (binWidth === 0) return;

        const bins = new Array(numBins).fill(0);
        const labels = new Array(numBins);

        for (let i=0; i<numBins; i++) {
            const center = min + (i + 0.5) * binWidth;
            labels[i] = center.toFixed(2);
        }

        finalValues.forEach(val => {
            let idx = Math.floor((val - min) / binWidth);
            if (idx >= numBins) idx = numBins - 1;
            bins[idx]++;
        });

        histogramChartInstance = new Chart(histogramCtx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Final Value Distribution',
                    data: bins,
                    backgroundColor: 'rgba(40, 167, 69, 0.6)',
                }]
            },
            options: {
                responsive: true,
                scales: {
                    x: { title: {display:true, text:'Final Value X(T)'} },
                    y: { title: {display:true, text:'Count'} }
                }
            }
        });
    }

    // --- 7. Main Execution ---

    function runSimulation() {
        const modelKey = modelSelect.value;
        const T = parseFloat(tInput.value);
        const N = parseInt(nInput.value);
        const M = parseInt(mInput.value);
        const X0 = parseFloat(x0Input.value);

        // Collect specific params
        const params = {};
        Models[modelKey].params.forEach(p => {
            const val = parseFloat(document.getElementById(p.id).value);
            params[p.id] = val;
        });

        runBtn.disabled = true;
        runBtn.textContent = "Running...";

        setTimeout(() => {
            const { trajectories, finalValues } = runEulerMaruyama(modelKey, T, N, M, X0, params);
            drawResults(trajectories, finalValues, T);
            
            runBtn.disabled = false;
            runBtn.textContent = "Run Euler-Maruyama Simulation";
        }, 10);
    }

    // --- Listeners ---
    modelSelect.addEventListener('change', updateUIForModel);
    runBtn.addEventListener('click', runSimulation);
    
    // Init
    updateUIForModel();
    // Auto run slightly delayed to ensure chart.js is ready
    setTimeout(runSimulation, 500);

});