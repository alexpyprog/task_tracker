import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.responses import RedirectResponse

from app.logger.file_logger import CustomLogger
from app.api.endpoints.auth import auth_rt
from app.api.endpoints.users import users_rt
from app.api.endpoints.tasks import tasks_rt

logger = CustomLogger('Main')


app = FastAPI()

app.include_router(auth_rt)
app.include_router(users_rt)
app.include_router(tasks_rt)


@app.options("/{path:path}")
async def options_handler(path: str):
    logger.info(f"OPTIONS request: {path}")
    return {}


@app.middleware("http")
async def log_requests(request, call_next):
    logger.info(f"\nRequest from origin: {request.headers.get('origin')}")
    logger.info(f"Request host: {request.headers.get('host')}")
    logger.info(f"Request method: {request.method}")
    logger.info(f"Request path: {request.url.path}\n")

    response = await call_next(request)
    return response


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        'http://localhost',
        'http://192.168.1.2',
        "http://192.168.1.2:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get('/', include_in_schema=False)
async def root():
    return RedirectResponse(url='/docs', status_code=303)


@app.get("/ping")
async def ping():
    return {"message": "pong", "ip": "backend is reachable"}


if __name__ == '__main__':
    uvicorn.run(app=app, host='0.0.0.0', port=8000)
