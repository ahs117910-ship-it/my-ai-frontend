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
            
            renderTodayTasks(day, groupedByDay);
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
        
        if (isFirst) {
            renderTodayTasks(day, groupedByDay);
        }
        isFirst = false;
    });
}

function renderTodayTasks(day, groupedByDay) {
    const todayList = document.getElementById('today-tasks-list');
    if (!todayList) return;
    todayList.innerHTML = '';
    
    if (!groupedByDay[day]) {
        todayList.innerHTML = '<div class="empty-state">No tasks for today.</div>';
        return;
    }
    
    groupedByDay[day].forEach(item => {
        const div = document.createElement('div');
        div.style.display = 'flex';
        div.style.alignItems = 'center';
        div.style.gap = '10px';
        div.style.padding = '10px';
        div.style.borderBottom = '1px solid var(--border-color)';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.style.width = '18px';
        checkbox.style.height = '18px';
        checkbox.style.cursor = 'pointer';
        
        const textDiv = document.createElement('div');
        textDiv.innerHTML = `<strong>${item.subject || 'Unknown'}</strong> <span style="color:var(--text-secondary); font-size:0.9rem;">(${item.duration_minutes}m)</span>`;
        
        div.appendChild(checkbox);
        div.appendChild(textDiv);
        todayList.appendChild(div);
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

// --- Daily Review Logic ---
const reviewDateInput = document.getElementById('review-date');
if (reviewDateInput) {
    reviewDateInput.addEventListener('change', (e) => {
        const dateStr = e.target.value;
        if(!dateStr) return;
        
        const date = new Date(dateStr);
        const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        const dayOfWeek = days[date.getDay()];
        
        const saved = loadScheduleLocal();
        const reviewList = document.getElementById('review-task-list');
        reviewList.innerHTML = '';
        
        if(!saved || saved.length === 0) {
            reviewList.innerHTML = '<div class="empty-state">No schedule found. Generate one first!</div>';
            return;
        }
        
        const dayTasks = saved.filter(t => t.day_of_week === dayOfWeek);
        
        if(dayTasks.length === 0) {
            reviewList.innerHTML = `<div class="empty-state">No tasks scheduled for ${dayOfWeek}.</div>`;
            return;
        }
        
        dayTasks.forEach(task => {
            const div = document.createElement('div');
            div.style.display = 'flex';
            div.style.alignItems = 'center';
            div.style.gap = '10px';
            div.style.padding = '8px';
            div.style.borderBottom = '1px solid var(--border-color)';
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'review-task-checkbox';
            checkbox.style.width = '18px';
            checkbox.style.height = '18px';
            
            const label = document.createElement('div');
            label.innerHTML = `<strong>${task.subject || 'Unknown'}</strong>: ${task.topic}`;
            
            div.appendChild(checkbox);
            div.appendChild(label);
            reviewList.appendChild(div);
        });
    });
}

const reviewForm = document.getElementById('review-form');
if(reviewForm) {
    reviewForm.addEventListener('submit', async e => {
        e.preventDefault();
        const notes = document.getElementById('review-notes').value;
        const checkboxes = document.querySelectorAll('.review-task-checkbox');
        const missed = [];
        checkboxes.forEach(cb => {
            if(!cb.checked) {
                missed.push(cb.nextElementSibling.textContent);
            }
        });
        
        const coachContainer = document.getElementById('ai-coaching-container');
        const coachContent = document.getElementById('coaching-content');
        coachContainer.classList.remove('hidden');
        coachContent.innerHTML = '<em>AI 튜터가 리뷰를 분석하고 조언을 작성 중입니다... ⏳</em>';
        
        try {
            const response = await fetch(`${API_BASE_URL}/review/coaching`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ notes: notes, missed_tasks: missed })
            });
            if(!response.ok) throw new Error('Failed');
            const data = await response.json();
            coachContent.innerHTML = data.feedback;
        } catch(err) {
            coachContent.innerHTML = '<span style="color:var(--danger-color);">피드백을 불러오는 데 실패했습니다. 다시 시도해주세요.</span>';
        }
    });
}

// --- AI Tutor Chat Memory & History ---
let currentChatId = null;

function getTutorHistory() {
    const data = localStorage.getItem('ai_tutor_history');
    return data ? JSON.parse(data) : [];
}

function saveTutorHistory(history) {
    localStorage.setItem('ai_tutor_history', JSON.stringify(history));
}

function renderHistorySidebar() {
    const historyList = document.getElementById('tutor-history-list');
    historyList.innerHTML = '';
    
    const history = getTutorHistory();
    if (history.length === 0) {
        historyList.innerHTML = '<div style="color: var(--text-secondary); font-size: 0.85rem; padding: 10px; text-align: center;">대화 기록이 없습니다.</div>';
        return;
    }
    
    // Sort by newest first
    history.sort((a, b) => b.id - a.id).forEach(chat => {
        const itemContainer = document.createElement('div');
        itemContainer.style.display = 'flex';
        itemContainer.style.alignItems = 'center';
        itemContainer.style.justifyContent = 'space-between';
        itemContainer.style.gap = '5px';
        itemContainer.style.marginBottom = '5px';
        
        const item = document.createElement('div');
        item.className = 'history-item';
        item.style.flex = '1';
        item.style.overflow = 'hidden';
        item.style.textOverflow = 'ellipsis';
        item.style.whiteSpace = 'nowrap';
        item.style.marginBottom = '0';
        if (currentChatId === chat.id) item.classList.add('active');
        item.textContent = chat.title;
        item.title = chat.title;
        item.onclick = () => loadChat(chat.id);
        
        const deleteBtn = document.createElement('button');
        deleteBtn.innerHTML = '🗑️';
        deleteBtn.style.background = 'transparent';
        deleteBtn.style.border = 'none';
        deleteBtn.style.cursor = 'pointer';
        deleteBtn.style.padding = '0 5px';
        deleteBtn.style.fontSize = '1rem';
        deleteBtn.onclick = (e) => {
            e.stopPropagation();
            deleteChat(chat.id);
        };
        
        itemContainer.appendChild(item);
        itemContainer.appendChild(deleteBtn);
        historyList.appendChild(itemContainer);
    });
}

