import os

# Force transformers to only look at the local cache. No network calls!
os.environ["TRANSFORMERS_OFFLINE"] = "1"

from transformers import pipeline
from dtos.sentiment_dto import SentimentRequest, SentimentResponse

_sentiment_pipeline = None

print("⏳ Starting Sentiment Service...")
print("⏳ Loading sentiment model into memory...")

# Load the pipeline immediately at the module level.
# This happens exactly once when the server boots up.
_sentiment_pipeline = pipeline(
    "sentiment-analysis",
    model="lxyuan/distilbert-base-multilingual-cased-sentiments-student",
    top_k=None
)

print("✅ Sentiment model loaded successfully!")
def analyze_sentiment(request: SentimentRequest) -> SentimentResponse:
    if not request.comment or len(request.comment.strip()) < 3:
        return SentimentResponse(
            sentiment="MIXED", score=0.5, confidence=0.0,
            incoherent=False, alert=""
        )

    results = _sentiment_pipeline(request.comment[:512])[0]

    # Extraire scores
    scores = {r["label"].lower(): r["score"] for r in results}
    pos_score = scores.get("positive", 0.0)
    neg_score = scores.get("negative", 0.0)
    neu_score = scores.get("neutral",  0.0)

    # Déterminer sentiment
    if pos_score >= 0.6:
        sentiment = "POSITIVE"
        score = pos_score
    elif neg_score >= 0.6:
        sentiment = "NEGATIVE"
        score = neg_score
    else:
        sentiment = "MIXED"
        score = neu_score

    confidence = max(pos_score, neg_score, neu_score)

    # ✅ Détecter incohérence entre rating et commentaire
    incoherent = False
    alert = ""

    if request.rating >= 4.0 and sentiment == "NEGATIVE" and neg_score >= 0.7:
        incoherent = True
        alert = f"⚠️ Client gave {request.rating}★ but comment is NEGATIVE ({round(neg_score*100)}% confidence)"

    elif request.rating <= 2.0 and sentiment == "POSITIVE" and pos_score >= 0.7:
        incoherent = True
        alert = f"⚠️ Client gave {request.rating}★ but comment is POSITIVE ({round(pos_score*100)}% confidence)"

    return SentimentResponse(
        sentiment   = sentiment,
        score       = round(score, 4),
        confidence  = round(confidence, 4),
        incoherent  = incoherent,
        alert       = alert
    )