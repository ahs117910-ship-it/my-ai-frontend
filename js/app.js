const API_BASE_URL = 'https://ai-syudy-planner.onrender.com';

// Custom UI Toast Notification Library
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    
    let icon = 'fa-info-circle';
    let borderStyle = 'border-neon-indigo/30';
    let shadowStyle = 'shadow-neon-indigo/15';
    let iconColor = 'text-neon-indigo';
    
    if (type === 'success') {
        icon = 'fa-circle-check';
        borderStyle = 'border-neon-emerald/30';
        shadowStyle = 'shadow-neon-emerald/15';
        iconColor = 'text-neon-emerald';
    } else if (type === 'error') {
        icon = 'fa-triangle-exclamation';
        borderStyle = 'border-neon-rose/30';
        shadowStyle = 'shadow-neon-rose/15';
        iconColor = 'text-neon-rose';
    } else if (type === 'warning') {
        icon = 'fa-triangle-exclamation';
        borderStyle = 'border-neon-violet/30';
        shadowStyle = 'shadow-neon-violet/15';
        iconColor = 'text-neon-violet';
    }

    toast.className = `glass-panel px-4 py-3.5 rounded-2xl border ${borderStyle} ${shadowStyle} shadow-lg flex items-center gap-3.5 max-w-sm pointer-events-auto transition-all duration-500 transform translate-x-12 opacity-0`;
    toast.innerHTML = `
        <div class="text-md ${iconColor}">
            <i class="fa-solid ${icon}"></i>
        </div>
        <div class="text-[11px] text-slate-200 font-semibold tracking-wide leading-normal">
            ${message}
        </div>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => { toast.classList.remove('translate-x-12', 'opacity-0'); }, 10);
    setTimeout(() => {
        toast.classList.add('translate-x-12', 'opacity-0');
        setTimeout(() => toast.remove(), 500);
    }, 3500);
}

function updateHoursDisplay(value) {
    document.getElementById('hours-display').innerText = `${value} 시간`;
}

// Subjects & Goals Management
let subjects = [];

function renderSubjects() {
    const listDiv = document.getElementById('subject-list');
    listDiv.innerHTML = '';
    
    if (subjects.length === 0) {
        listDiv.innerHTML = `
            <div class="text-center py-6 text-slate-500 text-xs font-medium border border-dashed border-white/5 rounded-xl">
                추가된 과목이 없습니다. 과목을 추가해 주세요!
            </div>
        `;
        return;
    }

    subjects.forEach((sub, idx) => {
        const subCard = document.createElement('div');
        subCard.className = "bg-dark-900/40 p-4 rounded-xl border border-white/5 flex justify-between items-start glass-panel-interactive mb-3";
        
        let goalsHtml = '';
        sub.goals.forEach(g => {
            if (g.trim()) goalsHtml += `<li class="flex items-center gap-2"><span class="w-1 h-1 rounded-full bg-neon-violet"></span>${g}</li>`;
        });

        subCard.innerHTML = `
            <div class="flex-grow pr-3">
                <h4 class="text-xs font-bold text-neon-violet font-tech tracking-wider">${sub.name}</h4>
                <ul class="text-[10px] text-slate-400 mt-2 space-y-1.5 font-medium">
                    ${goalsHtml}
                </ul>
            </div>
            <button onclick="removeSubject(${idx})" class="text-slate-500 hover:text-neon-rose hover:scale-110 transition-all p-1.5 rounded-lg hover:bg-neon-rose/10">
                <i class="fa-solid fa-trash-can text-xs"></i>
            </button>
        `;
        listDiv.appendChild(subCard);
    });
}

window.addSubject = function() {
    const nameInput = document.getElementById('subject-name');
    const goalInputs = document.querySelectorAll('.sub-goal');
    
    if (!nameInput.value.trim()) {
        showToast('과목명을 입력해 주세요!', 'warning');
        return;
    }

    const goals = [];
    goalInputs.forEach(input => {
        if(input.value.trim()) goals.push(input.value.trim());
    });

    if (goals.length === 0) {
        showToast('최소 1개 이상의 세부 목표를 작성해야 합니다.', 'warning');
        return;
    }

    subjects.push({ name: nameInput.value.trim(), goals: goals });

    nameInput.value = '';
    goalInputs.forEach(input => input.value = '');
    
    renderSubjects();
    showToast('과목 및 목표 리스트가 정상 등록되었습니다.', 'success');
}

window.removeSubject = function(idx) {
    subjects.splice(idx, 1);
    renderSubjects();
    showToast('과목이 정상 삭제되었습니다.', 'info');
}

// Generate Schedule API Call
window.triggerGenerateSchedule = async function() {
    if (subjects.length === 0) {
        showToast('최소 한 개 이상의 과목을 등록해 주세요.', 'error');
        return;
    }

    const placeholder = document.getElementById('placeholder-state');
    const loader = document.getElementById('loader-state');
    const grid = document.getElementById('calendar-grid');
    const spinner = document.getElementById('spinner');
    const magicIcon = document.getElementById('magic-icon');

    if(placeholder) placeholder.classList.add('hidden');
    grid.classList.add('hidden');
    loader.classList.remove('hidden');
    spinner.classList.remove('hidden');
    magicIcon.classList.add('hidden');

    // Prepare payload
    const totalHours = parseInt(document.getElementById('hours').value) || 24;
    const goalsPayload = [];
    
    // Distribute hours evenly for now as approximation, or use default
    const hoursPerGoal = (totalHours * 60) / (subjects.reduce((acc, sub) => acc + sub.goals.length, 0) || 1);
    
    subjects.forEach(sub => {
        sub.goals.forEach(g => {
            goalsPayload.push({
                subject: sub.name,
                description: g,
                duration_minutes: Math.round(hoursPerGoal)
            });
        });
    });

    try {
        const response = await fetch(`${API_BASE_URL}/generate_schedule/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ goals: goalsPayload })
        });
        
        if (!response.ok) throw new Error('Failed to generate schedule');
        
        const scheduleData = await response.json();
        
        loader.classList.add('hidden');
        grid.classList.remove('hidden');
        spinner.classList.add('hidden');
        magicIcon.classList.remove('hidden');
        showToast('Gemini 최적화 시간표가 성공적으로 빌드되었습니다.', 'success');
        
        renderScheduleToGrid(scheduleData);
        updateProgressUI(scheduleData);
    } catch (error) {
        console.error(error);
        loader.classList.add('hidden');
        spinner.classList.add('hidden');
        magicIcon.classList.remove('hidden');
        showToast('서버 연결 실패. 배포 설정을 확인해 주세요.', 'error');
    }
}

