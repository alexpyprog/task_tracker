from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from starlette.responses import RedirectResponse

from app.api.endpoints import setup_routers
from app.db.base import init_db
from app.logger.file_logger import CustomLogger
from app.core.settings import settings

logger = CustomLogger('Main')


@asynccontextmanager
async def lifespan(app: FastAPI):
    setup_routers(app)
    await init_db()
    yield


app = FastAPI(lifespan=lifespan)


@app.middleware("http")
async def cors_middleware(request: Request, call_next):
    # Логируем
    logger.info(f"CORS middleware - Method: {request.method}, Path: {request.url.path}")
    logger.info(f"Origin header: {request.headers.get('origin')}")

    # Обработка OPTIONS
    if request.method == "OPTIONS":
        response = JSONResponse(content={})
        response.headers["Access-Control-Allow-Origin"] = settings.frontend_url
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, PATCH"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Access-Control-Max-Age"] = "3600"
        response.headers["Vary"] = "Origin"
        return response


    response = await call_next(request)


    response.headers["Access-Control-Allow-Origin"] = settings.frontend_url
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, PATCH"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    response.headers["Access-Control-Allow-Credentials"] = "true"
    response.headers["Vary"] = "Origin"

    logger.info(f"Added CORS headers to {request.method} response")
    logger.info(f"Response headers: {dict(response.headers)}")

    return response


@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info(f"\nRequest from origin: {request.headers.get('origin')}")
    logger.info(f"Request host: {request.headers.get('host')}")
    logger.info(f"Request method: {request.method}")
    logger.info(f"Request path: {request.url.path}\n")

    response = await call_next(request)
    return response


@app.get('/', include_in_schema=False)
async def root():
    return RedirectResponse(url='/docs', status_code=303)


@app.get("/ping")
async def ping():
    return {"message": "pong", "ip": "backend is reachable"}


if __name__ == '__main__':
    uvicorn.run(app=app, host='0.0.0.0', port=8000)