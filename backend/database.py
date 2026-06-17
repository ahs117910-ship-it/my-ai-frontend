from sqlalchemy import create_engine, Column, Integer, String, Boolean, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship

SQLALCHEMY_DATABASE_URL = "sqlite:///./study_planner.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class Goal(Base):
    __tablename__ = "goals"

    id = Column(Integer, primary_key=True, index=True)
    subject = Column(String, index=True)
    description = Column(String)
    total_hours = Column(Integer)
    
    schedules = relationship("Schedule", back_populates="goal", cascade="all, delete-orphan")

class Schedule(Base):
    __tablename__ = "schedules"

    id = Column(Integer, primary_key=True, index=True)
    goal_id = Column(Integer, ForeignKey("goals.id"))
    day_of_week = Column(String) # e.g., "Monday", "Tuesday"
    start_time = Column(String) # e.g., "14:00"
    end_time = Column(String) # e.g., "16:00"
    duration_minutes = Column(Integer)
    topic = Column(String)
    completed = Column(Boolean, default=False)
    progress = Column(String, default="pending") # "pending", "completed", "partial", "missed"

    goal = relationship("Goal", back_populates="schedules")

class DailyReview(Base):
    __tablename__ = "daily_reviews"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(String, index=True) # e.g., "YYYY-MM-DD"
    achievement_rate = Column(Integer) # e.g., 0-100 percentage
    notes = Column(String)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
