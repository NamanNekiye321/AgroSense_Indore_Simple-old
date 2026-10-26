"""
FILE: predictor_service.py
WHO MADE THIS: Naman (integration) + Kuldeep (the actual AI model)
WHAT IT DOES: This Python script loads our trained AI model and
              uses it to predict which crop is best for a farmer.
              Node.js (ml_bridge.js) runs this script and sends soil data.
              We print the answer back as JSON so Node.js can read it.

HOW TO RUN: You don't run this manually.
            Node.js runs it automatically when a farmer submits their data.
"""

import sys
import json
import os
import joblib  # Used to load our saved AI model

# --- STEP 1: READ THE SOIL DATA SENT BY NODE.JS ---
# Node.js passes soil data as a command-line argument (a JSON string)
try:
    input_data = json.loads(sys.argv[1])
except Exception:
    print(json.dumps({"error": "Could not read input data"}))
    sys.exit(1)

# --- STEP 2: LOAD THE TRAINED AI MODEL ---
# The model was trained by Kuldeep and saved as a .pkl file
MODEL_PATH = os.path.join(os.path.dirname(__file__), '..', '..', 'models', 'indore_crop_model.pkl')

try:
    model_package = joblib.load(MODEL_PATH)
    model   = model_package['model']
    classes = model_package['classes']  # The 6 crop names
except Exception as e:
    print(json.dumps({"error": f"Could not load AI model: {str(e)}"}))
    sys.exit(1)

import warnings
warnings.filterwarnings('ignore')
import pandas as pd

# The AI needs exactly 7 numbers in this exact order:
# [N, P, K, temperature, humidity, pH, rainfall]
try:
    feature_cols = model_package.get('features', ['N', 'P', 'K', 'temperature', 'humidity', 'ph', 'rainfall'])
    feature_dict = {
        'N':           [float(input_data.get('N',           50))],
        'P':           [float(input_data.get('P',           30))],
        'K':           [float(input_data.get('K',          200))],
        'temperature': [float(input_data.get('temperature', 28))],
        'humidity':    [float(input_data.get('humidity',    70))],
        'ph':          [float(input_data.get('ph',         7.5))],
        'rainfall':    [float(input_data.get('rainfall',   850))]
    }
    df_features = pd.DataFrame(feature_dict)[feature_cols]
except Exception as e:
    print(json.dumps({"error": f"Bad input values: {str(e)}"}))
    sys.exit(1)

# --- STEP 4: ASK THE AI TO PREDICT ---
# model.predict_proba gives us % confidence for all 6 crops
probabilities = model.predict_proba(df_features)[0]

# Sort crops by confidence (highest first) and build our answer
ranked_crops = sorted(
    zip(classes, probabilities),
    key=lambda x: x[1],
    reverse=True
)
top_3 = ranked_crops[:3]  # Take only the top 3 suggestions

recommendations = [
    { "crop": crop, "confidence": round(prob * 100, 1) }
    for crop, prob in top_3
]

# --- STEP 5: CALCULATE FERTILIZER DOSES ---
# Based on the top recommended crop, how much fertilizer does the farmer need?
# These targets come from ICAR-IISR research for Indore district crops
CROP_TARGETS = {
    'Soybean':          {'N':  25, 'P': 60, 'K':  40},
    'Wheat':            {'N': 100, 'P': 50, 'K':  40},
    'Gram (Chickpea)':  {'N':  20, 'P': 50, 'K':  30},
    'Maize (Corn)':     {'N':  85, 'P': 55, 'K':  40},
    'Onion':            {'N':  90, 'P': 50, 'K':  80},
    'Potato':           {'N': 110, 'P': 70, 'K':  90},
}

top_crop = recommendations[0]['crop']
targets  = CROP_TARGETS.get(top_crop, {'N': 50, 'P': 50, 'K': 40})

# How much N, P, K does the soil still need?
soil_N = float(input_data.get('N', 50))
soil_P = float(input_data.get('P', 30))
soil_K = float(input_data.get('K', 200))

need_N = max(0, targets['N'] - soil_N)
need_P = max(0, targets['P'] - soil_P)
need_K = max(0, targets['K'] - soil_K)

# Convert nutrient needs into actual fertilizer bags:
# DAP (18% N, 46% P)   -> use it for phosphorus first
# Urea (46% N)         -> use it for remaining nitrogen
# MOP (60% K)          -> use it for potassium
dap_kg  = round(need_P / 0.46, 1)              # DAP covers phosphorus
n_from_dap = dap_kg * 0.18                      # DAP also gives some nitrogen
urea_kg = round(max(0, need_N - n_from_dap) / 0.46, 1)  # Urea covers the rest of N
mop_kg  = round(need_K / 0.60, 1)              # MOP covers potassium

fertilizer_plan = {
    "urea_kg":    urea_kg,
    "dap_kg":     dap_kg,
    "mop_kg":     mop_kg,
    "organic_ton": 2.0,
    "remarks": f"Apply DAP + MOP at sowing. Apply Urea in 2 splits: 50% at sowing, 50% at 25-30 days."
}

# --- STEP 6: SEND THE ANSWER BACK TO NODE.JS ---
# We just print it as JSON - Node.js (ml_bridge.js) will read this
answer = {
    "recommendations":  recommendations,
    "fertilizer_plan":  fertilizer_plan
}
print(json.dumps(answer))
