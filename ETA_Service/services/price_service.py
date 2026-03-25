import joblib, numpy as np
from dtos.price_dto import PriceRequest, PriceResponse
from services.weather import get_weather_factor
from services.rush_service import get_rush_hour_factor

_price_model = None
_le_vehicle  = None
_le_category = None

def load_price_model():
    global _price_model, _le_vehicle, _le_category
    if _price_model is None:
        _price_model = joblib.load("model/price_model.pkl")
        _le_vehicle  = joblib.load("model/price_le_vehicle.pkl")
        _le_category = joblib.load("model/price_le_category.pkl")
        print("✅ Price model loaded")

async def predict_price(request: PriceRequest) -> PriceResponse:
    load_price_model()

    weather_condition, weather_factor = await get_weather_factor(
        request.pickup_latitude, request.pickup_longitude
    )
    rush_factor = get_rush_hour_factor()

    try:
        vehicle_enc  = _le_vehicle.transform([request.vehicle_type])[0]
        category_enc = _le_category.transform([request.category])[0]
    except Exception:
        vehicle_enc, category_enc = 1, 0  # defaults

    import pandas as pd
    features = pd.DataFrame([[
        request.distance_km, vehicle_enc, category_enc,
        weather_factor, rush_factor, request.order_total
    ]], columns=["distance_km","vehicle_enc","category_enc",
                 "weather_factor","rush_factor","order_total"])

    raw_price = _price_model.predict(features)[0]
    delivery_cost = max(8.0, round(float(raw_price), 2))

    return PriceResponse(
        delivery_cost     = delivery_cost,
        distance_km       = request.distance_km,
        vehicle_type      = request.vehicle_type,
        category          = request.category,
        weather_condition = weather_condition,
        weather_factor    = weather_factor,
        rush_hour_factor  = rush_factor,
        breakdown = {
            "base":             10.0,
            "distance_charge":  round(request.distance_km * 2, 2),
            "weather_surcharge": round((1 - weather_factor) * 5, 2),
            "rush_surcharge":   round((1 - rush_factor) * 8, 2),
            "category_factor":  request.category,
            "ml_adjustment":    round(delivery_cost - 10 - (request.distance_km * 2), 2)
        }
    )
