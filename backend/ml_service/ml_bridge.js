// ============================================================
// FILE: ml_bridge.js
// WHO MADE THIS: Naman
// WHAT IT DOES: This is the "telephone" between our Node.js server
//               and the Python AI model.
//               Node.js speaks JavaScript, Python speaks Python.
//               This file launches Python, sends it the soil data,
//               waits for the AI answer, and brings it back.
// ============================================================

const { spawn } = require('child_process');  // This lets us run Python from Node.js
const path = require('path');

// Where is the Python prediction script located?
const PYTHON_SCRIPT = path.join(__dirname, 'predictor_service.py');

// --- MAIN FUNCTION: Ask the AI model to predict a crop ---
function predictCrop(soilData) {
    return new Promise((resolve, reject) => {

        // Step 1: Convert the soil data to a text string (JSON format)
        const inputAsText = JSON.stringify(soilData);

        // Step 2: Launch Python and run our predictor_service.py script
        //         We send the soil data as a command-line argument
        const pythonProcess = spawn('python3', [PYTHON_SCRIPT, inputAsText]);

        let result = '';    // Will collect what Python prints
        let errorMsg = '';  // Will collect any Python errors

        // Step 3: Listen to what Python prints (its answer)
        pythonProcess.stdout.on('data', (chunk) => {
            result += chunk.toString();
        });

        // Step 4: Listen to any error messages from Python
        pythonProcess.stderr.on('data', (chunk) => {
            errorMsg += chunk.toString();
        });

        // Step 5: Safety timer - if Python takes more than 5 seconds, give up
        //         and return a safe default answer so the app doesn't freeze
        const safetyTimer = setTimeout(() => {
            pythonProcess.kill();
            console.warn('⚠️  Python took too long (5s). Using fallback answer.');
            resolve(getFallbackAnswer(soilData));
        }, 5000);

        // Step 6: When Python finishes, parse its answer
        pythonProcess.on('close', (exitCode) => {
            clearTimeout(safetyTimer);  // Cancel the safety timer

            if (exitCode === 0 && result.trim()) {
                // Python succeeded! Parse the JSON answer it gave us
                try {
                    const parsed = JSON.parse(result);
                    resolve(parsed);
                } catch (e) {
                    console.error('Python gave invalid output. Using fallback.');
                    resolve(getFallbackAnswer(soilData));
                }
            } else {
                // Python failed. Use fallback.
                if (errorMsg) console.warn('Python error:', errorMsg.trim());
                resolve(getFallbackAnswer(soilData));
            }
        });

        // Handle case where Python can't even start (not installed etc)
        pythonProcess.on('error', () => {
            clearTimeout(safetyTimer);
            console.warn('Could not start Python. Using fallback answer.');
            resolve(getFallbackAnswer(soilData));
        });
    });
}

// --- FALLBACK ANSWER ---
// If Python fails for any reason, return this safe default answer
// Based on ICAR-IISR agronomic rules for Indore Kharif season
function getFallbackAnswer(soilData) {
    return {
        recommendations: [
            { crop: 'Soybean', confidence: 88.0 },
            { crop: 'Maize (Corn)', confidence: 7.5 },
            { crop: 'Gram (Chickpea)', confidence: 4.5 }
        ],
        fertilizer_plan: {
            urea_kg: 15,
            dap_kg: 10,
            mop_kg: 5,
            organic_ton: 2,
            remarks: 'Fallback recommendation based on ICAR-IISR norms for Indore Vertisols.'
        },
        note: 'AI model unavailable. Showing agronomic rule-based recommendation.'
    };
}

// Export so api.js can use it
module.exports = { predictCrop };

















































































