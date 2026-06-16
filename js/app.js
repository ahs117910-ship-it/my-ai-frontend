const API_BASE_URL = 'https://ai-syudy-planner.onrender.com';

// --- Local Storage Helpers ---
function saveScheduleLocal(schedule) {
    localStorage.setItem('auraSchedule', JSON.stringify(schedule));
}
function loadScheduleLocal() {
    const data = localStorage.getItem('auraSchedule');
    return data ? JSON.parse(data) : null;
}

// --- Navigation ---
const navItems = document.querySelectorAll('.nav-item');
const views = document.querySelectorAll('.view');

navItems.forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Update active nav
        navItems.forEach(nav => nav.classList.remove('active'));
        item.classList.add('active');
        
        // Show target view
        const targetId = item.getAttribute('data-target');
        views.forEach(view => {
            if (view.id === targetId) {
                view.classList.remove('hidden');
            } else {
                view.classList.add('hidden');
            }
        });
    });
});

// --- Goal Form Management ---
const goalsList = document.getElementById('goals-list');
const addGoalBtn = document.getElementById('add-goal-btn');
const goalForm = document.getElementById('goal-form');
const loadingOverlay = document.getElementById('loading-overlay');

function attachAddDetailListener(btn) {
    btn.addEventListener('click', (e) => {
        const detailsList = e.target.previousElementSibling;
        
        const div = document.createElement('div');
        div.className = 'detail-item';
        div.style.display = 'flex';
        div.style.gap = '8px';
        div.style.marginBottom = '0.5rem';
        div.style.alignItems = 'center';
        
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'input-field desc-input';
        input.required = true;
        input.placeholder = window.i18n ? window.i18n['details-placeholder'] : 'Details (e.g. Master Pointers)';
        input.setAttribute('data-i18n', 'details-placeholder');
        input.style.flex = '1';
        
        const timeContainer = document.createElement('div');
        timeContainer.style.display = 'flex';
        timeContainer.style.alignItems = 'center';
        timeContainer.style.gap = '4px';

        const hoursInput = document.createElement('input');
        hoursInput.type = 'number';
        hoursInput.className = 'input-field hours-input';
        hoursInput.required = true;
        hoursInput.min = '0';
        hoursInput.max = '168';
        hoursInput.value = '2';
        hoursInput.placeholder = 'h';
        hoursInput.style.width = '60px';
        hoursInput.style.paddingRight = '5px';

        const hoursLabel = document.createElement('span');
        hoursLabel.textContent = 'h';
        hoursLabel.style.color = 'var(--text-secondary)';
        hoursLabel.style.fontSize = '0.9rem';

        const minsInput = document.createElement('input');
        minsInput.type = 'number';
        minsInput.className = 'input-field mins-input';
        minsInput.required = true;
        minsInput.min = '0';
        minsInput.max = '59';
        minsInput.value = '0';
        minsInput.placeholder = 'm';
        minsInput.style.width = '60px';
        minsInput.style.paddingRight = '5px';

        const minsLabel = document.createElement('span');
        minsLabel.textContent = 'm';
        minsLabel.style.color = 'var(--text-secondary)';
        minsLabel.style.fontSize = '0.9rem';

        timeContainer.appendChild(hoursInput);
        timeContainer.appendChild(hoursLabel);
        timeContainer.appendChild(minsInput);
        timeContainer.appendChild(minsLabel);
        
        const delBtn = document.createElement('button');
        delBtn.type = 'button';
        delBtn.className = 'btn-delete-detail';
        delBtn.innerHTML = '×';
        delBtn.title = 'Delete Goal';
        delBtn.style.cssText = 'background: transparent; border: none; color: var(--danger-color); cursor: pointer; font-size: 1.2rem; padding: 0 5px;';
        
        delBtn.addEventListener('click', () => {
            div.remove();
        });
        
        div.appendChild(input);
        div.appendChild(timeContainer);
        div.appendChild(delBtn);
        detailsList.appendChild(div);
    });
}

// Attach listener to initial add-detail button
document.querySelectorAll('.add-detail-btn').forEach(attachAddDetailListener);