// Map english days to korean for beautiful UI
const dayMap = {
    'Monday': '월요일', 'Tuesday': '화요일', 'Wednesday': '수요일',
    'Thursday': '목요일', 'Friday': '금요일', 'Saturday': '토요일', 'Sunday': '일요일'
};
const colorClasses = ['neon-violet', 'neon-indigo', 'neon-rose', 'neon-cyan', 'neon-emerald'];

function renderScheduleToGrid(scheduleData) {
    const grid = document.getElementById('calendar-grid');
    if (!grid) return;
    
    if (!scheduleData || scheduleData.length === 0) {
        grid.innerHTML = '<div class="text-center p-8">No schedule data available.</div>';
        return;
    }

    // Group by day
    const grouped = {};
    scheduleData.forEach(item => {
        if (!grouped[item.day_of_week]) grouped[item.day_of_week] = [];
        grouped[item.day_of_week].push(item);
    });

    const order = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const sortedDays = Object.keys(grouped).sort((a, b) => order.indexOf(a) - order.indexOf(b));

    let html = '<div class="grid grid-cols-1 md:grid-cols-5 gap-4">';
    
    sortedDays.forEach((day, index) => {
        const color = colorClasses[index % colorClasses.length];
        const dayItems = grouped[day];
        dayItems.sort((a, b) => a.start_time.localeCompare(b.start_time));
        
        let totalMins = dayItems.reduce((acc, curr) => acc + curr.duration_minutes, 0);
        let hours = (totalMins / 60).toFixed(1);

        html += `
        <div class="bg-dark-900/20 border border-white/5 p-4 rounded-2xl flex flex-col min-h-[350px] relative">
            <div class="absolute top-0 left-0 w-full h-[2px] bg-${color} rounded-full"></div>
            <span class="text-xs font-bold text-slate-300 block pb-3 border-b border-white/5 mb-4 text-center font-tech">${dayMap[day] || day} <span class="text-[10px] font-normal block text-${color} mt-0.5">${hours}h Study</span></span>
            <div class="space-y-3 flex-grow">
        `;

        dayItems.forEach(item => {
            const isCompleted = item.progress === 'completed';
            const borderOpa = isCompleted ? '30' : '20';
            const bgOpa = isCompleted ? '20' : '5';
            const checkIcon = isCompleted ? '<i class="fa-solid fa-check text-neon-emerald ml-1"></i>' : '';
            
            html += `
                <div onclick="startSession(${item.id}, ${item.duration_minutes}, '${item.topic}')" class="p-3 bg-${color}/${bgOpa} border border-${color}/${borderOpa} rounded-xl glass-panel-interactive cursor-pointer relative overflow-hidden group">
                    <div class="w-1 h-8 bg-${color} absolute left-0 top-1/2 -translate-y-1/2 rounded-r-md"></div>
                    <span class="text-[9px] uppercase font-bold tracking-wider text-${color} font-tech">${item.subject}</span>
                    <p class="text-xs font-bold mt-1 text-slate-200 group-hover:text-white transition-colors">${item.topic} ${checkIcon}</p>
                    <span class="text-[9px] block text-slate-400 mt-2.5 flex justify-between">
                        <span><i class="fa-regular fa-clock mr-1"></i> ${item.start_time}-${item.end_time}</span>
                        <span class="text-${color}">Start ▶</span>
                    </span>
                </div>
            `;
        });

        html += `</div></div>`;
    });

    html += '</div>'; // End grid
    
    // Feedback Panel
    html += `
    <div class="p-4 md:p-5 bg-dark-900/60 rounded-2xl border border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-6">
        <div class="flex items-center gap-3.5">
            <div class="w-10 h-10 rounded-xl bg-neon-violet/10 flex items-center justify-center text-neon-violet text-md border border-neon-violet/20 shadow-neon-violet/5">
                <i class="fa-solid fa-wand-magic"></i>
            </div>
            <div>
                <h4 class="text-xs font-bold text-slate-200">AI 피드백 및 스케줄 최적화 완료</h4>
                <p class="text-[10px] text-slate-400 mt-0.5 leading-relaxed">학습의 연속성을 해치지 않도록 일일 학습시간을 설정하고 분배했습니다.</p>
            </div>
        </div>
        <button onclick="showToast('동기화 완료', 'info')" class="w-full sm:w-auto px-4 py-2 bg-white/5 hover:bg-white/10 text-[11px] text-slate-300 font-bold rounded-xl border border-white/10 transition-colors">데이터 리로드</button>
    </div>
    `;

    grid.innerHTML = html;
}

