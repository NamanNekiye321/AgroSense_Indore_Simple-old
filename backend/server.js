// ============================================================
// FILE: server.js
// WHO MADE THIS: Kunal
// WHAT IT DOES: This is the MAIN entry point of the backend.
//               When you run "node server.js" or "npm start",
//               this file starts the whole server.
//
//               It does 3 things:
//               1. Loads settings from .env file
//               2. Connects to MongoDB
//               3. Starts listening for requests from the browser
// ============================================================

const express = require('express');
const cors    = require('cors');
const path    = require('path');
const dotenv  = require('dotenv');

// Load environment variables from .env file (like MongoDB password, port number)
dotenv.config();

// Import our API routes (Kunal's file)
const apiRoutes = require('./routes/api');

// Import database connection (Naman's file)
const db = require('./database/mongodb_service');

// Create the Express app (this is our server)
const app  = express();
const PORT = process.env.PORT || 5001;

// --- MIDDLEWARE ---
// These run on every request before it reaches our routes:
app.use(cors());                          // Allow requests from the browser
app.use(express.json());                  // Understand JSON data in request body
app.use(express.urlencoded({ extended: true })); // Understand HTML form data

// --- ROUTES ---
// All API calls go through /api/ (e.g., /api/recommend, /api/history)
app.use('/api', apiRoutes);

// Health check - just to confirm the server is alive
app.get('/health', (req, res) => {
    res.json({ status: 'running', project: 'AgroSense Indore' });
});

// Serve the frontend HTML/CSS/JS files to the browser
const frontendPath = path.join(__dirname, '..', 'frontend');
app.use(express.static(frontendPath));

// For any other URL, send the main HTML page
app.get('*', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
});

// --- START THE SERVER ---
async function startServer() {
    try {
        // Try to connect to MongoDB first
        await db.connectDB();

        // Start listening for requests
        app.listen(PORT, () => {
            console.log('====================================');
            console.log('  AgroSense Indore Server Running!');
            console.log(`  Open: http://localhost:${PORT}`);
            console.log('====================================');
        });
    } catch (error) {
        console.error('Server failed to start:', error.message);
    }
}

startServer();
