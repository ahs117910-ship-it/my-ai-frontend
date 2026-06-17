import os
import json
from dotenv import load_dotenv

load_dotenv()

# Safely import groq - if not installed, features gracefully degrade
try:
    from groq import Groq
    groq_client = Groq()
except ImportError:
    Groq = None
    groq_client = None
    print("WARNING: groq package not installed. AI features will be unavailable.")
except Exception:
    groq_client = None
    print("WARNING: Failed to initialize Groq client. Check GROQ_API_KEY.")


def generate_schedule(goals_data: list, total_hours: int):
    """
    Deterministically generates a study schedule based on goals and available time.
    (No AI used to avoid API quota errors)
    """
    days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    schedule = []
    
    current_day_idx = 0
    current_hour = 9 # Start at 09:00
    
    for goal in goals_data:
        subject = goal.get("subject", "Study")
        description = goal.get("description", "Study topic")
        duration = int(goal.get("duration_minutes", 60))
        if duration <= 0:
            duration = 60 # Default to 1 hour if user left it blank
        
        # Break duration into chunks (max 120 minutes per block)
        while duration > 0:
            block_mins = min(duration, 120)
            duration -= block_mins
            
            end_hour = current_hour + (block_mins // 60)
            end_min = block_mins % 60
            
            start_str = f"{current_hour:02d}:00"
            end_str = f"{end_hour:02d}:{end_min:02d}"
            
            schedule.append({
                "subject": subject,
                "day_of_week": days[current_day_idx],
                "start_time": start_str,
                "end_time": end_str,
                "duration_minutes": block_mins,
                "topic": description
            })
            
            current_hour = end_hour
            if end_min > 0:
                current_hour += 1 # round up next block start
                
            # If day is too long (e.g. past 8 PM), move to next day
            if current_hour >= 20:
                current_day_idx = (current_day_idx + 1) % 7
                current_hour = 9
                
        # After each goal, switch to the next day for variety
        current_day_idx = (current_day_idx + 1) % 7
        current_hour = 9

    return schedule

def generate_coaching_feedback(notes: str, missed_tasks: list) -> str:
    if not groq_client:
        return "Groq API Key is not configured properly."
        
    missed_str = ", ".join(missed_tasks) if missed_tasks else "None"
    
    prompt = f"""
    You are a highly empathetic and insightful AI Study Coach. The user is submitting their daily review.
    Their reflection notes: "{notes}"
    Goals they missed today: {missed_str}
    
    Please read the reflection notes carefully and follow these guidelines:
    1. **Context & Emotion Analysis**: Deeply analyze the user's emotional and physical state from their notes. 
    2. **Specific Solutions**: If they express struggles, you MUST provide highly practical, tailored advice.
       - If they say "잠 온다", "졸리다" (sleepy), recommend specific ways to wake up (e.g., drinking cold water, stretching, short power nap, washing face).
       - If they say "피곤하다" (tired), recommend rest strategies.
       - If they lost focus, recommend focus techniques (like Pomodoro).
    3. **Missed Goals**: Provide actionable tips on how to better distribute their time tomorrow, especially if they missed goals.
    4. **Encouragement**: If they achieved everything or show a positive attitude, praise them enthusiastically!
    
    Format your response in HTML (using <strong>, <br>, <ul>, <li> etc.) so it looks good on a web dashboard. Do not use markdown syntax, just raw HTML strings.
    Respond in a friendly, conversational tone in Korean.
    """
    
    try:
        completion = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": "You are a helpful AI Study Coach."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
        )
        return completion.choices[0].message.content
    except Exception as e:
        print(f"Error generating coaching feedback: {e}")
        return "Could not generate coaching feedback at this time."

def reschedule_missed(missed_sessions: list, upcoming_free_blocks: list):
    """
    Logic for auto-rescheduling missed sessions.
    (This is a simplified version for demonstration)
    """
    if not groq_client:
        return None
        
    prompt = f"""
    The user missed the following study sessions:
    {json.dumps(missed_sessions)}
    
    Here are the upcoming free time blocks:
    {json.dumps(upcoming_free_blocks)}
    
    Please re-allocate the missed topics into the available free blocks.
    Return the new schedule strictly as a JSON array matching the missed sessions format, 
    but with updated day_of_week, start_time, end_time.
    Do not use markdown.
    """
    
    try:
        completion = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": "You output JSON arrays only."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.2,
        )
        text = completion.choices[0].message.content
        if text.startswith("```json"):
            text = text[7:-3].strip()
        elif text.startswith("```"):
            text = text[3:-3].strip()
            
        return json.loads(text)
    except Exception as e:
        print(f"Error calling Groq API for rescheduling: {e}")
        return None

def ask_tutor(question: str) -> str:
    """
    Answers study-related questions using Groq.
    """
    # Force reload env to pick up any new keys without restarting the server
    load_dotenv(override=True)
    
    if Groq is None:
        return "서버에 groq 패키지가 설치되지 않았습니다. requirements.txt를 확인해주세요."
    
    try:
        client = Groq(api_key=os.environ.get("GROQ_API_KEY", ""))
    except Exception:
        return "서버에 GROQ_API_KEY가 설정되지 않았습니다. Render 환경 변수를 확인해주세요."
    
    prompt = f"""
    You are a friendly, encouraging AI Study Tutor.
    The student is currently studying and has the following question:
    "{question}"
    
    Please provide a clear, easy-to-understand answer. 
    Use a friendly and educational tone.
    Format your response in HTML (using <strong>, <br>, <ul>, <li>, <pre> for code if any) so it looks good on a web dashboard. 
    Do not use markdown syntax, just raw HTML strings.
    Respond in the language the user asked the question in (usually Korean).
    """
    try:
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": "You are a helpful AI tutor."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.5,
        )
        return completion.choices[0].message.content
    except Exception as e:
        error_msg = str(e)
        print(f"Error calling Groq for tutor: {error_msg}")
        return f"죄송합니다. 현재 AI 튜터가 질문에 답변할 수 없습니다. 에러: {error_msg}"
