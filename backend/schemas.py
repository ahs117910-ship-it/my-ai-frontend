from pydantic import BaseModel
from typing import List, Optional

class ScheduleBase(BaseModel):
    day_of_week: str
    start_time: str
    end_time: str
    duration_minutes: int
    topic: str

class ScheduleCreate(ScheduleBase):
    pass

class Schedule(ScheduleBase):
    id: int
    goal_id: int
    completed: bool
    progress: str

    class Config:
        orm_mode = True

class GoalBase(BaseModel):
    subject: str
    description: str
    duration_minutes: int

class GoalCreate(GoalBase):
    pass

class Goal(GoalBase):
    id: int
    total_hours: int
    schedules: List[Schedule] = []

    class Config:
        orm_mode = True

class GoalInputForm(BaseModel):
    goals: List[GoalCreate]

class DailyReviewCreate(BaseModel):
    date: str
    achievement_rate: int
    notes: Optional[str] = None
    missed_tasks: Optional[List[str]] = []

class DailyReviewResponse(DailyReviewCreate):
    id: int
    coaching_feedback: Optional[str] = None

    class Config:
        orm_mode = True

class ProgressStats(BaseModel):
    total_sessions: int
    completed_sessions: int
    partial_sessions: int
    missed_sessions: int
    overall_completion_rate: float

class TutorQuestion(BaseModel):
    question: str
