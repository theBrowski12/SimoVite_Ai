import pandas as pd
import numpy as np
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error
import joblib, os, random

random.seed(42); np.random.seed(42)

BASE_PRICES = {
    "MOTORCYCLE": {"base": 10, "per_km": 2.0},
    "CAR":        {"base": 15, "per_km": 2.5},
    "BICYCLE":    {"base": 8,  "per_km": 1.5},
    "TRUCK":      {"base": 20, "per_km": 3.5},
}

CATEGORY_FACTORS = {
    "RESTAURANT":      1.0,
    "PHARMACY":        1.1,   # fragile items
    "SUPERMARKET":     1.2,   # heavy/bulk
    "SPECIAL_DELIVERY": 1.5,  # premium
}

records = []
for _ in range(200):
    vehicle   = random.choice(list(BASE_PRICES.keys()))
    category  = random.choice(list(CATEGORY_FACTORS.keys()))
    distance  = round(random.uniform(0.5, 25.0), 2)
    weather_f = random.choice([1.0, 0.95, 0.85, 0.72, 0.55])
    rush_f    = random.choice([0.65, 0.80, 0.60, 1.25, 1.0])
    order_total = round(random.uniform(30, 500), 2)

    base = BASE_PRICES[vehicle]["base"]
    per_km = BASE_PRICES[vehicle]["per_km"]
    cat_f = CATEGORY_FACTORS[category]

    # Price increases when weather is bad or rush hour
    weather_surcharge = (1 - weather_f) * 5   # up to +5 DH in storm
    rush_surcharge    = (1 - rush_f) * 8      # up to +8 DH in evening rush

    price = base + (distance * per_km * cat_f) + weather_surcharge + rush_surcharge
    price += random.gauss(0, 1.5)             # real noise
    price = max(8.0, round(price, 2))

    records.append({
        "distance_km":    distance,
        "vehicle_type":   vehicle,
        "category":       category,
        "weather_factor": weather_f,
        "rush_factor":    rush_f,
        "order_total":    order_total,
        "price":          price
    })

df = pd.DataFrame(records)
df.to_csv("model/price_dataset.csv", index=False)

le_vehicle  = LabelEncoder().fit(df["vehicle_type"])
le_category = LabelEncoder().fit(df["category"])
df["vehicle_enc"]  = le_vehicle.transform(df["vehicle_type"])
df["category_enc"] = le_category.transform(df["category"])

X = df[["distance_km","vehicle_enc","category_enc","weather_factor","rush_factor","order_total"]]
y = df["price"]

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

model = GradientBoostingRegressor(n_estimators=200, learning_rate=0.08, max_depth=4, random_state=42)
model.fit(X_train, y_train)

mae = mean_absolute_error(y_test, model.predict(X_test))
print(f"✅ Price MAE : {mae:.2f} DH")

os.makedirs("model", exist_ok=True)
joblib.dump(model,       "model/price_model.pkl")
joblib.dump(le_vehicle,  "model/price_le_vehicle.pkl")
joblib.dump(le_category, "model/price_le_category.pkl")
print("✅ Price model saved")
