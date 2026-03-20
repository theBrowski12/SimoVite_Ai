import httpx

WEATHER_FACTORS = {
    "clear":        1.00,
    "cloudy":       0.95,
    "fog":          0.70,
    "drizzle":      0.85,
    "rain":         0.72,
    "snow":         0.50,
    "thunderstorm": 0.55,
    "unknown":      0.90,
}

def _parse_wmo(wmo_code: int) -> str:
    if wmo_code == 0:                           return "clear"
    elif wmo_code in range(1, 4):               return "cloudy"
    elif wmo_code in [45, 48]:                  return "fog"
    elif wmo_code in [51, 53, 55]:              return "drizzle"
    elif wmo_code in [61, 63, 65, 80, 81, 82]:  return "rain"
    elif wmo_code in [71, 73, 75, 77, 85, 86]:  return "snow"
    elif wmo_code in [95, 96, 99]:              return "thunderstorm"
    else:                                        return "unknown"


async def get_weather_factor(lat: float, lon: float) -> tuple[str, float]:
    """Appelle Open-Meteo (gratuit, sans clé API) de manière async"""
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(
                "https://api.open-meteo.com/v1/forecast",
                params={
                    "latitude":  lat,
                    "longitude": lon,
                    "current":   "weathercode",
                    "timezone":  "auto"
                }
            )
            data      = response.json()
            wmo_code  = data["current"]["weathercode"]
            condition = _parse_wmo(wmo_code)
            factor    = WEATHER_FACTORS.get(condition, 0.90)
            return condition, factor

    except Exception as e:
        print(f"⚠️ Open-Meteo error: {e}")
        return "unknown", 0.90