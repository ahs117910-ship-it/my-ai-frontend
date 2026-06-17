// Pomodoro Timer Logic
let timerInterval;
let timeLeft = 25 * 60; // default 25 mins
let isRunning = false;
let currentMode = 25; // 25 or 5
const fullTime = 25 * 60;

const timeDisplay = document.getElementById('time-display');
const startBtn = document.getElementById('start-timer');
const pauseBtn = document.getElementById('pause-timer');
const resetBtn = document.getElementById('reset-timer');
const modeBtns = document.querySelectorAll('.mode-btn');
const progressCircle = document.querySelector('.timer-ring-progress');
const progressTracking = document.getElementById('progress-tracking');

// For SVG Circle progress
const circleRadius = 90;
const circumference = 2 * Math.PI * circleRadius;
progressCircle.style.strokeDasharray = `${circumference}`;

function updateDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    timeDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    // Update circle progress
    const totalCurrentModeTime = currentMode * 60;
    const progress = 1 - (timeLeft / totalCurrentModeTime);
    const offset = circumference - (progress * circumference);
    progressCircle.style.strokeDashoffset = offset;
}

function startTimer() {
    if (isRunning) return;
    isRunning = true;
    startBtn.classList.add('hidden');
    pauseBtn.classList.remove('hidden');
    progressTracking.classList.add('hidden'); // Hide tracking while running
    
    timerInterval = setInterval(() => {
        timeLeft--;
        updateDisplay();
        
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            isRunning = false;
            startBtn.classList.remove('hidden');
            pauseBtn.classList.add('hidden');
            
            // If it was a pomodoro session (not a break), show the progress tracking
            if (currentMode === 25) {
                progressTracking.classList.remove('hidden');
                // You could play a sound here
            }
        }
    }, 1000);
}

function pauseTimer() {
    clearInterval(timerInterval);
    isRunning = false;
    startBtn.classList.remove('hidden');
    pauseBtn.classList.add('hidden');
}

function resetTimer() {
    clearInterval(timerInterval);
    isRunning = false;
    timeLeft = currentMode * 60;
    startBtn.classList.remove('hidden');
    pauseBtn.classList.add('hidden');
    progressTracking.classList.add('hidden');
    updateDisplay();
}

function setMode(minutes) {
    currentMode = minutes;
    resetTimer();
    
    modeBtns.forEach(btn => {
        if (parseInt(btn.dataset.time) === minutes) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

// Event Listeners
startBtn.addEventListener('click', startTimer);
pauseBtn.addEventListener('click', pauseTimer);
resetBtn.addEventListener('click', resetTimer);

modeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        setMode(parseInt(btn.dataset.time));
    });
});

// Initialize display
updateDisplay();
