import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .database import init_db
from .routes import visits, webhooks, websocket, dev

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("ringvoice.main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing RingVoice Database...")
    init_db()
    logger.info("RingVoice Database ready with initial seed visits.")
    yield
    logger.info("Shutting down RingVoice Backend.")

app = FastAPI(
    title="RingVoice Backend API",
    description="Real-time live doorbell captioning service for deaf & hard-of-hearing residents.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Attach routes
app.include_router(visits.router)
app.include_router(webhooks.router)
app.include_router(websocket.router)
app.include_router(dev.router)

@app.get("/", tags=["Root"])
def root():
    return {
        "service": "RingVoice Backend",
        "description": "Live doorbell captions for deaf and hard-of-hearing residents",
        "status": "online",
        "docs": "/docs",
        "websocket": "/ws"
    }

@app.get("/health", tags=["Root"])
def health():
    return {"status": "ok", "service": "RingVoice"}
