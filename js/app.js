// API Base URL
const API_BASE_URL = 'https://ai-syudy-planner.onrender.com';

// --- Local Storage Helpers ---
function saveScheduleLocal(schedule) {
    localStorage.setItem('aura_schedule', JSON.stringify(schedule));
}
function loadScheduleLocal() {
    const data = localStorage.getItem('aura_schedule');
    return data ? JSON.parse(data) : null;
}

// --- Navigation ---
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', e => {
        e.preventDefault();
        document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
        item.classList.add('active');
        
        const targetId = item.getAttribute('data-target');
        document.querySelectorAll('.view').forEach(view => view.classList.add('hidden'));
        document.getElementById(targetId).classList.remove('hidden');
    });
});

// --- Dynamic Goal Inputs ---
const goalsList = document.getElementById('goals-list');

goalsList.addEventListener('click', e => {
    if (e.target.classList.contains('add-detail-btn')) {
        const detailsList = e.target.previousElementSibling;
        const newDetail = document.createElement('div');
        newDetail.className = 'detail-item';
        newDetail.style.display = 'flex';
        newDetail.style.gap = '8px';
        newDetail.style.marginBottom = '0.5rem';
        newDetail.style.alignItems = 'center';
        newDetail.innerHTML = `
            <input type="text" placeholder="Details (e.g. Master Pointers)" class="input-field desc-input" required style="flex: 1;">
            <div style="display: flex; align-items: center; gap: 4px;">
                <input type="number" placeholder="h" class="input-field hours-input" min="0" max="168" value="2" required style="width: 60px; padding-right: 5px;">
                <span style="color: var(--text-secondary); font-size: 0.9rem;">h</span>
                <input type="number" placeholder="m" class="input-field mins-input" min="0" max="59" value="0" required style="width: 60px; padding-right: 5px;">
                <span style="color: var(--text-secondary); font-size: 0.9rem;">m</span>
            </div>
            <button type="button" class="btn-delete-detail" style="background: transparent; border: none; color: var(--danger-color); cursor: pointer; font-size: 1.2rem; padding: 0 5px;" title="Delete Goal">×</button>
        `;
        detailsList.appendChild(newDetail);
    } else if (e.target.classList.contains('btn-delete-detail')) {
        e.target.closest('.detail-item').remove();
    } else if (e.target.classList.contains('btn-delete-subject')) {
        e.target.closest('.subject-group').remove();
    }
});

document.getElementById('add-goal-btn').addEventListener('click', () => {
    const firstGroup = document.querySelector('.subject-group');
    const newGroup = firstGroup.cloneNode(true);
    newGroup.querySelector('.subject-input').value = '';
    
    const details = newGroup.querySelectorAll('.detail-item');
    for (let i = 1; i < details.length; i++) {
        details[i].remove();
    }
    details[0].querySelector('.desc-input').value = '';
    details[0].querySelector('.hours-input').value = '2';
    details[0].querySelector('.mins-input').value = '0';
    
    goalsList.appendChild(newGroup);
});

