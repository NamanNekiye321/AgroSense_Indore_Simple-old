// ============================================================
// FILE: api.js  (inside backend/routes/)
// WHO MADE THIS: Kunal
// WHAT IT DOES: This file handles what happens when the frontend
//               (Luv's HTML page) sends a request to our server.
//
//               Think of this as the "menu" of our restaurant:
//               POST /api/recommend  -> "Give me a crop recommendation"
//               GET  /api/history   -> "Show me past recommendations"
// ============================================================

const express  = require('express');
const router   = express.Router();
const db       = require('../database/mongodb_service');  // Naman's database functions
const mlBridge = require('../ml_service/ml_bridge');      // Naman's Python bridge

// ============================================================
// ROUTE 1: POST /api/recommend
// The farmer fills in soil values on the website and clicks "Recommend".
// This route receives those values, asks the AI, and sends back the answer.
// ============================================================
router.post('/recommend', async (req, res) => {

    // Step 1: Get the soil values the farmer entered
    const { N, P, K, ph, rainfall, temperature, humidity, tehsil, farmer_name, village } = req.body;

    // Step 2: Check if the required values are present
    if (N === undefined || P === undefined || K === undefined || ph === undefined) {
        return res.status(400).json({
            success: false,
            error: 'Please provide N, P, K, and pH values.'
        });
    }

    // Step 3: Convert all values to numbers (they come as text from HTML forms)
    const soilData = {
        N:           parseFloat(N),
        P:           parseFloat(P),
        K:           parseFloat(K),
        ph:          parseFloat(ph),
        rainfall:    parseFloat(rainfall)    || 850,
        temperature: parseFloat(temperature) || 28,
        humidity:    parseFloat(humidity)    || 70,
        tehsil:      tehsil || 'Indore'
    };

    try {
        // Step 4: Ask the Python AI model for a prediction
        const aiResult = await mlBridge.predictCrop(soilData);

        // Step 5: Save this consultation to MongoDB (so farmer can see history)
        const savedRecord = await db.saveRecommendation({
            farmer_name:    farmer_name || 'Farmer Guest',
            farmer_village: village     || '',
            tehsil:         soilData.tehsil,
            soil_inputs:    soilData,
            primary_crop:      aiResult.recommendations[0].crop,
            confidence:        aiResult.recommendations[0].confidence,
            alternative_crops: aiResult.recommendations.slice(1).map(r => r.crop),
            fertilizer_plan:   aiResult.fertilizer_plan
        });

        // Step 6: Send the full result back to the browser
        res.json({
            success: true,
            recommendations:  aiResult.recommendations,
            fertilizer_plan:  aiResult.fertilizer_plan,
            record_id:        savedRecord ? savedRecord._id : null
        });

    } catch (error) {
        console.error('Something went wrong during recommendation:', error.message);
        res.status(500).json({ success: false, error: 'Server error. Please try again.' });
    }
});


// ============================================================
// ROUTE 2: GET /api/history
// The farmer clicks "View History" and sees past recommendations.
// ============================================================
router.get('/history', async (req, res) => {
    try {
        // Get the last 20 records from MongoDB, newest first
        const records = await db.getHistory(20);
        res.json({ success: true, count: records.length, data: records });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Could not fetch history.' });
    }
});

module.exports = router;
