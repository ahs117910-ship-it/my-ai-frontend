import os
import json
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

try:
    genai.configure(api_key=os.environ.get("GEMINI_API_KEY", ""))
    gemini_model = genai.GenerativeModel('gemini-1.5-flash')
except Exception:
    gemini_model = None

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
    if not gemini_model:
        return "Gemini API Key is not configured properly."
        
    missed_str = ", ".join(missed_tasks) if missed_tasks else "None"
    
    prompt = f"""
    You are a highly empathetic and insightful AI Study Coach. The user is submitting their daily review.
    Their reflection notes: "{notes}"
    Goals they missed today: {missed_str}
    
    Please read the reflection notes carefully and follow these guidelines:
    1. Deeply analyze the user's emotional and physical state from their notes. Provide warm empathy and highly practical, tailored advice.
    2. If the user asked any questions, answer them directly and helpfully.
    3. Provide actionable tips on how to better manage their focus tomorrow.
    4. Praise them enthusiastically for what they achieved.
    
    Format your response in HTML (using <strong>, <br>, etc.) so it looks good on a web dashboard. Do not use markdown syntax, just raw HTML strings.
    Respond in a friendly, conversational tone in Korean if the user's notes are in Korean, otherwise English.
    """
    
    try:
        response = gemini_model.generate_content(prompt)
        return response.text
    except Exception as e:
        print(f"Error generating coaching feedback: {e}")
        return "Could not generate coaching feedback at this time."

def reschedule_missed(missed_sessions: list, upcoming_free_blocks: list):
    if not gemini_model:
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
        response = gemini_model.generate_content(prompt)
        text = response.text
        if text.startswith("```json"):
            text = text[7:-3].strip()
        elif text.startswith("```"):
            text = text[3:-3].strip()
            
        return json.loads(text)
    except Exception as e:
        print(f"Error calling Gemini API for rescheduling: {e}")
        return None

def ask_tutor(question: str) -> str:
    """
    Answers study-related questions using Gemini.
    """
    load_dotenv(override=True)
    
    try:
        genai.configure(api_key=os.environ.get("GEMINI_API_KEY", ""))
        model = genai.GenerativeModel('gemini-1.5-flash')
    except Exception:
        return "서버에 GEMINI_API_KEY가 설정되지 않았습니다. Render 환경 변수를 확인해주세요."
    
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
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        error_msg = str(e)
        print(f"Error calling Gemini for tutor: {error_msg}")
        return f"죄송합니다. 현재 AI 튜터가 질문에 답변할 수 없습니다. 에러: {error_msg}"