// --- Generate Schedule ---
document.getElementById('goal-form').addEventListener('submit', async e => {
    e.preventDefault();
    
    const goalsPayload = [];
    document.querySelectorAll('.subject-group').forEach(group => {
        const subject = group.querySelector('.subject-input').value;
        group.querySelectorAll('.detail-item').forEach(item => {
            const desc = item.querySelector('.desc-input').value;
            const h = parseInt(item.querySelector('.hours-input').value) || 0;
            const m = parseInt(item.querySelector('.mins-input').value) || 0;
            
            goalsPayload.push({
                subject: subject,
                description: desc,
                duration_minutes: (h * 60) + m
            });
        });
    });

    const overlay = document.getElementById('loading-overlay');
    overlay.classList.remove('hidden');

    try {
        const response = await fetch(`${API_BASE_URL}/generate_schedule/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ goals: goalsPayload })
        });

        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }

        const data = await response.json();
        saveScheduleLocal(data);
        renderSchedule(data);
        
        // Go to Dashboard
        document.querySelector('[data-target="dashboard-view"]').click();
        
    } catch (error) {
        console.error("Error generating schedule:", error);
        alert("Failed to generate schedule. Please check the backend connection.");
    } finally {
        overlay.classList.add('hidden');
    }
});

function renderSchedule(scheduleData) {
    const timeline = document.getElementById('schedule-timeline');
    const daysTabs = document.getElementById('days-tabs');
    
    timeline.innerHTML = '';
    daysTabs.innerHTML = '';

    if (!scheduleData || scheduleData.length === 0) {
        timeline.innerHTML = '<div class="empty-state">No schedule generated yet.</div>';
        return;
    }

    const groupedByDay = {};
    scheduleData.forEach(item => {
        if (!groupedByDay[item.day_of_week]) {
            groupedByDay[item.day_of_week] = [];
        }
        groupedByDay[item.day_of_week].push(item);
    });

    const daysOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const activeDays = Object.keys(groupedByDay).sort((a, b) => daysOrder.indexOf(a) - daysOrder.indexOf(b));

    let isFirst = true;

    activeDays.forEach(day => {
        // Create Tab
        const tab = document.createElement('button');
        tab.className = `btn btn-text ${isFirst ? 'active' : ''}`;
        tab.textContent = day;
        tab.style.padding = '5px 10px';
        tab.onclick = () => {
            document.querySelectorAll('#days-tabs button').forEach(b => b.classList.remove('active'));
            tab.classList.add('active');
            
            document.querySelectorAll('.day-timeline').forEach(dt => dt.classList.add('hidden'));
            document.getElementById(`timeline-${day}`).classList.remove('hidden');
        };
        daysTabs.appendChild(tab);

        // Create Timeline Content
        const dayContainer = document.createElement('div');
        dayContainer.className = `day-timeline ${isFirst ? '' : 'hidden'}`;
        dayContainer.id = `timeline-${day}`;
        dayContainer.style.display = 'flex';
        dayContainer.style.flexDirection = 'column';
        dayContainer.style.gap = '1rem';

        groupedByDay[day].forEach(item => {
            const div = document.createElement('div');
            div.style.background = 'rgba(255,255,255,0.05)';
            div.style.padding = '1rem';
            div.style.borderRadius = '8px';
            div.style.borderLeft = '4px solid var(--primary-color)';
            div.innerHTML = `
                <div style="color: var(--primary-color); font-weight: bold; font-size: 0.9rem; margin-bottom: 5px;">${item.start_time} - ${item.end_time}</div>
                <h4 style="margin: 0 0 5px 0;">${item.subject}</h4>
                <p style="margin: 0; color: var(--text-secondary); font-size: 0.9rem;">${item.topic}</p>
            `;
            dayContainer.appendChild(div);
        });

        timeline.appendChild(dayContainer);
        isFirst = false;
    });
}

// Check for existing schedule on load
const saved = loadScheduleLocal();
if (saved) {
    renderSchedule(saved);
}

// Reset Schedule
document.getElementById('reset-schedule-btn').addEventListener('click', () => {
    if(confirm("Are you sure you want to reset your schedule?")) {
        localStorage.removeItem('aura_schedule');
        renderSchedule(null);
    }
});

// --- AI Tutor Chat ---
document.getElementById('tutor-form').addEventListener('submit', async e => {
    e.preventDefault();
    const inputField = document.getElementById('tutor-input');
    const question = inputField.value.trim();
    if(!question) return;

    const chatBox = document.getElementById('tutor-chat-box');
    
    // Add user message
    const userMsg = document.createElement('div');
    userMsg.className = 'chat-message user-message';
    userMsg.style.cssText = 'align-self: flex-end; background: var(--primary-color); padding: 1rem; border-radius: 12px; max-width: 80%; color: white;';
    userMsg.textContent = question;
    chatBox.appendChild(userMsg);
    
    inputField.value = '';
    chatBox.scrollTop = chatBox.scrollHeight;

    // Add typing indicator
    const typingIndicator = document.createElement('div');
    typingIndicator.id = 'ai-typing-indicator';
    typingIndicator.className = 'chat-message ai-message';
    typingIndicator.style.cssText = 'align-self: flex-start; background: rgba(56, 189, 248, 0.1); border: 1px solid rgba(56, 189, 248, 0.2); padding: 1rem; border-radius: 12px; max-width: 80%; color: var(--text-secondary); display: flex; align-items: center; gap: 8px;';
    typingIndicator.innerHTML = '<span style="font-size: 1.2rem; line-height: 1;">💬</span> AI 튜터가 답변을 작성하고 있습니다...';
    chatBox.appendChild(typingIndicator);
    chatBox.scrollTop = chatBox.scrollHeight;

    try {
        const response = await fetch(`${API_BASE_URL}/tutor/ask`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question: question })
        });

        if (!response.ok) throw new Error('Failed to fetch tutor response');

        const data = await response.json();
        
        // Remove typing indicator
        const indicator = document.getElementById('ai-typing-indicator');
        if (indicator) indicator.remove();
        
        // Add AI response
        const aiMsg = document.createElement('div');
        aiMsg.className = 'chat-message ai-message';
        aiMsg.style.cssText = 'align-self: flex-start; background: rgba(56, 189, 248, 0.1); border: 1px solid rgba(56, 189, 248, 0.2); padding: 1rem; border-radius: 12px; max-width: 80%;';
        aiMsg.innerHTML = data.answer;
        chatBox.appendChild(aiMsg);
        
    } catch(err) {
        console.error(err);
        
        // Remove typing indicator
        const indicator = document.getElementById('ai-typing-indicator');
        if (indicator) indicator.remove();
        
        const aiMsg = document.createElement('div');
        aiMsg.className = 'chat-message ai-message';
        aiMsg.style.cssText = 'align-self: flex-start; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2); padding: 1rem; border-radius: 12px; max-width: 80%; color: #fca5a5;';
        aiMsg.textContent = 'Sorry, the AI Tutor is currently unavailable.';
        chatBox.appendChild(aiMsg);
    }
    
    chatBox.scrollTop = chatBox.scrollHeight;
});
