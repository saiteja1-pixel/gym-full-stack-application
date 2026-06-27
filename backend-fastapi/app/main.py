import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import payments
from app.config import settings

app = FastAPI(
    title="Core Fit Club - Razorpay FastAPI Payment Service",
    description="Python FastAPI backend service managing Razorpay orders, verifications, and webhooks.",
    version="1.0.0"
)

# Configure CORS policies allowing access from frontend domains
origins = [
    "http://localhost:3000",
    "http://localhost:3001",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(payments.router)

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "Razorpay FastAPI Service",
        "port": settings.PORT,
        "env": settings.NODE_ENV
    }

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=settings.PORT, reload=True)
