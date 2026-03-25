from fastapi import APIRouter, HTTPException
from dtos.sentiment_dto import SentimentRequest, SentimentResponse
from services.sentiment_service import analyze_sentiment

router = APIRouter(prefix="/v1/sentiment", tags=["Sentiment"])

@router.post("/analyze", response_model=SentimentResponse)
async def analyze(request: SentimentRequest):
    try:
        return analyze_sentiment(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))