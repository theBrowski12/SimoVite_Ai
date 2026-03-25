from pydantic import BaseModel

class SentimentRequest(BaseModel):
    comment: str
    rating:  float      # 1.0 à 5.0 — pour détecter les incohérences

class SentimentResponse(BaseModel):
    sentiment:    str    # POSITIVE / NEGATIVE / MIXED
    score:        float  # 0.0 = très négatif, 1.0 = très positif
    confidence:   float  # confiance du modèle
    incoherent:   bool   # True si rating 5 mais commentaire négatif
    alert:        str    # message d'alerte si incohérent