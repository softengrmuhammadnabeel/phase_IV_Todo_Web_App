from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.api.routes import tasks, auth, signup, chat
from src.config import settings
from src.utils.logging import setup_logging
import uvicorn

setup_logging()

app = FastAPI(
    title="Todo Backend API",
    description="RESTful API for managing user tasks with user-based data isolation",
    version="1.0.0"
)

# CORS configuration
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

if getattr(settings, "FRONTEND_URL", None):
    origins.append(settings.FRONTEND_URL)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(auth.router, prefix="/auth")
app.include_router(tasks.router, prefix="/tasks")
app.include_router(signup.router, prefix="/signup")
app.include_router(chat.router, prefix="/api")

# Root endpoint
@app.get("/")
def root():
    return {
        "message": "Todo Backend API is running",
        "status": "ok"
    }

# Health check endpoint
@app.get("/health")
def health():
    return {"status": "healthy"}


if __name__ == "__main__":
    uvicorn.run(
        "src.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.RELOAD
    )
