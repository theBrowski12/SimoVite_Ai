import pandas as pd
import numpy as np
import random

np.random.seed(42)
random.seed(42)

# ── Constantes réalistes pour le Maroc (Casablanca, Rabat, etc.) ──────────
BASE_SPEEDS = {
    "BICYCLE":    12.0,   # km/h — ville marocaine dense
    "MOTORCYCLE": 40.0,   # km/h — moto en ville
    "CAR":        28.0,   # km/h — embouteillages fréquents
    "TRUCK":      20.0,   # km/h — lourd, lent en ville
}

WEATHER_CONDITIONS = {
    "clear":        1.00,
    "cloudy":       0.95,
    "fog":          0.70,
    "drizzle":      0.85,
    "rain":         0.72,
    "thunderstorm": 0.55,
}

RUSH_HOURS = {
    "morning_rush":  0.65,  # 7h-9h
    "lunch":         0.80,  # 12h-14h
    "evening_rush":  0.60,  # 17h-20h
    "night":         1.25,  # 22h-5h
    "normal":        1.00,
}

VEHICLE_TYPES   = list(BASE_SPEEDS.keys())
WEATHER_KEYS    = list(WEATHER_CONDITIONS.keys())
RUSH_KEYS       = list(RUSH_HOURS.keys())

# Probabilités réalistes pour le Maroc
WEATHER_WEIGHTS = [0.45, 0.25, 0.05, 0.10, 0.10, 0.05]
RUSH_WEIGHTS    = [0.15, 0.15, 0.20, 0.10, 0.40]
VEHICLE_WEIGHTS = [0.05, 0.45, 0.40, 0.10]  # motos dominantes au Maroc

records = []

for i in range(180):
    vehicle   = random.choices(VEHICLE_TYPES, weights=VEHICLE_WEIGHTS)[0]
    weather   = random.choices(WEATHER_KEYS,  weights=WEATHER_WEIGHTS)[0]
    rush      = random.choices(RUSH_KEYS,     weights=RUSH_WEIGHTS)[0]

    # Distances typiques de livraison au Maroc (0.5km à 25km)
    distance  = round(random.uniform(0.5, 25.0), 2)

    base_speed      = BASE_SPEEDS[vehicle]
    weather_factor  = WEATHER_CONDITIONS[weather]
    rush_factor     = RUSH_HOURS[rush]

    effective_speed = base_speed * weather_factor * rush_factor

    # ETA de base
    eta_base = (distance / effective_speed) * 60

    # Bruit réaliste : +/- 3 minutes (feux rouges, attentes, etc.)
    noise    = random.gauss(0, 2.5)
    eta_real = max(2.0, round(eta_base + noise, 1))

    records.append({
        "distance_km":      distance,
        "vehicle_type":     vehicle,
        "weather_condition": weather,
        "weather_factor":   weather_factor,
        "rush_period":      rush,
        "rush_factor":      rush_factor,
        "eta_minutes":      eta_real
    })

df = pd.DataFrame(records)
df.to_csv("model/dataset.csv", index=False)
print(f"✅ Dataset généré : {len(df)} enregistrements")
print(df.describe())
print("\nDistribution véhicules :")
print(df["vehicle_type"].value_counts())
print("\nDistribution météo :")
print(df["weather_condition"].value_counts())