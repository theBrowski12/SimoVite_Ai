from datetime import datetime

def get_rush_hour_factor() -> float:
    """Calcule le facteur de rush hour basé sur l'heure locale"""
    hour = datetime.now().hour

    if 7 <= hour <= 9:
        return 0.65    # Rush matin
    elif 12 <= hour <= 14:
        return 0.80    # Heure déjeuner
    elif 17 <= hour <= 20:
        return 0.60    # Rush soir (le pire)
    elif hour >= 22 or hour <= 5:
        return 1.25    # Nuit — peu de trafic
    else:
        return 1.00    # Normal


def get_rush_period_name() -> str:
    """Retourne le nom de la période pour les logs"""
    hour = datetime.now().hour
    if 7 <= hour <= 9:    return "morning_rush"
    elif 12 <= hour <= 14: return "lunch"
    elif 17 <= hour <= 20: return "evening_rush"
    elif hour >= 22 or hour <= 5: return "night"
    else:                  return "normal"