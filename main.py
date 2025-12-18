import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.responses import RedirectResponse

from app.core.settings import settings

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allow_origins,
    allow_methods=settings.allow_methods,
    allow_headers=settings.allow_headers,
)


@app.get('/')
async def root():
    return RedirectResponse(url='/docs', status_code=303)


if __name__ == '__main__':
    uvicorn.run(app=app)
