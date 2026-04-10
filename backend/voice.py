import speech_recognition as sr
import spacy
from datetime import datetime, timedelta
import re

# Load spaCy model - run: python -m spacy download en_core_web_sm
try:
    nlp = spacy.load("en_core_web_sm")
except OSError:
    nlp = None

def transcribe_audio(audio_data: bytes) -> str:
    """Convert audio bytes to text using Google Speech Recognition."""
    recognizer = sr.Recognizer()
    audio = sr.AudioData(audio_data, sample_rate=16000, sample_width=2)
    try:
        return recognizer.recognize_google(audio)
    except sr.UnknownValueError:
        return ""
    except sr.RequestError as e:
        raise RuntimeError(f"Speech recognition error: {e}")

def parse_task_from_text(text: str) -> dict:
    """Use spaCy to extract task title and due date from natural language."""
    result = {"title": text, "due_date": None, "description": ""}

    if not nlp or not text:
        return result

    doc = nlp(text.lower())
    due_date = None
    now = datetime.now()

    # Simple date extraction from entities and keywords
    for ent in doc.ents:
        if ent.label_ == "DATE":
            raw = ent.text
            if "tomorrow" in raw:
                due_date = now + timedelta(days=1)
            elif "today" in raw:
                due_date = now
            elif "next week" in raw:
                due_date = now + timedelta(weeks=1)
            elif "monday" in raw:
                due_date = _next_weekday(now, 0)
            elif "tuesday" in raw:
                due_date = _next_weekday(now, 1)
            elif "wednesday" in raw:
                due_date = _next_weekday(now, 2)
            elif "thursday" in raw:
                due_date = _next_weekday(now, 3)
            elif "friday" in raw:
                due_date = _next_weekday(now, 4)
        elif ent.label_ == "TIME":
            # Try to parse time like "3pm", "15:00"
            time_match = re.search(r'(\d{1,2})(?::(\d{2}))?\s*(am|pm)?', ent.text)
            if time_match and due_date:
                hour = int(time_match.group(1))
                minute = int(time_match.group(2) or 0)
                meridiem = time_match.group(3)
                if meridiem == "pm" and hour < 12:
                    hour += 12
                due_date = due_date.replace(hour=hour, minute=minute, second=0)

    # Clean up title: remove time/date phrases
    clean_title = re.sub(
        r'\b(remind me to|remind me|at \d{1,2}(:\d{2})?\s*(am|pm)?|tomorrow|today|next week|on (monday|tuesday|wednesday|thursday|friday|saturday|sunday))\b',
        '', text, flags=re.IGNORECASE
    ).strip().strip(',').strip()

    result["title"] = clean_title if clean_title else text
    result["due_date"] = due_date.isoformat() if due_date else None
    return result

def _next_weekday(dt: datetime, weekday: int) -> datetime:
    days_ahead = weekday - dt.weekday()
    if days_ahead <= 0:
        days_ahead += 7
    return dt + timedelta(days=days_ahead)
