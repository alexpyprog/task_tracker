import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.responses import RedirectResponse

from app.api.endpoints.auth import auth_rt
from app.api.endpoints.tasks import tasks_rt
from app.api.endpoints.users import users_rt
from app.core.settings import settings
from app.db.base import init_db

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users_rt)
app.include_router(tasks_rt)
app.include_router(auth_rt)


@app.on_event("startup")
async def on_startup():
    await init_db()


@app.get('/', include_in_schema=False)
async def root():
    return RedirectResponse(url='/docs', status_code=303)


if __name__ == '__main__':
    uvicorn.run(app=app, host='0.0.0.0', port=8000)