// Fetch Existing Schedules on Load
async function loadSchedules() {
    try {
        const res = await fetch(`${API_BASE_URL}/schedules/`);
        if (res.ok) {
            const data = await res.json();
            if (data.length > 0) {
                const placeholder = document.getElementById('placeholder-state');
                const grid = document.getElementById('calendar-grid');
                if(placeholder) placeholder.classList.add('hidden');
                if(grid) {
                    grid.classList.remove('hidden');
                    renderScheduleToGrid(data);
                    updateProgressUI(data);
                }
            }
        }
    } catch(e) {
        console.warn('Could not fetch initial schedules');
    }
}

function updateProgressUI(data) {
    const total = data.length;
    const completed = data.filter(d => d.progress === 'completed').length;
    const rate = total === 0 ? 0 : Math.round((completed / total) * 100);
    
    document.getElementById('stat-rate').innerHTML = `${rate}% <span class="text-xs text-neon-emerald font-semibold ml-1 flex items-center gap-0.5"><i class="fa-solid fa-bolt"></i> 진행중</span>`;
    document.getElementById('stat-progress-bar').style.width = `${rate}%`;
}


// POMODORO TIMER LOGIC
let timer;
let isRunning = false;
let timeLeft = 25 * 60; // default 25 min
let maxTime = 25 * 60;
window.activeSessionId = null;

