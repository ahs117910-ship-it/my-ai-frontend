const translations = {
    en: {
        // Sidebar
        "nav-dashboard": "📊 Dashboard",
        "nav-goals": "🎯 Set Goals",
        "nav-timer": "⏱️ Pomodoro",
        "nav-review": "📝 Daily Review",
        
        // Header
        "header-title": "Welcome back! 👋",
        "header-subtitle": "Let's make today productive.",
        
        // Goals
        "goals-title": "Set Your Weekly Goals",
        "add-goal-btn": "+ Add New Subject",
        "add-detail-btn": "+ Add Another Goal to this Subject",
        "hours-label": "How many hours can you study this week?",
        "generate-btn": "✨ Generate AI Schedule",
        "subject-placeholder": "Subject (e.g. C++)",
        "details-placeholder": "Details (e.g. Master Pointers)",
        
        // Dashboard
        "dash-title": "Your Weekly AI Schedule",
        "btn-reset-schedule": "Reset All",
        "dash-empty": "No schedule yet. Set your goals first!",
        
        // Timer
        "timer-title": "Pomodoro Timer",
        "btn-start": "Start",
        "btn-pause": "Pause",
        "btn-reset": "Reset",
        "mode-pomodoro": "Pomodoro",
        "mode-break": "Short Break",
        "session-complete": "Session Complete! How did it go?",
        "btn-fully": "Fully Achieved",
        "btn-partial": "Partially Achieved",
        "btn-not": "Not Achieved",
        
        // Review
        "review-stats-title": "Overall Progress Stats",
        "stat-label-total": "Total Sessions",
        "stat-label-completed": "Completed",
        "stat-label-rate": "Completion Rate",
        "review-form-title": "Submit Daily Review",
        "review-date-label": "Date:",
        "review-checklist-label": "Today's Tasks (Check what you completed):",
        "review-no-tasks": "No tasks found for today.",
        "review-calculated-rate": "Calculated Achievement Rate:",
        "review-notes-label": "Reflections / Notes:",
        "review-notes-placeholder": "How did today go? What could be improved?",
        "btn-submit-review": "Submit Review",
        "coaching-title": "✨ AI Study Coach Feedback",
        
        // JS Alerts
        "alert-gen-error": "There was an error generating the schedule. Please try again.",
        "alert-no-session": "No active session selected. Go back to Dashboard and click Start on a session.",
        "alert-session-marked": "Session marked as",
        "alert-review-success": "Daily review submitted successfully! Great job today!",
        "alert-review-fail": "Failed to submit review.",
        "alert-dummy-review": "[Dummy Mode] Daily review submitted successfully! Great job today!"
    },
    ko: {
        // Sidebar
        "nav-dashboard": "📊 대시보드",
        "nav-goals": "🎯 목표 설정",
        "nav-timer": "⏱️ 뽀모도로",
        "nav-review": "📝 일일 리뷰",
        
        // Header
        "header-title": "환영합니다! 👋",
        "header-subtitle": "오늘도 알찬 하루를 만들어봐요.",
        
        // Goals
        "goals-title": "주간 목표 설정",
        "add-goal-btn": "+ 새 과목 추가하기",
        "add-detail-btn": "+ 이 과목에 세부 목표 추가하기",
        "hours-label": "이번 주에 공부할 수 있는 시간은 총 몇 시간인가요?",
        "generate-btn": "✨ AI 스케줄 생성하기",
        "subject-placeholder": "과목명 (예: C++)",
        "details-placeholder": "세부 목표 (예: 포인터 마스터)",
        
        // Dashboard
        "dash-title": "이번 주 AI 추천 스케줄",
        "btn-reset-schedule": "전체 초기화",
        "dash-empty": "아직 스케줄이 없습니다. 먼저 목표를 설정해주세요!",
        
        // Timer
        "timer-title": "뽀모도로 타이머",
        "btn-start": "시작",
        "btn-pause": "일시정지",
        "btn-reset": "초기화",
        "mode-pomodoro": "집중 (25분)",
        "mode-break": "휴식 (5분)",
        "session-complete": "세션 종료! 달성도는 어떠셨나요?",
        "btn-fully": "완벽히 달성",
        "btn-partial": "절반 달성",
        "btn-not": "미달성",
        
        // Review
        "review-stats-title": "전체 진행 통계",
        "stat-label-total": "총 세션",
        "stat-label-completed": "완료",
        "stat-label-rate": "달성률",
        "review-form-title": "오늘 하루 리뷰하기",
        "review-date-label": "날짜:",
        "review-checklist-label": "오늘의 목표 (달성한 항목에 체크하세요):",
        "review-no-tasks": "오늘 배정된 스케줄이 없습니다.",
        "review-calculated-rate": "자동 계산된 달성률:",
        "review-notes-label": "소감 및 피드백:",
        "review-notes-placeholder": "오늘 공부는 어땠나요? 개선할 점이 있나요?",
        "btn-submit-review": "리뷰 제출하기",
        "coaching-title": "✨ AI 학습 코칭 피드백",
        
        // JS Alerts
        "alert-gen-error": "스케줄을 생성하는 중 오류가 발생했습니다. 다시 시도해주세요.",
        "alert-no-session": "선택된 세션이 없습니다. 대시보드에서 세션의 시작 버튼을 눌러주세요.",
        "alert-session-marked": "세션 상태가 업데이트 되었습니다:",
        "alert-review-success": "일일 리뷰가 제출되었습니다! 오늘 하루도 수고하셨습니다!",
        "alert-review-fail": "리뷰 제출에 실패했습니다.",
        "alert-dummy-review": "[더미 모드] 일일 리뷰가 성공적으로 제출되었습니다! 수고하셨습니다!"
    }
};

function setLanguage(lang) {
    const t = translations[lang];
    if(!t) return;
    
    // Save preference
    localStorage.setItem('preferredLang', lang);
    
    // Make texts available globally for JS alerts
    window.i18n = t;

    // Update DOM texts by data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (t[key]) {
            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                el.placeholder = t[key];
            } else {
                // If it's a node with children, we might overwrite icons.
                // In our HTML, we will put data-i18n on a span specifically for the text to protect icons.
                el.textContent = t[key];
            }
        }
    });
}

// Init Language on Load
document.addEventListener('DOMContentLoaded', () => {
    const savedLang = localStorage.getItem('preferredLang') || 'en';
    
    // Set dropdown value if exists
    const langSelect = document.getElementById('lang-select');
    if(langSelect) {
        langSelect.value = savedLang;
        langSelect.addEventListener('change', (e) => {
            setLanguage(e.target.value);
        });
    }
    
    setLanguage(savedLang);
});
