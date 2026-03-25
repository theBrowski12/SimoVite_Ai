from fastapi import APIRouter, HTTPException
from dtos.price_dto import PriceRequest, PriceResponse
from services.price_service import predict_price

router = APIRouter(prefix="/v1/price", tags=["Price"])

@router.post("/calculate", response_model=PriceResponse)
async def calculate_price(request: PriceRequest):
    try:
        return await predict_price(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
