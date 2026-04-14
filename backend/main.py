from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, status
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta

from database import get_db, TaskDB, UserDB
from models import Task, TaskCreate, TaskUpdate, UserCreate, UserResponse, Token
from voice import transcribe_audio, parse_task_from_text
from auth import (
    get_password_hash,
    verify_password,
    create_access_token,
    get_current_user,
    ACCESS_TOKEN_EXPIRE_MINUTES
)

app = FastAPI(title="Task Organizer API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/register", response_model=UserResponse)
def register(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(UserDB).filter(UserDB.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    hashed_password = get_password_hash(user.password)
    new_user = UserDB(username=user.username, hashed_password=hashed_password)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(UserDB).filter(UserDB.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/tasks", response_model=List[Task])
def get_tasks(
    view: Optional[str] = "day",  # day | week | month
    date: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(get_current_user)
):
    query = db.query(TaskDB).filter(TaskDB.user_id == current_user.id)
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
def get_all_tasks(db: Session = Depends(get_db), current_user: UserDB = Depends(get_current_user)):
    return db.query(TaskDB).filter(TaskDB.user_id == current_user.id).order_by(TaskDB.due_date).all()

@app.get("/categories")
def get_categories(db: Session = Depends(get_db), current_user: UserDB = Depends(get_current_user)):
    rows = db.query(TaskDB.category).filter(TaskDB.user_id == current_user.id).distinct().all()
    cats = sorted({r[0] for r in rows if r[0]})
    # Always include defaults even if no tasks yet
    defaults = ["General", "Work", "Personal", "Health", "Shopping"]
    merged = sorted(set(defaults) | set(cats))
    return merged

@app.post("/tasks", response_model=Task)
def create_task(task: TaskCreate, db: Session = Depends(get_db), current_user: UserDB = Depends(get_current_user)):
    db_task = TaskDB(**task.model_dump(), user_id=current_user.id)
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task

@app.patch("/tasks/{task_id}", response_model=Task)
def update_task(task_id: int, task: TaskUpdate, db: Session = Depends(get_db), current_user: UserDB = Depends(get_current_user)):
    db_task = db.query(TaskDB).filter(TaskDB.id == task_id, TaskDB.user_id == current_user.id).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found or unauthorized")
    for field, value in task.model_dump(exclude_unset=True).items():
        setattr(db_task, field, value)
    db.commit()
    db.refresh(db_task)
    return db_task

@app.delete("/tasks/{task_id}")
def delete_task(task_id: int, db: Session = Depends(get_db), current_user: UserDB = Depends(get_current_user)):
    db_task = db.query(TaskDB).filter(TaskDB.id == task_id, TaskDB.user_id == current_user.id).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found or unauthorized")
    db.delete(db_task)
    db.commit()
    return {"ok": True}

@app.post("/voice/transcribe")
async def voice_transcribe(audio: UploadFile = File(...), current_user: UserDB = Depends(get_current_user)):
    """Receive audio file, transcribe and parse into task fields."""
    audio_bytes = await audio.read()
    text = transcribe_audio(audio_bytes)
    if not text:
        raise HTTPException(status_code=400, detail="Could not understand audio")
    parsed = parse_task_from_text(text)
    return {"transcript": text, **parsed}
