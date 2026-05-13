from pydantic import BaseModel, field_validator

class ChartBar(BaseModel):
    time: int
    open: float
    high: float
    low: float
    close: float
    volume: float

    @field_validator("time")
    def validate_time(cls, v):
        # Convert milliseconds to seconds if necessary
        # The typical max timestamp in seconds is around 2 billion (year 2033),
        # so any timestamp > 10 billion is safely assumed to be milliseconds.
        if v > 10000000000:
            return int(v / 1000)
        return v
from typing import List, Dict, Any, Optional
from datetime import datetime

class DrawingPoint(BaseModel):
    time: int | str
    price: float

class DrawingCreate(BaseModel):
    shape_type: str
    points: List[DrawingPoint]
    metadata: Optional[Dict[str, Any]] = None

class DrawingResponse(DrawingCreate):
    id: str
    ticker: str
    created_at: datetime
