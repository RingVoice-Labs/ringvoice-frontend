import uvicorn
import os
import sys

# Ensure backend root is on sys.path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

if __name__ == "__main__":
    from app.config import settings
    print(f"Starting RingVoice Backend on http://{settings.HOST}:{settings.PORT}")
    print(f"Swagger API Docs: http://localhost:{settings.PORT}/docs")
    print(f"Real-time WebSocket: ws://localhost:{settings.PORT}/ws")
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=False
    )
