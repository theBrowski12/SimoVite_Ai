from fastapi import APIRouter, HTTPException
from dtos.eta_dto import ETARequest, ETAResponse
from services.eta_service import calculate_eta_from_request

router = APIRouter(prefix="/api/eta", tags=["ETA"])


@router.post("/calculate", response_model=ETAResponse)
async def calculate_eta(request: ETARequest):
    """
    Endpoint principal — appelé par DeliveryService via Feign.
    Reçoit directement distance + vehicleType + coordonnées.
    """
    try:
        return await calculate_eta_from_request(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
