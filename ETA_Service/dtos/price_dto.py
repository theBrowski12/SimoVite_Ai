from pydantic import BaseModel

class PriceRequest(BaseModel):
    distance_km:    float
    vehicle_type:   str           # MOTORCYCLE / CAR / BICYCLE / TRUCK
    category:       str           # RESTAURANT / PHARMACY / SUPERMARKET / SPECIAL_DELIVERY
    pickup_latitude:  float
    pickup_longitude: float
    order_total:    float

class PriceResponse(BaseModel):
    delivery_cost:    float       # in DH
    distance_km:      float
    vehicle_type:     str
    category:         str
    weather_condition: str
    weather_factor:   float
    rush_hour_factor: float
    breakdown: dict               # detailed breakdown for transparency
