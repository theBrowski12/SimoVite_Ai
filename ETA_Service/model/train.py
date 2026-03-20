import pandas as pd
import numpy as np
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import mean_absolute_error, r2_score
import joblib
import os

def train_model():
    print("🚀 Chargement du dataset...")
    df = pd.read_csv("model/dataset.csv")
    print(f"📊 {len(df)} enregistrements chargés")

    # Encodage
    le_vehicle = LabelEncoder()
    le_weather = LabelEncoder()
    le_rush    = LabelEncoder()

    df["vehicle_encoded"] = le_vehicle.fit_transform(df["vehicle_type"])
    df["weather_encoded"] = le_weather.fit_transform(df["weather_condition"])
    df["rush_encoded"]    = le_rush.fit_transform(df["rush_period"])

    # Features
    X = df[[
        "distance_km",
        "vehicle_encoded",
        "weather_factor",
        "rush_factor"
    ]]
    y = df["eta_minutes"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    print("🤖 Entraînement GradientBoosting...")
    model = GradientBoostingRegressor(
        n_estimators=200,
        learning_rate=0.08,
        max_depth=4,
        min_samples_split=3,
        random_state=42
    )
    model.fit(X_train, y_train)

    # Évaluation
    y_pred = model.predict(X_test)
    mae    = mean_absolute_error(y_test, y_pred)
    r2     = r2_score(y_test, y_pred)

    print(f"✅ MAE  : {mae:.2f} minutes d'erreur moyenne")
    print(f"✅ R²   : {r2:.3f} (1.0 = parfait)")

    # Sauvegarde
    os.makedirs("model", exist_ok=True)
    joblib.dump(model,      "model/eta_model.pkl")
    joblib.dump(le_vehicle, "model/label_encoder.pkl")
    print("✅ Modèle sauvegardé")

    # Exemple de prédiction
    test_case = [[5.0, le_vehicle.transform(["MOTORCYCLE"])[0], 0.75, 0.70]]
    pred = model.predict(test_case)[0]
    print(f"\n🧪 Test : 5km, Moto, Pluie, Rush → {pred:.1f} min")

if __name__ == "__main__":
    train_model()