import joblib
import numpy as np
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


async def calculate_eta_from_request(request: ETARequest) -> ETAResponse:
    load_model()

    weather_condition, weather_factor = await get_weather_factor(
        request.pickup_latitude,
        request.pickup_longitude
    )
    rush_factor = get_rush_hour_factor()

    estimated_minutes = _predict(
        distance_km    = request.distance_km,
        vehicle_type   = request.vehicle_type,
        weather_factor = weather_factor,
        rush_factor    = rush_factor
    )

    return ETAResponse(
        estimated_minutes = estimated_minutes,
        distance_km       = request.distance_km,
        vehicle_type      = request.vehicle_type,
        weather_condition = weather_condition,
        weather_factor    = weather_factor,
        rush_hour_factor  = rush_factor
    )


def _predict(distance_km: float, vehicle_type: str,
             weather_factor: float, rush_factor: float) -> int:
    try:
        vehicle_encoded = _encoder.transform([vehicle_type])[0]
    except Exception:
        vehicle_encoded = 1  # MOTORCYCLE par défaut
    features = np.array([[distance_km, vehicle_encoded, weather_factor, rush_factor]])
    eta      = _model.predict(features)[0]
    return max(1, int(round(eta)))