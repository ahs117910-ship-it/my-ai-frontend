import os
import json
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

# Configure Gemini API
# The user needs to set GEMINI_API_KEY in their environment or .env file
genai.configure(api_key=os.environ.get("GEMINI_API_KEY", ""))

def generate_schedule(goals_data: list, total_hours: int):
    """
    Calls Gemini API to generate a study schedule based on goals and available time.
    """
    model = genai.GenerativeModel('gemini-3.5-flash')
    
    prompt = f"""
    You are an expert AI study scheduler.
    The user has a total of {total_hours} hours available for study this week.
    Here are their goals:
    """
    
    for idx, goal in enumerate(goals_data):
        prompt += f"\nGoal {idx+1}: Subject: {goal['subject']}, Description: {goal['description']}, Allocated Minutes: {goal['duration_minutes']}"
        
    prompt += """
    
    Please analyze the difficulty and scope of these goals.
    Distribute the total available hours optimally across a typical 7-day week (Monday to Sunday).
    Allocate time blocks in minutes (e.g., 60, 90, 120) considering focus spans (like Pomodoro).
    
    Return the schedule strictly in the following JSON format without any markdown wrappers or extra text:
    [
      {
        "subject": "Name of the subject matching the goal",
        "day_of_week": "Monday",
        "start_time": "14:00",
        "end_time": "16:00",
        "duration_minutes": 120,
        "topic": "Specific sub-topic to cover in this session"
      },
      ...
    ]
    
    Make sure the total duration across all sessions approximately equals the total available hours.
    """
    
    try:
        response = model.generate_content(prompt)
        text = response.text
        # Clean up potential markdown formatting if the model still outputs it
        if text.startswith("```json"):
            text = text[7:-3].strip()
        elif text.startswith("```"):
            text = text[3:-3].strip()
            
        schedule_json = json.loads(text)
        return schedule_json
    except Exception as e:
        print(f"Error parsing Gemini response: {e}")
        return []

def generate_coaching_feedback(notes: str, missed_tasks: list) -> str:
    model = genai.GenerativeModel('gemini-3.5-flash')
    
    missed_str = ", ".join(missed_tasks) if missed_tasks else "None"
    
    prompt = f"""
    You are a highly empathetic and insightful AI Study Coach. The user is submitting their daily review.
    Their reflection notes: "{notes}"
    Goals they missed today: {missed_str}
    
    Please read the reflection notes carefully and follow these guidelines:
    1. Deeply analyze the user's emotional and physical state from their notes. If they express struggles (e.g., "I'm tired", "I woke up late", "I lost focus"), provide warm empathy and highly practical, tailored advice for their specific situation (e.g., refreshing tips for fatigue, morning routines for waking up late). Be flexible and context-aware.
    2. If the user asked any questions in their notes, you MUST answer them directly and helpfully.
    3. Provide actionable tips on how to better distribute their time or manage their focus tomorrow, especially if they missed goals.
    4. If they achieved everything or show a positive attitude, praise them enthusiastically and encourage them to keep up the good habits.
    
    Format your response in HTML (using <strong>, <br>, etc.) so it looks good on a web dashboard. Do not use markdown syntax, just raw HTML strings.
    Respond in a friendly, conversational tone in Korean if the user's notes are in Korean, otherwise English.
    """
    
    try:
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        print(f"Error generating coaching feedback: {e}")
        return "Could not generate coaching feedback at this time."

def reschedule_missed(missed_sessions: list, upcoming_free_blocks: list):
    """
    Logic for auto-rescheduling missed sessions.
    (This is a simplified version for demonstration)
    """
    model = genai.GenerativeModel('gemini-3.5-flash')
    
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
        response = model.generate_content(prompt)
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
    # Force reload env to pick up any new keys without restarting the server
    load_dotenv(override=True)
    genai.configure(api_key=os.environ.get("GEMINI_API_KEY", ""))
    
    model = genai.GenerativeModel('gemini-3.5-flash')
    
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
        if "429" in error_msg or "quota" in error_msg.lower():
            return "현재 사용량이 너무 많아 일시적으로 답변이 제한되었습니다. 잠시 후(약 1분) 다시 시도해 주세요. ⏳"
        return f"죄송합니다. 현재 AI 튜터가 질문에 답변할 수 없습니다. (일시적인 오류)"