// Attach listener to initial delete buttons
document.querySelectorAll('.btn-delete-detail').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.target.closest('.detail-item').remove();
    });
});
document.querySelectorAll('.btn-delete-subject').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.target.closest('.subject-group').remove();
    });
});

addGoalBtn.addEventListener('click', () => {
    const newGroup = document.createElement('div');
    newGroup.className = 'subject-group';
    newGroup.style.background = 'rgba(15,23,42,0.3)';
    newGroup.style.border = '1px solid var(--border-color)';
    newGroup.style.padding = '1rem';
    newGroup.style.borderRadius = 'var(--radius-md)';
    newGroup.style.marginBottom = '1rem';
    
    const subjectPlaceholder = window.i18n ? window.i18n['subject-placeholder'] : 'Subject (e.g. C++)';
    const detailsPlaceholder = window.i18n ? window.i18n['details-placeholder'] : 'Details (e.g. Master Pointers)';
    const addDetailText = window.i18n ? window.i18n['add-detail-btn'] : '+ Add Another Goal to this Subject';
    
    newGroup.innerHTML = `
        <button type="button" class="btn-delete-subject" style="position: absolute; top: 10px; right: 10px; background: transparent; border: none; color: var(--text-secondary); cursor: pointer; font-size: 1.2rem;" title="Delete Subject">×</button>
        <input type="text" data-i18n="subject-placeholder" placeholder="${subjectPlaceholder}" class="input-field subject-input" required style="margin-bottom: 0.5rem; font-weight: 600; background: rgba(0,0,0,0.2); width: calc(100% - 30px);">
        <div class="details-list">
            <div class="detail-item" style="display: flex; gap: 8px; margin-bottom: 0.5rem; align-items: center;">
                <input type="text" data-i18n="details-placeholder" placeholder="${detailsPlaceholder}" class="input-field desc-input" required style="flex: 1;">
                <div style="display: flex; align-items: center; gap: 4px;">
                    <input type="number" placeholder="h" class="input-field hours-input" min="0" max="168" value="2" required style="width: 60px; padding-right: 5px;">
                    <span style="color: var(--text-secondary); font-size: 0.9rem;">h</span>
                    <input type="number" placeholder="m" class="input-field mins-input" min="0" max="59" value="0" required style="width: 60px; padding-right: 5px;">
                    <span style="color: var(--text-secondary); font-size: 0.9rem;">m</span>
                </div>
                <button type="button" class="btn-delete-detail" style="background: transparent; border: none; color: var(--danger-color); cursor: pointer; font-size: 1.2rem; padding: 0 5px;" title="Delete Goal">×</button>
            </div>
        </div>
        <button type="button" class="btn btn-text add-detail-btn" data-i18n="add-detail-btn" style="padding: 5px 10px; font-size: 0.85rem;">${addDetailText}</button>
    `;
    goalsList.appendChild(newGroup);
    
    // Attach listeners
    attachAddDetailListener(newGroup.querySelector('.add-detail-btn'));
    
    newGroup.querySelector('.btn-delete-subject').addEventListener('click', (e) => {
        e.target.closest('.subject-group').remove();
    });
    
    newGroup.querySelector('.btn-delete-detail').addEventListener('click', (e) => {
        e.target.closest('.detail-item').remove();
    });
});

goalForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Collect data
    const subjectGroups = document.querySelectorAll('.subject-group');
    
    const goals = [];
    subjectGroups.forEach(group => {
        const subjectValue = group.querySelector('.subject-input').value;
        const detailsItems = group.querySelectorAll('.detail-item');
        
        detailsItems.forEach(item => {
            const descInput = item.querySelector('.desc-input');
            const hoursInput = item.querySelector('.hours-input');
            const minsInput = item.querySelector('.mins-input');
            if (descInput && descInput.value.trim() !== '') {
                const hours = parseInt(hoursInput.value) || 0;
                const mins = parseInt(minsInput.value) || 0;
                goals.push({
                    subject: subjectValue,
                    description: descInput.value,
                    duration_minutes: hours * 60 + mins
                });
            }
        });
    });
    
    const payload = {
        goals: goals
    };
    
    // Show loading
    loadingOverlay.classList.remove('hidden');
    
    try {
        const response = await fetch(`${API_BASE_URL}/generate_schedule/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        
        if (!response.ok) {
            throw new Error('Failed to generate schedule');
        }
        
        const scheduleData = await response.json();
        renderSchedule(scheduleData);
        
        // Switch to dashboard view
        document.querySelector('[data-target="dashboard-view"]').click();
        
        
    } catch (error) {
        console.warn('Backend API unavailable. Using dummy data for testing.', error);
        // Note: We could show an alert here, but since it's dummy mode, we proceed silently or we could do:
        // alert(window.i18n ? window.i18n['alert-gen-error'] : 'There was an error...');
        
        // Dummy data fallback
        const dummySchedule = [];
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
        let dayIdx = 0;
        
        goals.forEach((goal, i) => {
            dummySchedule.push({
                id: i + 1,
                goal_id: i + 1,
                day_of_week: days[dayIdx % 5],
                start_time: '14:00',
                end_time: '16:00',
                duration_minutes: 120,
                subject: goal.subject,
                topic: goal.description || 'General Study',
                progress: 'pending',
                completed: false
            });
            dayIdx++;
        });
        
        renderSchedule(dummySchedule);
        saveScheduleLocal(dummySchedule);
        document.querySelector('[data-target="dashboard-view"]').click();
        
    } finally {
        loadingOverlay.classList.add('hidden');
    }
});

// --- Schedule Rendering ---
let currentSchedule = [];

const scheduleResetBtn = document.getElementById('reset-schedule-btn');
if (scheduleResetBtn) {
    scheduleResetBtn.addEventListener('click', async () => {
        const confirmMsg = window.i18n ? (localStorage.getItem('preferredLang') === 'ko' ? '정말 모든 스케줄과 데이터를 초기화하시겠습니까?' : 'Are you sure you want to reset all schedules and data?') : 'Are you sure?';
        if (confirm(confirmMsg)) {
            localStorage.removeItem('auraSchedule');
            currentSchedule = [];
            
            // Optionally tell backend to delete if needed
            try {
                await fetch(`${API_BASE_URL}/schedules/`, { method: 'DELETE' });
            } catch (e) {
                // Ignore if dummy mode
            }
            
            renderSchedule([]);
            fetchStats(); // Update review stats to 0
        }
    });
}

function renderSchedule(scheduleData) {
    currentSchedule = scheduleData;
    populateGoalForm(scheduleData);
    
    const daysTabs = document.getElementById('days-tabs');
    const timeline = document.getElementById('schedule-timeline');
    
    // Get unique days
    const days = [...new Set(scheduleData.map(item => item.day_of_week))];
    
    // Render Tabs
    daysTabs.innerHTML = '';
    days.forEach((day, index) => {
        const tab = document.createElement('div');
        tab.className = `day-tab ${index === 0 ? 'active' : ''}`;
        tab.textContent = day;
        tab.addEventListener('click', () => {
            document.querySelectorAll('.day-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            renderTimelineForDay(day);
        });
        daysTabs.appendChild(tab);
    });
    
    // Render first day
    if (days.length > 0) {
        renderTimelineForDay(days[0]);
    } else {
        timeline.innerHTML = '<div class="empty-state">No schedule items generated.</div>';
    }
}

function renderTimelineForDay(day) {
    const timeline = document.getElementById('schedule-timeline');
    timeline.innerHTML = '';
    
    const dayItems = currentSchedule.filter(item => item.day_of_week === day);
    
    // Sort by start time (simple string sort works for HH:MM)
    dayItems.sort((a, b) => a.start_time.localeCompare(b.start_time));
    
    dayItems.forEach(item => {
        const el = document.createElement('div');
        el.className = 'schedule-item';
        
        // Add visual indicator for completed/missed
        if (item.progress === 'completed') el.style.borderLeftColor = 'var(--success-color)';
        if (item.progress === 'missed') el.style.borderLeftColor = 'var(--danger-color)';
        if (item.progress === 'partial') el.style.borderLeftColor = 'var(--warning-color)';
        
        el.innerHTML = `
            <div class="time-block">
                <span>${item.start_time} - ${item.end_time}</span>
                <span class="duration">${item.duration_minutes} min</span>
            </div>
            <div class="content-block">
                <h4>${item.subject || 'Study Session'}</h4>
                <p>${item.topic}</p>
            </div>
            <button class="btn btn-text btn-start-session" data-duration="${item.duration_minutes}" data-id="${item.id}">
                ▶ Start
            </button>
        `;
        
        // Attach event listener for starting this specific session in the timer
        const startBtn = el.querySelector('.btn-start-session');
        startBtn.addEventListener('click', () => {
            // Jump to timer view
            document.querySelector('[data-target="timer-view"]').click();
            // Set timer duration (assuming we want to start a session matching duration, or just standard pomodoro)
            // For now, let's just stick to the standard Pomodoro, but we save the active schedule ID
            window.activeScheduleId = item.id;
        });
        
        timeline.appendChild(el);
    });
}

// --- Progress Tracking (Integration with Timer) ---
const progressButtons = document.querySelectorAll('.progress-actions .btn');

progressButtons.forEach(btn => {
    btn.addEventListener('click', async (e) => {
        const status = e.target.getAttribute('data-status'); // completed, partial, missed
        const scheduleId = window.activeScheduleId;
        
        if (!scheduleId) {
            alert(window.i18n ? window.i18n['alert-no-session'] : 'No active session selected. Go back to Dashboard and click Start on a session.');
            return;
        }
        
        try {
            const response = await fetch(`${API_BASE_URL}/schedules/${scheduleId}/progress?progress=${status}`, {
                method: 'PUT'
            });
            
            if (response.ok) {
                // Update local copy too
                const target = currentSchedule.find(s => s.id == scheduleId);
                if(target) {
                    target.progress = status;
                    target.completed = (status === 'completed');
                    saveScheduleLocal(currentSchedule);
                }
                
                document.getElementById('progress-tracking').classList.add('hidden');
                const msg = window.i18n ? window.i18n['alert-session-marked'] : 'Session marked as';
                alert(`${msg} ${status}!`);
                fetchSchedules();
            } else {
                throw new Error("Backend error");
            }
            
        } catch (error) {
            console.warn('Backend unavailable. Simulating progress tracking locally.');
            // Update local schedule progress
            const target = currentSchedule.find(s => s.id == scheduleId);
            if (target) {
                 target.progress = status;
                 target.completed = (status === 'completed');
                 saveScheduleLocal(currentSchedule);
            }
            
            document.getElementById('progress-tracking').classList.add('hidden');
            const msg = window.i18n ? window.i18n['alert-session-marked'] : 'Session marked as';
            alert(`${msg} ${status}!`);
            
            fetchSchedules();
        }
    });
});

async function fetchSchedules() {
    const local = loadScheduleLocal();
    if (local && local.length > 0) {
        renderSchedule(local);
        return;
    }
    try {
        const res = await fetch(`${API_BASE_URL}/schedules/`);
        if (res.ok) {
            const data = await res.json();
            if (data.length > 0) {
                renderSchedule(data);
                saveScheduleLocal(data);
            }
        } else {
            throw new Error("Backend not responding");
        }
    } catch (e) {
        console.log('Using dummy schedules because backend is unavailable.');
        // Initial empty state or dummy state
    }
}

// Initial fetch attempt
fetchSchedules();
fetchStats();

// --- Daily Review Logic ---
const reviewForm = document.getElementById('review-form');
const statTotal = document.getElementById('stat-total');
const statCompleted = document.getElementById('stat-completed');
const statRate = document.getElementById('stat-rate');

async function fetchStats() {
    const local = loadScheduleLocal();
    if (local) {
        const total = local.length;
        const comp = local.filter(s => s.progress === 'completed').length;
        const rate = total > 0 ? (comp / total) * 100 : 0;
        
        statTotal.textContent = total;
        statCompleted.textContent = comp;
        statRate.textContent = `${rate.toFixed(1)}%`;
        return;
    }

    try {
        const res = await fetch(`${API_BASE_URL}/stats/`);
        if (res.ok) {
            const data = await res.json();
            statTotal.textContent = data.total_sessions;
            statCompleted.textContent = data.completed_sessions;
            statRate.textContent = `${data.overall_completion_rate.toFixed(1)}%`;
        } else {
            throw new Error("Backend not responding");
        }
    } catch (e) {
        console.log('Using dummy stats because backend is unavailable.');
        statTotal.textContent = "0";
        statCompleted.textContent = "0";
        statRate.textContent = "0.0%";
    }
}

// Fetch stats whenever we navigate to the review view
navItems.forEach(item => {
    item.addEventListener('click', (e) => {
        if (item.getAttribute('data-target') === 'review-view') {
            fetchStats();
            // Set today's date automatically
            const dateInput = document.getElementById('review-date');
            dateInput.valueAsDate = new Date();
            renderReviewTasks(dateInput.value);
        }
    });
});

const reviewDateInput = document.getElementById('review-date');
if (reviewDateInput) {
    reviewDateInput.addEventListener('change', (e) => {
        renderReviewTasks(e.target.value);
    });
}

function renderReviewTasks(dateStr) {
    const taskList = document.getElementById('review-task-list');
    const rateDisplay = document.getElementById('auto-achievement-rate');
    
    if (!dateStr || !currentSchedule || currentSchedule.length === 0) {
        taskList.innerHTML = `<div class="empty-state">${window.i18n ? window.i18n['review-no-tasks'] : 'No tasks found.'}</div>`;
        rateDisplay.textContent = '0%';
        window.currentCalculatedRate = 0;
        return;
    }
    
    // Map JS getDay() to string days
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const d = new Date(dateStr);
    const dayOfWeek = dayNames[d.getDay()];
    
    const todaysTasks = currentSchedule.filter(t => t.day_of_week === dayOfWeek);
    
    if (todaysTasks.length === 0) {
        taskList.innerHTML = `<div class="empty-state">${window.i18n ? window.i18n['review-no-tasks'] : 'No tasks found.'}</div>`;
        rateDisplay.textContent = '0%';
        window.currentCalculatedRate = 0;
        return;
    }
    
    taskList.innerHTML = '';
    todaysTasks.forEach((task, idx) => {
        const div = document.createElement('div');
        div.style.display = 'flex';
        div.style.alignItems = 'center';
        div.style.gap = '10px';
        div.style.marginBottom = '8px';
        
        const isChecked = task.progress === 'completed';
        
        div.innerHTML = `
            <input type="checkbox" id="chk-${task.id}" class="task-checkbox" ${isChecked ? 'checked' : ''} style="width:18px; height:18px; cursor:pointer;">
            <label for="chk-${task.id}" style="cursor:pointer; color:var(--text-primary);">
                <strong>${task.subject || 'Task'}</strong>: ${task.topic} (${task.duration_minutes}m)
            </label>
        `;
        taskList.appendChild(div);
    });
    
    updateCalculatedRate();
    
    // Add listeners to checkboxes
    document.querySelectorAll('.task-checkbox').forEach(chk => {
        chk.addEventListener('change', updateCalculatedRate);
    });
}

function updateCalculatedRate() {
    const checkboxes = document.querySelectorAll('.task-checkbox');
    const rateDisplay = document.getElementById('auto-achievement-rate');
    
    if (checkboxes.length === 0) {
        window.currentCalculatedRate = 0;
        rateDisplay.textContent = '0%';
        return;
    }
    
    let checkedCount = 0;
    checkboxes.forEach(chk => {
        if (chk.checked) checkedCount++;
    });
    
    const rate = Math.round((checkedCount / checkboxes.length) * 100);
    window.currentCalculatedRate = rate;
    rateDisplay.textContent = `${rate}%`;
}

reviewForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const date = document.getElementById('review-date').value;
    const rate = window.currentCalculatedRate || 0;
    const notes = document.getElementById('review-notes').value;
    
    // Determine missed tasks for coaching
    const checkboxes = document.querySelectorAll('.task-checkbox');
    const missedTasks = [];
    checkboxes.forEach(chk => {
        if (!chk.checked) {
            missedTasks.push(chk.nextElementSibling.textContent.trim());
        }
    });
    
    loadingOverlay.classList.remove('hidden');
    
    try {
        const response = await fetch(`${API_BASE_URL}/reviews/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                date: date,
                achievement_rate: rate,
                notes: notes,
                missed_tasks: missedTasks
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            alert(window.i18n ? window.i18n['alert-review-success'] : 'Daily review submitted successfully! Great job today!');
            document.getElementById('review-notes').value = '';
            
            // Show coaching
            if (data.coaching_feedback) {
                document.getElementById('ai-coaching-container').classList.remove('hidden');
                document.getElementById('coaching-content').innerHTML = data.coaching_feedback.replace(/\n/g, '<br>');
            }
            
        } else {
            throw new Error("Backend not responding");
        }
    } catch (error) {
        console.warn('Backend unavailable. Simulating review submission and coaching.');
        
        // Simulate a slight delay for "AI processing"
        setTimeout(() => {
            loadingOverlay.classList.add('hidden');
            
            // Dummy coaching generation
            let coachingText = "";
            const isKorean = (localStorage.getItem('preferredLang') === 'ko');
            
            if (rate === 100) {
                coachingText = isKorean ? 
                `<strong>완벽한 하루네요!</strong> 🎉<br>모든 목표를 달성하셨습니다. 작성해주신 <em>"${notes}"</em> 피드백을 보니 현재 공부 방식과 시간 배분이 아주 적절해 보입니다. 내일도 오늘처럼 25분 집중 / 5분 휴식 패턴을 잘 유지해 보세요!` : 
                `<strong>Perfect day!</strong> 🎉<br>You achieved all your goals. Based on your note <em>"${notes}"</em>, your current study method and time distribution are working great. Keep up the 25m focus / 5m break pattern tomorrow!`;
            } else if (missedTasks.length > 0) {
                const missedList = missedTasks.join('<br> - ');
                coachingText = isKorean ? 
                `<strong>오늘 하루 수고 많으셨습니다.</strong> 💪<br><br>아쉽게도 다음 목표들을 완료하지 못했습니다:<br> - ${missedList}<br><br><strong>💡 AI 코칭 팁:</strong><br>작성해주신 피드백(<em>"${notes}"</em>)을 분석해본 결과, 남은 세션들은 주말의 여유 시간이나 내일 오후 첫 번째 세션으로 재배치하는 것을 추천합니다. 미달성한 과목은 집중력이 가장 높은 오전에 1시간 단위로 먼저 배치하면 달성 확률이 올라갑니다.` : 
                `<strong>Great effort today.</strong> 💪<br><br>Unfortunately, you missed the following goals:<br> - ${missedList}<br><br><strong>💡 AI Coaching Tip:</strong><br>Based on your note (<em>"${notes}"</em>), I recommend reallocating these sessions to your free time this weekend or as your first session tomorrow afternoon. Tackle missed subjects in the morning when your focus is highest, broken into 1-hour chunks.`;
            } else {
                coachingText = isKorean ? "수고하셨습니다! 내일도 화이팅입니다." : "Great job today! Keep it up tomorrow.";
            }
            
            document.getElementById('ai-coaching-container').classList.remove('hidden');
            document.getElementById('coaching-content').innerHTML = coachingText;
            
            document.getElementById('review-notes').value = '';
            // Scroll to coaching
            document.getElementById('ai-coaching-container').scrollIntoView({ behavior: 'smooth' });
            
        }, 1500);
        return; // Early return to prevent hiding overlay immediately
    }
    
    loadingOverlay.classList.add('hidden');
});

