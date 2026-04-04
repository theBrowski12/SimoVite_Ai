import joblib
import pandas as pd
from dtos.eta_dto import ETARequest, ETAResponse
from services.weather import get_weather_factor
from services.rush_service import get_rush_hour_factor

MODEL_PATH   = "model/eta_model.pkl"
ENCODER_PATH = "model/label_encoder.pkl"

_model   = None
_encoder = None

def load_model():
    global _model, _encoder
    if _model is None:
        _model   = joblib.load(MODEL_PATH)
        _encoder = joblib.load(ENCODER_PATH)
        print("✅ Modèle ETA chargé en mémoire")


# eta_controller.py
async def calculate_eta_from_request(request: ETARequest) -> ETAResponse:
    load_model()

    weather_condition, weather_factor = await get_weather_factor(
        request.pickup_latitude,
        request.pickup_longitude
    )
    rush_factor = get_rush_hour_factor()

    # Get ML prediction
    ml_eta = _predict(
        distance_km=request.distance_km,
        vehicle_type=request.vehicle_type,
        weather_factor=weather_factor,
        rush_factor=rush_factor
    )

    # Calculate percentage compared to Delivery Service's fallback
    # Note: Delivery Service uses: 10 + (distance_km * 3)
    fallback_eta = 10 + (request.distance_km * 3)
    fallback_eta = max(1, int(round(fallback_eta)))

    if fallback_eta > 0:
        eta_percentage = ((ml_eta - fallback_eta) / fallback_eta) * 100
        eta_percentage = round(eta_percentage, 2)
    else:
        eta_percentage = 0.0

    return ETAResponse(
        estimated_minutes=ml_eta,  # Return ML value
        distance_km=request.distance_km,
        vehicle_type=request.vehicle_type,
        weather_condition=weather_condition,
        weather_factor=weather_factor,
        rush_hour_factor=rush_factor,
        eta_percentage=eta_percentage  # % difference from Delivery Service fallback
    )


def _predict(distance_km: float, vehicle_type: str,
             weather_factor: float, rush_factor: float) -> int:
    try:
        vehicle_encoded = _encoder.transform([vehicle_type])[0]
    except Exception:
        vehicle_encoded = 1

        # Utilise un DataFrame avec les noms de colonnes exacts (ex: distance, vehicle, etc.)
    features = pd.DataFrame([[
        distance_km, vehicle_encoded, weather_factor, rush_factor
    ]], columns=["distance_km", "vehicle_encoded", "weather_factor", "rush_factor"])

    eta = _model.predict(features)[0]
    return max(1, int(round(eta)))