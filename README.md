# 🌾 AgroSense Indore (Simple & Clean Version)

AI-Powered Crop Recommendation & Fertilizer Advisory System for Indore District (Malwa Plateau Zone X).

---

## 👥 Team Roles & Responsibilities

| Member | Role | Files Responsible For |
|---|---|---|
| **Luv** | Frontend & UI | `frontend/index.html`, `frontend/style.css`, `frontend/app.js` |
| **Kunal** | Backend & Server | `backend/server.js`, `backend/routes/api.js`, `backend/package.json` |
| **Naman** | Database & ML Bridge | `backend/database/`, `backend/ml_service/ml_bridge.js`, `predictor_service.py` |
| **Kuldeep** | ML Training & Data | `ml/build_dataset.py`, `ml/train_indore_model.py`, `data/raw/`, `models/` |
| **Arhaan** | Documentation & Architecture | System diagrams, agronomic standards, SRS documentation |

---

## 🚀 How to Run the Project (Step-by-Step)

### 1. Requirements
* **Node.js** (v16+)
* **Python** (v3.8+) with `pandas`, `scikit-learn`, `joblib`
* **MongoDB** (local or Atlas connection string in `.env`)

### 2. Start the Backend Server
```bash
cd backend
npm install
npm start
```
The server will start at: **`http://localhost:5001`**

### 3. Open in Browser
Open your browser and navigate to:
```
http://localhost:5001
```

---

## 📁 Project Structure

```
AgroSense_Indore_Simple/
├── backend/
│   ├── database/
│   │   ├── models/Recommendation.js   # MongoDB schema for farmer consultation history
│   │   └── mongodb_service.js         # Mongoose connection & query handlers
│   ├── ml_service/
│   │   ├── ml_bridge.js               # Node.js child_process bridge to Python
│   │   └── predictor_service.py       # Python script that loads model & computes fertilizer
│   ├── routes/
│   │   └── api.js                     # Express REST routes (/api/recommend, /api/history)
│   ├── .env                           # Server configuration (PORT, MONGODB_URI)
│   ├── package.json                   # Node.js project manifest & dependencies
│   └── server.js                      # Main Express server entry point & static file server
├── data/
│   └── raw/
│       └── indore_crop_dataset.csv    # 1,250 rows generated from NASA & ICAR soil data
├── frontend/
│   ├── index.html                     # Semantic HTML5 layout with sliders & bilingual labels
│   ├── style.css                      # Modern dark/light theme CSS design system
│   └── app.js                         # Slider handlers, tehsil presets, fetch API calls
├── ml/
│   ├── build_dataset.py               # Generates Indore-calibrated agro-climatic dataset
│   └── train_indore_model.py          # Trains 4 ML models; Random Forest won with 95.60%
├── models/
│   └── indore_crop_model.pkl          # Trained Random Forest model binary (2.1 MB)
└── README.md                          # Quick start instructions
```

---

## 🎯 Key Viva Concepts

* **Model Used**: Random Forest Classifier (200 trees, max depth 14) with **95.60% test accuracy**.
* **Database**: MongoDB (NoSQL) with graceful degradation (works even if database is temporarily offline).
* **Fertilizer Formula**: Tailored for Indore Vertisols (Medium to Deep Black Soils). DAP is applied first for Phosphorus ($P_2O_5 / 0.46$), Urea covers remaining Nitrogen ($N_{rem} / 0.46$), and MOP covers Potassium ($K_2O / 0.60$).
