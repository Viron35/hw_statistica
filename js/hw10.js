// --- Assignment 10: Poisson Process Simulation ---

document.addEventListener('DOMContentLoaded', () => {

    // --- 1. Get Elements ---
    const runBtn = document.getElementById('runSimulationBtn');
    const lambdaInput = document.getElementById('simLambda');
    const nInput = document.getElementById('simN');
    
    const ctx = document.getElementById('poissonChart')?.getContext('2d');
    
    let chartInstance = null;

    // --- 2. Core Simulation Logic ---

    /**
     * Simulates a single trajectory of a Poisson Process
     * using the Bernoulli approximation over n subintervals.
     */
    function simulatePoissonTrajectory(lambda, n, T) {
        const dt = T / n;       // Time step size
        const prob = lambda / n; // Probability of event in dt
        
        // Check for validity
        if (prob >= 1) {
            alert("Error: lambda must be significantly smaller than n. Increase n or decrease lambda.");
            return null;
        }

        // Data array for Chart.js: [{x: time, y: count}, ...]
        // Start at t=0, count=0
        const dataPoints = [{x: 0, y: 0}];
        
        let currentCount = 0;

        for (let i = 1; i <= n; i++) {
            // Bernoulli Trial
            if (Math.random() < prob) {
                currentCount++;
                // Calculate exact time of this step
                const currentTime = i * dt;
                
                // We record the point where the jump happens
                dataPoints.push({x: currentTime, y: currentCount});
            }
        }

        // Add the final point at time T to complete the graph
        dataPoints.push({x: T, y: currentCount});

        return dataPoints;
    }

    // --- 3. Plotting Function ---

    function drawChart(trajectories, lambda, T) {
        if (!ctx) return;
        if (chartInstance) chartInstance.destroy();

        const datasets = [];

        // 1. Add the Simulation Paths (Blue lines)
        // We draw 5 trajectories to show variance
        trajectories.forEach((trajData, index) => {
            datasets.push({
                label: `Trajectory ${index + 1}`,
                data: trajData,
                borderColor: `rgba(0, 123, 255, ${0.5 + (index * 0.1)})`, // Varying blue opacity
                borderWidth: 2,
                fill: false,
                pointRadius: 0, // Hide points for clean "step" look
                stepped: true   // IMPORTANT: This makes it a "Jump" chart (staircase)
            });
        });

        // 2. Add the Theoretical Expected Rate (Red dashed line)
        // E[N(t)] = lambda * t. It's a straight line from (0,0) to (T, lambda*T)
        datasets.push({
            label: `Expected Rate (λ=${lambda})`,
            data: [{x: 0, y: 0}, {x: T, y: lambda * T}],
            borderColor: 'rgba(220, 53, 69, 0.8)',
            borderWidth: 2,
            borderDash: [5, 5], // Dashed line
            pointRadius: 0,
            stepped: false // Straight line
        });

        chartInstance = new Chart(ctx, {
            type: 'line',
            data: { datasets: datasets },
            options: {
                responsive: true,
                scales: {
                    x: {
                        type: 'linear',
                        position: 'bottom',
                        title: { display: true, text: 'Time (t)' },
                        max: T
                    },
                    y: {
                        beginAtZero: true,
                        title: { display: true, text: 'Number of Arrivals N(t)' }
                    }
                },
                animation: {
                    duration: 0 // Instant rendering
                }
            }
        });
    }

    // --- 4. Main Execution ---

    function runSimulation() {
        const lambda = parseFloat(lambdaInput.value) || 50;
        const n = parseInt(nInput.value) || 2000;
        const T = 1; // Fixed time horizon as per assignment example

        // Safety check
        if (lambda >= n) {
            alert("Rate (λ) is too high for the number of subintervals (n). Please increase n.");
            return;
        }

        // Generate 3 sample trajectories
        const trajectories = [];
        for(let k=0; k<3; k++) {
            const traj = simulatePoissonTrajectory(lambda, n, T);
            if (traj) trajectories.push(traj);
        }

        if (trajectories.length > 0) {
            drawChart(trajectories, lambda, T);
        }
    }

    // --- 5. Listeners ---
    if (runBtn) {
        runBtn.addEventListener('click', runSimulation);
        // Run automatically on load
        runSimulation();
    }

});