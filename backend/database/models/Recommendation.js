// ============================================================
// FILE: Recommendation.js
// WHO MADE THIS: Naman
// WHAT IT DOES: This is the "shape" of data we save in MongoDB.
//               Every time a farmer gets a crop recommendation,
//               we save all their info here permanently.
// ============================================================

const mongoose = require('mongoose');

// --- WHAT SOIL INPUTS LOOK LIKE ---
// When a farmer enters soil test values, we save them here
const SoilInputSchema = new mongoose.Schema({
    N:           { type: Number, required: true },   // Nitrogen level in soil
    P:           { type: Number, required: true },   // Phosphorus level in soil
    K:           { type: Number, required: true },   // Potassium level in soil
    ph:          { type: Number, required: true },   // Soil pH (e.g. 7.5)
    temperature: { type: Number, default: 28  },     // Temperature in Celsius
    humidity:    { type: Number, default: 70  },     // Humidity in %
    rainfall:    { type: Number, default: 850 }      // Rainfall in mm
}, { _id: false });  // _id: false means no separate ID for this sub-section


// --- WHAT FERTILIZER PLAN LOOKS LIKE ---
// After we recommend a crop, we also tell the farmer how much fertilizer to use
const FertilizerPlanSchema = new mongoose.Schema({
    urea_kg:     { type: Number, default: 15  },  // How many kg of Urea per acre
    dap_kg:      { type: Number, default: 10  },  // How many kg of DAP per acre
    mop_kg:      { type: Number, default: 10  },  // How many kg of MOP per acre
    organic_ton: { type: Number, default: 2.0 },  // Organic compost in tons
    remarks:     { type: String, default: ''  }   // Any extra notes
}, { _id: false });


// --- THE MAIN RECOMMENDATION DOCUMENT ---
// This is the full record saved for each farmer consultation
const RecommendationSchema = new mongoose.Schema({
    farmer_name:    { type: String, default: 'Farmer Guest' },  // Farmer's name
    farmer_village: { type: String, default: '' },              // Farmer's village
    tehsil:         { type: String, default: 'Indore'  },       // Which tehsil
    land_area:      { type: Number, default: null  },           // Land size in acres
    contact_no:     { type: String, default: '' },              // Phone number

    // The soil test readings the farmer entered
    soil_inputs: { type: SoilInputSchema, required: true },

    // What crop the AI recommended and how confident it was
    primary_crop:      { type: String,   required: true },
    confidence:        { type: Number,   required: true },  // % confidence (0-100)
    alternative_crops: [String],                            // 2nd and 3rd best crops

    // The fertilizer plan for the recommended crop
    fertilizer_plan: { type: FertilizerPlanSchema, required: true },

    // When was this consultation saved?
    created_at: { type: Date, default: Date.now }
});

// Export this so other files can use it
module.exports = mongoose.model('Recommendation', RecommendationSchema);