function populateGoalForm(scheduleData) {
    const goalsList = document.getElementById('goals-list');
    
    const subjectPlaceholder = window.i18n ? window.i18n['subject-placeholder'] : 'Subject (e.g. C++)';
    const detailsPlaceholder = window.i18n ? window.i18n['details-placeholder'] : 'Details (e.g. Master Pointers)';
    const addDetailText = window.i18n ? window.i18n['add-detail-btn'] : '+ Add Another Goal to this Subject';
        
    if (!scheduleData || scheduleData.length === 0) {
        goalsList.innerHTML = `
            <div class="subject-group" style="background: rgba(15,23,42,0.3); border: 1px solid var(--border-color); padding: 1rem; border-radius: var(--radius-md); margin-bottom: 1rem; position: relative;">
                <button type="button" class="btn-delete-subject" style="position: absolute; top: 10px; right: 10px; background: transparent; border: none; color: var(--text-secondary); cursor: pointer; font-size: 1.2rem;" title="Delete Subject">×</button>
                <input type="text" data-i18n="subject-placeholder" placeholder="${subjectPlaceholder}" class="input-field subject-input" required style="margin-bottom: 0.5rem; font-weight: 600; background: rgba(0,0,0,0.2); width: calc(100% - 30px);">
                <div class="details-list">
                    <div class="detail-item" style="display: flex; gap: 8px; margin-bottom: 0.5rem; align-items: center;">
                        <input type="text" data-i18n="details-placeholder" placeholder="${detailsPlaceholder}" class="input-field desc-input" required style="flex: 1;">
                        <div style="display: flex; align-items: center; gap: 4px;">
                            <input type="number" placeholder="h" class="input-field hours-input" min="0" max="168" value="2" required style="width: 60px; padding-right: 5px;">
                            <span style="color: var(--text-secondary); font-size: 0.9rem;">h</span>
                            <input type="number" placeholder="m" class="input-field mins-input" min="0" max="59" value="0" required style="width: 60px; padding-right: 5px;">
                            <span style="color: var(--text-secondary); font-size: 0.9rem;">m</span>
                        </div>
                        <button type="button" class="btn-delete-detail" style="background: transparent; border: none; color: var(--danger-color); cursor: pointer; font-size: 1.2rem; padding: 0 5px;" title="Delete Goal">×</button>
                    </div>
                </div>
                <button type="button" class="btn btn-text add-detail-btn" data-i18n="add-detail-btn" style="padding: 5px 10px; font-size: 0.85rem;">${addDetailText}</button>
            </div>
        `;
        attachAddDetailListener(goalsList.querySelector('.add-detail-btn'));
        goalsList.querySelector('.btn-delete-subject').addEventListener('click', (e) => {
            e.target.closest('.subject-group').remove();
        });
        goalsList.querySelector('.btn-delete-detail').addEventListener('click', (e) => {
            e.target.closest('.detail-item').remove();
        });
        return;
    }
    
    // Group by subject
    const grouped = {};
    let totalDuration = 0;
    scheduleData.forEach(item => {
        totalDuration += (item.duration_minutes || 0);
        if (!grouped[item.subject]) {
            grouped[item.subject] = new Set();
        }
        if (item.topic) {
            grouped[item.subject].add(item.topic);
        }
    });
    
    goalsList.innerHTML = ''; 
    
    for (const [subject, topicsSet] of Object.entries(grouped)) {
        const topics = Array.from(topicsSet);
        
        const newGroup = document.createElement('div');
        newGroup.className = 'subject-group';
        newGroup.style.background = 'rgba(15,23,42,0.3)';
        newGroup.style.border = '1px solid var(--border-color)';
        newGroup.style.padding = '1rem';
        newGroup.style.borderRadius = 'var(--radius-md)';
        newGroup.style.marginBottom = '1rem';
        newGroup.style.position = 'relative';
        
        let detailsHTML = '';
        topics.forEach(topic => {
            // Find duration for this specific topic if possible, or default to 2 hours
            // Since we don't have individual topic duration in the grouped object right now, we default to 2h 0m
            // for the dummy prefill if it was fetched from a raw list.
            detailsHTML += `
                <div class="detail-item" style="display: flex; gap: 8px; margin-bottom: 0.5rem; align-items: center;">
                    <input type="text" data-i18n="details-placeholder" placeholder="${detailsPlaceholder}" class="input-field desc-input" value="${topic}" required style="flex: 1;">
                    <div style="display: flex; align-items: center; gap: 4px;">
                        <input type="number" placeholder="h" class="input-field hours-input" min="0" max="168" value="2" required style="width: 60px; padding-right: 5px;">
                        <span style="color: var(--text-secondary); font-size: 0.9rem;">h</span>
                        <input type="number" placeholder="m" class="input-field mins-input" min="0" max="59" value="0" required style="width: 60px; padding-right: 5px;">
                        <span style="color: var(--text-secondary); font-size: 0.9rem;">m</span>
                    </div>
                    <button type="button" class="btn-delete-detail" style="background: transparent; border: none; color: var(--danger-color); cursor: pointer; font-size: 1.2rem; padding: 0 5px;" title="Delete Goal">×</button>
                </div>
            `;
        });
        
        newGroup.innerHTML = `
            <button type="button" class="btn-delete-subject" style="position: absolute; top: 10px; right: 10px; background: transparent; border: none; color: var(--text-secondary); cursor: pointer; font-size: 1.2rem;" title="Delete Subject">×</button>
            <input type="text" data-i18n="subject-placeholder" placeholder="${subjectPlaceholder}" class="input-field subject-input" value="${subject}" required style="margin-bottom: 0.5rem; font-weight: 600; background: rgba(0,0,0,0.2); width: calc(100% - 30px);">
            <div class="details-list">
                ${detailsHTML}
            </div>
            <button type="button" class="btn btn-text add-detail-btn" data-i18n="add-detail-btn" style="padding: 5px 10px; font-size: 0.85rem;">${addDetailText}</button>
        `;
        
        goalsList.appendChild(newGroup);
        
        attachAddDetailListener(newGroup.querySelector('.add-detail-btn'));
        newGroup.querySelector('.btn-delete-subject').addEventListener('click', (e) => {
            e.target.closest('.subject-group').remove();
        });
        newGroup.querySelectorAll('.btn-delete-detail').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.target.closest('.detail-item').remove();
            });
        });
    }
    
    // Total Hours roughly update removed as we don't have global total-hours input anymore
}

