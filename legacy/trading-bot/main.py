from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
import sqlite3

from app.core.logging import configure_logging
from app.router import router
from app.store import init_db

configure_logging()
init_db()
app = FastAPI(title="Hello Trading Bot")

# تأكد أن المجلدين موجودين: templates و static
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

@app.get("/", response_class=HTMLResponse)
def health(request: Request):
    return templates.TemplateResponse("base.html", {"request": request, "title": "صحة البوت"})

@app.get("/dashboard", response_class=HTMLResponse)
def dashboard(request: Request):
    conn = sqlite3.connect("bot.db")
    conn.row_factory = sqlite3.Row
    rows = conn.execute(
        "SELECT ts, symbol, side, qty, price, note FROM trades ORDER BY id DESC LIMIT 50"
    ).fetchall()
    conn.close()
    return templates.TemplateResponse("dashboard.html", {"request": request, "trades": rows, "title": "الصفقات"})

app.include_router(router)
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000)