function deleteChat(chatId) {
    if(!confirm('이 대화 내역을 삭제하시겠습니까?')) return;
    let history = getTutorHistory();
    history = history.filter(c => c.id !== chatId);
    saveTutorHistory(history);
    
    if(currentChatId === chatId) {
        currentChatId = null;
        const chatBox = document.getElementById('tutor-chat-box');
        chatBox.innerHTML = '';
        document.getElementById('btn-new-chat').click();
    }
    renderHistorySidebar();
}

const btnClearChats = document.getElementById('btn-clear-chats');
if(btnClearChats) {
    btnClearChats.addEventListener('click', () => {
        if(confirm('모든 대화 내역을 삭제하시겠습니까?')) {
            localStorage.removeItem('ai_tutor_history');
            currentChatId = null;
            renderHistorySidebar();
            document.getElementById('btn-new-chat').click();
        }
    });
}

function loadChat(chatId) {
    currentChatId = chatId;
    renderHistorySidebar();
    
    const history = getTutorHistory();
    const chat = history.find(c => c.id === chatId);
    const chatBox = document.getElementById('tutor-chat-box');
    chatBox.innerHTML = '';
    
    if (chat && chat.messages) {
        chat.messages.forEach(msg => {
            const msgDiv = document.createElement('div');
            msgDiv.className = `chat-message ${msg.role === 'user' ? 'user-message' : 'ai-message'}`;
            if (msg.role === 'user') {
                msgDiv.style.cssText = 'align-self: flex-end; background: var(--primary-color); padding: 1rem; border-radius: 12px; max-width: 80%; color: white;';
                msgDiv.textContent = msg.content;
            } else {
                msgDiv.style.cssText = 'align-self: flex-start; background: #ffffff; border: 1px solid var(--border-color); padding: 1rem; border-radius: 12px; max-width: 80%;';
                msgDiv.innerHTML = msg.content; // Allow HTML from AI
            }
            chatBox.appendChild(msgDiv);
        });
    }
    chatBox.scrollTop = chatBox.scrollHeight;
}

document.getElementById('btn-new-chat').addEventListener('click', () => {
    currentChatId = null;
    renderHistorySidebar();
    
    const chatBox = document.getElementById('tutor-chat-box');
    chatBox.innerHTML = `
        <div class="chat-message ai-message" style="align-self: flex-start; background: #ffffff; border: 1px solid var(--border-color); padding: 1rem; border-radius: 12px; max-width: 80%;">
            안녕하세요! 공부하다가 모르는 내용이 생기면 언제든 편하게 물어보세요. 😊 새로운 대화를 시작합니다!
        </div>
    `;
});

// Initialize History
renderHistorySidebar();
if (!currentChatId) {
    document.getElementById('btn-new-chat').click();
}

// --- Submit Question ---
document.getElementById('tutor-form').addEventListener('submit', async e => {
    e.preventDefault();
    const inputField = document.getElementById('tutor-input');
    const question = inputField.value.trim();
    if(!question) return;

    // Determine current chat context
    if (!currentChatId) {
        currentChatId = Date.now();
    }
    
    const history = getTutorHistory();
    let chat = history.find(c => c.id === currentChatId);
    if (!chat) {
        // Create new chat
        chat = {
            id: currentChatId,
            title: question.length > 20 ? question.substring(0, 20) + '...' : question,
            messages: []
        };
        history.push(chat);
    }
    
    // Save user message
    chat.messages.push({ role: 'user', content: question });
    saveTutorHistory(history);
    renderHistorySidebar();

    const chatBox = document.getElementById('tutor-chat-box');
    
    // Render user message to DOM
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
    typingIndicator.style.cssText = 'align-self: flex-start; background: #ffffff; border: 1px solid var(--border-color); padding: 1rem; border-radius: 12px; max-width: 80%; color: var(--text-secondary); display: flex; align-items: center; gap: 8px;';
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
        
        // Render AI response
        const aiMsg = document.createElement('div');
        aiMsg.className = 'chat-message ai-message';
        aiMsg.style.cssText = 'align-self: flex-start; background: #ffffff; border: 1px solid var(--border-color); padding: 1rem; border-radius: 12px; max-width: 80%;';
        aiMsg.innerHTML = data.answer;
        chatBox.appendChild(aiMsg);
        
        // Save AI message to history
        chat.messages.push({ role: 'ai', content: data.answer });
        saveTutorHistory(history);
        
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
