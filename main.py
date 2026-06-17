from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List

import database
import schemas
import ai_service

# Create DB tables
database.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="AI Study Planner API")

# Configure CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For dev purposes
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from fastapi.staticfiles import StaticFiles

# (API endpoints start here)

@app.post("/generate_schedule/", response_model=List[schemas.Schedule])
def create_goals_and_schedule(input_form: schemas.GoalInputForm, db: Session = Depends(database.get_db)):
    # Calculate total available hours dynamically (rounding up if needed)
    total_available_hours = round(sum(g.duration_minutes for g in input_form.goals) / 60.0, 1)

    # 1. Save Goals to DB
    saved_goals = []
    for g in input_form.goals:
        db_goal = database.Goal(
            subject=g.subject,
            description=g.description,
            total_hours=g.duration_minutes # Storing goal specific minutes in total_hours field
        )
        db.add(db_goal)
        db.commit()
        db.refresh(db_goal)
        saved_goals.append(db_goal)
    
    # 2. Call AI Service
    goals_data = [{"subject": g.subject, "description": g.description, "duration_minutes": g.duration_minutes} for g in input_form.goals]
    schedule_data = ai_service.generate_schedule(goals_data, total_available_hours)
    
    if schedule_data is None:
        raise HTTPException(status_code=500, detail="Failed to generate schedule")

    # 3. Save Schedule to DB
    saved_schedules = []
    for item in schedule_data:
        # Find matching goal_id based on subject
        goal_id = next((g.id for g in saved_goals if g.subject.lower() == item.get("subject", "").lower()), None)
        
        # If no exact match (AI might slightly alter name), just link to the first goal or handle gracefully
        if not goal_id and saved_goals:
            goal_id = saved_goals[0].id

        if goal_id:
            db_schedule = database.Schedule(
                goal_id=goal_id,
                day_of_week=item.get("day_of_week"),
                start_time=item.get("start_time"),
                end_time=item.get("end_time"),
                duration_minutes=item.get("duration_minutes"),
                topic=item.get("topic")
            )
            db.add(db_schedule)
            db.commit()
            db.refresh(db_schedule)
            saved_schedules.append(db_schedule)
            
    # Return serialized models with subject injected
    response_schedules = []
    for s in saved_schedules:
        response_schedules.append(
            schemas.Schedule(
                id=s.id,
                goal_id=s.goal_id,
                day_of_week=s.day_of_week,
                start_time=s.start_time,
                end_time=s.end_time,
                duration_minutes=s.duration_minutes,
                topic=s.topic,
                completed=s.completed,
                progress=s.progress,
                subject=s.goal.subject if s.goal else "Unknown Subject"
            )
        )
        
    return response_schedules

@app.get("/schedules/", response_model=List[schemas.Schedule])
def get_schedules(db: Session = Depends(database.get_db)):
    schedules = db.query(database.Schedule).all()
    response_schedules = []
    for s in schedules:
        response_schedules.append(
            schemas.Schedule(
                id=s.id,
                goal_id=s.goal_id,
                day_of_week=s.day_of_week,
                start_time=s.start_time,
                end_time=s.end_time,
                duration_minutes=s.duration_minutes,
                topic=s.topic,
                completed=s.completed,
                progress=s.progress,
                subject=s.goal.subject if s.goal else "Unknown Subject"
            )
        )
    return response_schedules

@app.delete("/schedules/")
def delete_all_schedules(db: Session = Depends(database.get_db)):
    db.query(database.Schedule).delete()
    db.commit()
    return {"message": "All schedules deleted"}

@app.put("/schedules/{schedule_id}/progress")
def update_progress(schedule_id: int, progress: str, db: Session = Depends(database.get_db)):
    # progress should be one of "completed", "partial", "missed"
    db_schedule = db.query(database.Schedule).filter(database.Schedule.id == schedule_id).first()
    if not db_schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    
    db_schedule.progress = progress
    db_schedule.completed = (progress == "completed")
    db.commit()
    db.refresh(db_schedule)
    return db_schedule

@app.get("/stats/", response_model=schemas.ProgressStats)
def get_stats(db: Session = Depends(database.get_db)):
    schedules = db.query(database.Schedule).all()
    total = len(schedules)
    completed = sum(1 for s in schedules if s.progress == "completed")
    partial = sum(1 for s in schedules if s.progress == "partial")
    missed = sum(1 for s in schedules if s.progress == "missed")
    
    rate = 0.0
    if total > 0:
        rate = (completed / total) * 100
        
    return schemas.ProgressStats(
        total_sessions=total,
        completed_sessions=completed,
        partial_sessions=partial,
        missed_sessions=missed,
        overall_completion_rate=rate
    )

@app.post("/reviews/", response_model=schemas.DailyReviewResponse)
def create_daily_review(review: schemas.DailyReviewCreate, db: Session = Depends(database.get_db)):
    db_review = database.DailyReview(**review.dict(exclude={'missed_tasks'}))
    db.add(db_review)
    db.commit()
    db.refresh(db_review)
    
    # Generate Coaching Feedback
    coaching_feedback = None
    if review.notes or review.missed_tasks:
        coaching_feedback = ai_service.generate_coaching_feedback(review.notes or "", review.missed_tasks or [])
    
    # Create the response object
    response_data = schemas.DailyReviewResponse(
        id=db_review.id,
        date=db_review.date,
        achievement_rate=db_review.achievement_rate,
        notes=db_review.notes,
        missed_tasks=review.missed_tasks,
        coaching_feedback=coaching_feedback
    )
    return response_data

@app.get("/reviews/", response_model=List[schemas.DailyReviewResponse])
def get_reviews(db: Session = Depends(database.get_db)):
    return db.query(database.DailyReview).all()

@app.post("/tutor/ask")
def ask_tutor_endpoint(question_data: schemas.TutorQuestion):
    answer = ai_service.ask_tutor(question_data.question)
    return {"answer": answer}

# Serve the frontend (HTML/CSS/JS) directly from this server
from fastapi.staticfiles import StaticFiles
app.mount("/", StaticFiles(directory="frontend", html=True), name="frontend")
