from fastapi import FastAPI
from contextlib import asynccontextmanager
import py_eureka_client.eureka_client as eureka_client
from controllers.eta_controller import router as eta_router
from controllers.price_controller import router as price_router
from controllers.sentiment_controller import router as sentiment_router

from dotenv import load_dotenv
import os

load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    await eureka_client.init_async(
        eureka_server = os.getenv("EUREKA_URL", "http://localhost:8761/eureka"),
        app_name      = "eta-service",
        instance_port = int(os.getenv("PORT", 8085)),
        instance_host = os.getenv("EUREKA_INSTANCE_HOST", "localhost")
    )
    print("✅ ETA_Service enregistré dans Eureka")
    yield
    await eureka_client.stop_async()


app = FastAPI(
    title     = "SimoVite ETA Service",
    version   = "1.0.0",
    lifespan  = lifespan
)

app.include_router(eta_router)
app.include_router(price_router)
app.include_router(sentiment_router)

@app.get("/health")
def health():
    return {"status": "UP", "service": "ETA_Service"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host   = os.getenv("HOST", "0.0.0.0"),
        port   = int(os.getenv("PORT", 8085)),
        reload = True
    )
