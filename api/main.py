import os
import json
# pyrefly: ignore [missing-import]
from fastapi import FastAPI, Query
# pyrefly: ignore [missing-import]
from fastapi.responses import JSONResponse
from typing import Optional

app = FastAPI()

# ── Food Database ──
# Load foods database dynamically from JSON file
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
FOODS_DB_PATH = os.path.join(CURRENT_DIR, "foods_db.json")

try:
    with open(FOODS_DB_PATH, "r", encoding="utf-8") as f:
        foods = json.load(f)
except Exception as e:
    print(f"Error loading foods database: {e}")
    foods = {"morning": [], "noon": [], "evening": [], "snack": []}


@app.get("/api/foods")
def get_foods(meal: Optional[str] = Query(None, description="Filter by meal type: morning, noon, evening, snack")):
    """Return the food database. Optionally filter by meal type."""
    if meal:
        if meal not in foods:
            return JSONResponse(
                status_code=404,
                content={"error": f"Meal '{meal}' not found. Valid options: morning, noon, evening, snack"}
            )
        return {meal: foods[meal]}
    return foods
