"""
FILE: train_indore_model.py
WHO MADE THIS: Kuldeep
WHAT IT DOES: Takes the CSV dataset and trains the AI model.
              Tests 5 different AI algorithms, picks the best one,
              and saves it so predictor_service.py can use it.

Think of it like:
  - The CSV file is the textbook
  - This script is the student studying the textbook
  - The .pkl file is the student after studying (the trained brain!)

HOW TO RUN: python3 train_indore_model.py
"""

import os
import joblib
import pandas as pd
from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold
from sklearn.ensemble import RandomForestClassifier, ExtraTreesClassifier, GradientBoostingClassifier
from sklearn.tree import DecisionTreeClassifier
from sklearn.metrics import accuracy_score, classification_report

# ============================================================
# STEP 1: LOAD THE DATASET
# ============================================================
DATA_PATH  = 'data/raw/indore_crop_dataset.csv'
MODEL_PATH = 'models/indore_crop_model.pkl'

# If dataset doesn't exist, generate it first
if not os.path.exists(DATA_PATH):
    print("Dataset not found. Generating it first...")
    from build_dataset import build_dataset
    build_dataset()

df = pd.read_csv(DATA_PATH)
print(f"Loaded {len(df)} rows from dataset")
print(f"Crops in dataset: {list(df['crop'].unique())}\n")

# ============================================================
# STEP 2: SPLIT DATA INTO FEATURES (inputs) AND LABELS (answers)
# ============================================================
# Features = the 7 soil/climate measurements the AI will learn from
FEATURES = ['N', 'P', 'K', 'temperature', 'humidity', 'ph', 'rainfall']

X = df[FEATURES]   # Inputs (what we measure)
y = df['crop']     # Output (which crop is best)

# Split 80% for training the AI, 20% for testing it
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.20, random_state=42, stratify=y
)
print(f"Training samples: {len(X_train)}, Testing samples: {len(X_test)}\n")

# ============================================================
# STEP 3: TRY DIFFERENT AI ALGORITHMS AND COMPARE THEM
# ============================================================
# 5-Fold Cross Validation: Split training data into 5 parts,
# train on 4, test on 1, repeat 5 times, take the average score.
# This gives a more reliable accuracy than a single test.

models_to_try = {
    'Random Forest':    RandomForestClassifier(n_estimators=200, max_depth=14, random_state=42, n_jobs=-1),
    'Extra Trees':      ExtraTreesClassifier(n_estimators=200, max_depth=14, random_state=42, n_jobs=-1),
    'Gradient Boost':   GradientBoostingClassifier(n_estimators=120, learning_rate=0.1, random_state=42),
    'Decision Tree':    DecisionTreeClassifier(max_depth=10, random_state=42),
}

print("=== COMPARING AI ALGORITHMS ===")
print(f"{'Algorithm':<20} | {'5-Fold CV Accuracy':<20} | {'Test Accuracy'}")
print("-" * 65)

best_name  = None
best_score = 0
results    = {}

for name, model in models_to_try.items():
    # 5-Fold cross validation
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    cv_scores = cross_val_score(model, X_train, y_train, cv=cv, scoring='accuracy')

    # Train and test
    model.fit(X_train, y_train)
    test_acc = accuracy_score(y_test, model.predict(X_test))

    results[name] = {'model': model, 'cv_mean': cv_scores.mean(), 'test_acc': test_acc}

    print(f"{name:<20} | {cv_scores.mean()*100:>6.2f}% ± {cv_scores.std()*100:.2f}%      | {test_acc*100:.2f}%")

    if test_acc > best_score:
        best_score = test_acc
        best_name  = name

# ============================================================
# STEP 4: PICK THE WINNER AND PRINT DETAILS
# ============================================================
print(f"\n=== WINNER: {best_name} with {best_score*100:.2f}% accuracy! ===\n")

best_model = results[best_name]['model']
y_pred = best_model.predict(X_test)
print("Detailed Report:")
print(classification_report(y_test, y_pred))

# ============================================================
# STEP 5: SAVE THE TRAINED MODEL TO A FILE
# ============================================================
os.makedirs('models', exist_ok=True)

# Save the model with some extra info about it
model_package = {
    'model':      best_model,
    'features':   FEATURES,
    'classes':    list(best_model.classes_),
    'model_name': best_name,
    'accuracy':   best_score,
    'district':   'Indore',
    'zone':       'Malwa Plateau Zone X'
}

joblib.dump(model_package, MODEL_PATH)
print(f"\nModel saved to: {MODEL_PATH}")
print("Now predictor_service.py can use this model to make predictions!")
