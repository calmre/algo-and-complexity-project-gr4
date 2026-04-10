from fastapi import FastAPI, Depends, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from database import get_db, TaskDB
from models import Task, TaskCreate, TaskUpdate
from voice import transcribe_audio, parse_task_from_text

app = FastAPI(title="Task Organizer API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/tasks", response_model=List[Task])
def get_tasks(
    view: Optional[str] = "day",  # day | week | month
    date: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(TaskDB)
    ref = datetime.fromisoformat(date) if date else datetime.now()

    if view == "day":
        query = query.filter(
            TaskDB.due_date >= ref.replace(hour=0, minute=0, second=0),
            TaskDB.due_date < ref.replace(hour=23, minute=59, second=59)
        )
    elif view == "week":
        start = ref - __import__('datetime').timedelta(days=ref.weekday())
        end = start + __import__('datetime').timedelta(days=7)
        query = query.filter(TaskDB.due_date >= start, TaskDB.due_date < end)
    elif view == "month":
        start = ref.replace(day=1, hour=0, minute=0, second=0)
        if ref.month == 12:
            end = ref.replace(year=ref.year + 1, month=1, day=1)
        else:
            end = ref.replace(month=ref.month + 1, day=1)
        query = query.filter(TaskDB.due_date >= start, TaskDB.due_date < end)

    return query.order_by(TaskDB.due_date).all()

@app.get("/tasks/all", response_model=List[Task])
def get_all_tasks(db: Session = Depends(get_db)):
    return db.query(TaskDB).order_by(TaskDB.due_date).all()

@app.get("/categories")
def get_categories(db: Session = Depends(get_db)):
    rows = db.query(TaskDB.category).distinct().all()
    cats = sorted({r[0] for r in rows if r[0]})
    # Always include defaults even if no tasks yet
    defaults = ["General", "Work", "Personal", "Health", "Shopping"]
    merged = sorted(set(defaults) | set(cats))
    return merged

@app.post("/tasks", response_model=Task)
def create_task(task: TaskCreate, db: Session = Depends(get_db)):
    db_task = TaskDB(**task.model_dump())
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task

@app.patch("/tasks/{task_id}", response_model=Task)
def update_task(task_id: int, task: TaskUpdate, db: Session = Depends(get_db)):
    db_task = db.query(TaskDB).filter(TaskDB.id == task_id).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    for field, value in task.model_dump(exclude_unset=True).items():
        setattr(db_task, field, value)
    db.commit()
    db.refresh(db_task)
    return db_task

@app.delete("/tasks/{task_id}")
def delete_task(task_id: int, db: Session = Depends(get_db)):
    db_task = db.query(TaskDB).filter(TaskDB.id == task_id).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    db.delete(db_task)
    db.commit()
    return {"ok": True}

@app.post("/voice/transcribe")
async def voice_transcribe(audio: UploadFile = File(...)):
    """Receive audio file, transcribe and parse into task fields."""
    audio_bytes = await audio.read()
    text = transcribe_audio(audio_bytes)
    if not text:
        raise HTTPException(status_code=400, detail="Could not understand audio")
    parsed = parse_task_from_text(text)
    return {"transcript": text, **parsed}
