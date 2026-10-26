// ============================================================
// FILE: mongodb_service.js
// WHO MADE THIS: Naman
// WHAT IT DOES: Handles connecting to MongoDB database.
//               If MongoDB is not available, it tells us clearly.
//               Other files import this to save/load data.
// ============================================================

const mongoose = require('mongoose');

// Import our data shapes
const Recommendation = require('./models/Recommendation');

// This is the MongoDB connection string from our .env file
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/agrosense_indore';

// --- CONNECT TO MONGODB ---
async function connectDB() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB successfully!');
    } catch (error) {
        // If MongoDB is not running, just warn - don't crash the app
        console.warn('⚠️  Could not connect to MongoDB. Running without database.');
        console.warn('   Start MongoDB or set MONGODB_URI in your .env file.');
    }
}

// --- SAVE A NEW RECOMMENDATION ---
// Call this after the AI makes a prediction for a farmer
async function saveRecommendation(data) {
    try {
        const newRecord = new Recommendation(data);
        const saved = await newRecord.save();
        console.log('💾 Saved recommendation to MongoDB. ID:', saved._id);
        return saved;
    } catch (error) {
        console.error('Could not save to MongoDB:', error.message);
        return null;  // Return null if saving fails - app still works
    }
}



// --- GET RECENT RECOMMENDATIONS ---
// Returns the last 20 consultations (newest first)
async function getHistory(limit = 20) {
    try {
        const records = await Recommendation
            .find()
            .sort({ created_at: -1 })  // newest first
            .limit(limit);
        return records;
    } catch (error) {
        console.error('Could not read from MongoDB:', error.message);
        return [];  // Return empty list if reading fails
    }
}

// Export these functions so other files can use them
module.exports = { connectDB, saveRecommendation, getHistory };
