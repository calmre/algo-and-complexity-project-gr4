from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = ""
    category: Optional[str] = "General"
    due_date: Optional[datetime] = None

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    due_date: Optional[datetime] = None
    completed: Optional[bool] = None

class Task(BaseModel):
    id: int
    title: str
    description: str
    category: str
    due_date: Optional[datetime]
    completed: bool
    created_at: datetime

    class Config:
        from_attributes = True
