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


# price_controller.py
async def predict_price(request: PriceRequest) -> PriceResponse:
    load_price_model()

    weather_condition, weather_factor = await get_weather_factor(
        request.pickup_latitude, request.pickup_longitude
    )
    rush_factor = get_rush_hour_factor()

    try:
        vehicle_enc = _le_vehicle.transform([request.vehicle_type])[0]
        category_enc = _le_category.transform([request.category])[0]
    except Exception:
        vehicle_enc, category_enc = 1, 0

    import pandas as pd
    features = pd.DataFrame([[
        request.distance_km, vehicle_enc, category_enc,
        weather_factor, rush_factor, request.order_total
    ]], columns=["distance_km", "vehicle_enc", "category_enc",
                 "weather_factor", "rush_factor", "order_total"])

    raw_price = _price_model.predict(features)[0]
    ml_price = max(8.0, round(float(raw_price), 2))

    # Calculate percentage compared to Delivery Service's fallback
    # Note: Delivery Service uses: 10.00 + (distance_km * 2.00)
    fallback_price = 10.00 + (request.distance_km * 2.00)

    if fallback_price > 0:
        price_percentage = ((ml_price - fallback_price) / fallback_price) * 100
        price_percentage = round(price_percentage, 2)
    else:
        price_percentage = 0.0

    return PriceResponse(
        delivery_cost=ml_price,
        distance_km=request.distance_km,
        vehicle_type=request.vehicle_type,
        category=request.category,
        weather_condition=weather_condition,
        weather_factor=weather_factor,
        rush_hour_factor=rush_factor,
        price_percentage=price_percentage,  # % difference from Delivery Service fallback
        breakdown={
            "ml_price": ml_price,
            "fallback_price": round(fallback_price, 2),
            "percentage_change": price_percentage,
            "distance_km": request.distance_km,
            "weather_factor": weather_factor,
            "rush_factor": rush_factor,
            "category": request.category,
            "order_total": request.order_total
        }
    )