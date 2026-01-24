from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.responses import RedirectResponse

from app.api.endpoints import setup_routers
from app.db.base import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    setup_routers(app)
    await init_db()
    yield


app = FastAPI(lifespan=lifespan)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get('/', include_in_schema=False)
async def root():
    return RedirectResponse(url='/docs', status_code=303)


if __name__ == '__main__':
    uvicorn.run(app=app, host='0.0.0.0', port=8000)
