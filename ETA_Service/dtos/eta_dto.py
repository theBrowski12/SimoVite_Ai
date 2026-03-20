from pydantic import BaseModel

class ETARequest(BaseModel):
    distance_km:       float
    vehicle_type:      str
    pickup_latitude:   float
    pickup_longitude:  float

class ETAResponse(BaseModel):
    estimated_minutes:  int
    distance_km:        float
    vehicle_type:       str
    weather_condition:  str
    weather_factor:     float
    rush_hour_factor:   float