const timerDisplay = document.getElementById('timer-display');
const timerBtn = document.getElementById('timer-btn');
const timerProgress = document.getElementById('timer-progress');

window.updateTimerDisplay = function() {
    if(!timerDisplay) return;
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    timerDisplay.innerText = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    const strokeDashoffset = 402 - (timeLeft / maxTime) * 402;
    if(timerProgress) timerProgress.setAttribute('stroke-dashoffset', strokeDashoffset);
}

window.startSession = function(id, duration, topic) {
    window.activeSessionId = id;
    // Set timer to the scheduled duration (or cap at 60 mins for focus)
    maxTime = Math.min(duration * 60, 60 * 60);
    timeLeft = maxTime;
    updateTimerDisplay();
    showToast(`"${topic}" 세션을 시작합니다! 위 타이머의 시작 버튼을 누르세요.`, 'info');
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

window.toggleTimer = function() {
    if (isRunning) {
        clearInterval(timer);
        timerBtn.innerText = "계속";
        timerBtn.className = "flex-1 py-2.5 bg-gradient-to-r from-neon-indigo to-neon-cyan text-xs font-bold rounded-xl transition-all duration-300 shadow-neon-cyan/20";
        isRunning = false;
        showToast('타이머가 일시 정지되었습니다.', 'info');
    } else {
        isRunning = true;
        timerBtn.innerText = "일시정지";
        timerBtn.className = "flex-1 py-2.5 bg-gradient-to-r from-neon-rose to-orange-500 text-xs font-bold rounded-xl transition-all duration-300 shadow-neon-rose/20";
        showToast('집중 세션이 시작되었습니다. 파이팅!', 'success');
        
        timer = setInterval(() => {
            if (timeLeft > 0) {
                timeLeft--;
                updateTimerDisplay();
            } else {
                clearInterval(timer);
                showToast('세션 종료! 데이터 동기화 중...', 'success');
                resetTimer();
                markSessionComplete();
            }
        }, 1000);
    }
}

window.resetTimer = function() {
    clearInterval(timer);
    isRunning = false;
    timeLeft = maxTime;
    if(timerBtn) {
        timerBtn.innerText = "시작";
        timerBtn.className = "flex-1 py-2.5 bg-gradient-to-r from-neon-violet to-neon-indigo text-xs font-bold rounded-xl transition-all duration-300 shadow-neon-violet/20";
    }
    updateTimerDisplay();
}

async function markSessionComplete() {
    if (!window.activeSessionId) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/schedules/${window.activeSessionId}/progress?progress=completed`, {
            method: 'PUT'
        });
        if (response.ok) {
            showToast('목표 달성이 서버에 기록되었습니다!', 'success');
            loadSchedules(); // Reload UI
        }
    } catch(e) {
        console.error(e);
    }
}

// Initial load
window.onload = function() {
    renderSubjects();
    updateTimerDisplay();
    loadSchedules();
}