// --- AI Tutor Logic ---
const tutorForm = document.getElementById('tutor-form');
const tutorInput = document.getElementById('tutor-input');
const tutorChatBox = document.getElementById('tutor-chat-box');

if (tutorForm) {
    tutorForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const question = tutorInput.value.trim();
        if (!question) return;
        
        // Add User Message
        const userMsg = document.createElement('div');
        userMsg.className = 'chat-message user-message';
        userMsg.style.cssText = 'align-self: flex-end; background: var(--primary-color); color: white; padding: 1rem; border-radius: 12px; max-width: 80%;';
        userMsg.textContent = question;
        tutorChatBox.appendChild(userMsg);
        
        tutorInput.value = '';
        tutorChatBox.scrollTop = tutorChatBox.scrollHeight;
        
        // Add Loading Message
        const loadingMsg = document.createElement('div');
        loadingMsg.className = 'chat-message ai-message loading';
        loadingMsg.style.cssText = 'align-self: flex-start; background: rgba(56, 189, 248, 0.1); border: 1px solid rgba(56, 189, 248, 0.2); padding: 1rem; border-radius: 12px; max-width: 80%; color: var(--text-secondary);';
        loadingMsg.textContent = '답변을 생각하는 중...';
        tutorChatBox.appendChild(loadingMsg);
        tutorChatBox.scrollTop = tutorChatBox.scrollHeight;
        
        try {
            const response = await fetch(`${API_BASE_URL}/tutor/ask`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question: question })
            });
            
            if (response.ok) {
                const data = await response.json();
                loadingMsg.innerHTML = data.answer;
                loadingMsg.style.color = 'var(--text-primary)';
                loadingMsg.classList.remove('loading');
            } else {
                throw new Error('Backend failed');
            }
        } catch (error) {
            console.error('Tutor error:', error);
            loadingMsg.textContent = '백엔드 서버에 연결할 수 없거나 오류가 발생했습니다.';
            loadingMsg.style.color = 'var(--danger-color)';
        }
        
        tutorChatBox.scrollTop = tutorChatBox.scrollHeight;
    });
}
