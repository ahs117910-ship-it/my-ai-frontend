# AI Study Planner & Tracker (AuraPlanner)

AI(Gemini)를 활용하여 목표를 설정하고, 자동으로 스케줄을 짜주며, 뽀모도로 타이머와 AI 튜터, 데일리 리뷰를 제공하는 통합 학습 관리 서비스입니다.

## 기능
- **목표 설정**: 과목과 세부 주제, 필요 학습 시간을 설정합니다.
- **AI 스케줄러**: 목표와 가용 시간을 분석하여 자동으로 주간 일정표를 생성합니다.
- **뽀모도로 타이머**: 학습과 짧은 휴식을 반복할 수 있도록 도와줍니다.
- **데일리 리뷰 & 코칭**: 오늘 달성한 태스크를 점검하고 감정을 회고하면, AI가 맞춤형 코칭 피드백을 제공합니다.
- **AI 튜터**: 학습 중 모르는 것을 언제든 물어볼 수 있습니다.

## 기술 스택
- **Frontend**: HTML5, Vanilla CSS, Vanilla JavaScript
- **Backend**: FastAPI (Python), SQLAlchemy, SQLite
- **AI**: Google Generative AI (Gemini API)

## 설치 및 실행 방법

### 1. 백엔드 설정
1. `backend` 폴더로 이동합니다.
   ```bash
   cd backend
   ```
2. 패키지를 설치합니다.
   ```bash
   pip install -r requirements.txt
   ```
3. 환경 변수를 설정합니다.
   - `backend` 디렉토리에 `.env` 파일을 생성합니다.
   - 아래와 같이 Gemini API 키를 입력합니다.
     ```
     GEMINI_API_KEY=your_api_key_here
     ```
4. 서버를 실행합니다.
   ```bash
   uvicorn main:app --reload
   ```

### 2. 프론트엔드 접속
백엔드 서버가 프론트엔드 파일들을 정적으로 서빙하도록 설정되어 있습니다.
브라우저를 열고 `http://127.0.0.1:8000/` 에 접속하면 프로젝트를 확인할 수 있습니다!
