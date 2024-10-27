// Timer Functionality
document.getElementById('startTimer').addEventListener('click', () => {
    const timeInput = document.getElementById('time').value;
    const timeInMinutes = parseInt(timeInput);

    if (isNaN(timeInMinutes) || timeInMinutes <= 0) {
        document.getElementById('status').innerText = 'Please enter a valid time.';
        return;
    }

    chrome.storage.sync.set({ lockTime: timeInMinutes }, () => {
        document.getElementById('status').innerText = `App will be locked after ${timeInMinutes} minutes.`;
        
        // Starting the timer
        chrome.runtime.sendMessage({ type: 'startTimer', duration: timeInMinutes }, (response) => {
            console.log(response.status); 
        });
    });
});

// DOM Elements for Email Templates
const templateList = document.getElementById('template-list');
const templateNameInput = document.getElementById('template-name');
const templateContentInput = document.getElementById('template-content');
const saveButton = document.getElementById('save-template');

// Load and display saved templates on popup load
window.onload = function() {
    loadTemplates();
    loadTimerState();
    updateTimerDisplay();
};

// Email Templates Functionality
saveButton.addEventListener('click', function() {
    const templateName = templateNameInput.value.trim();
    const templateContent = templateContentInput.value.trim();

    if (templateName && templateContent) {
        // Get stored templates and update with the new one
        chrome.storage.local.get({ emailTemplates: [] }, (data) => {
            const templates = data.emailTemplates;
            const existingIndex = templates.findIndex(t => t.name === templateName);

            // If the template exists, update it; otherwise, add a new one
            if (existingIndex > -1) {
                templates[existingIndex].content = templateContent;
            } else {
                templates.push({ name: templateName, content: templateContent });
            }

            // Save updated templates
            chrome.storage.local.set({ emailTemplates: templates }, loadTemplates);

            // Clear input fields
            templateNameInput.value = '';
            templateContentInput.value = '';
        });
    } else {
        alert('Please enter both a template name and content.');
    }
});

// Load templates from storage and display them
function loadTemplates() {
    chrome.storage.local.get({ emailTemplates: [] }, (data) => {
        const templates = data.emailTemplates;
        templateList.innerHTML = ''; // Clear the current list

        templates.forEach((template, index) => {
            const templateDiv = document.createElement('div');
            templateDiv.style.marginBottom = '10px';

            // Button to open the template for editing
            const templateButton = document.createElement('button');
            templateButton.innerText = template.name;
            templateButton.onclick = () => openTemplate(template); // Call the openTemplate function

            const deleteButton = document.createElement('button');
            deleteButton.innerText = 'Delete';
            deleteButton.style.marginLeft = '10px';
            deleteButton.onclick = () => deleteTemplate(index);

            templateDiv.appendChild(templateButton);
            templateDiv.appendChild(deleteButton);
            templateList.appendChild(templateDiv);
        });
    });
}

// Function to open the selected template and populate the fields
function openTemplate(template) {
    templateNameInput.value = template.name; // Fill name field
    templateContentInput.value = template.content; // Fill content field
}

// Delete the template from storage
function deleteTemplate(index) {
    chrome.storage.local.get({ emailTemplates: [] }, (data) => {
        const templates = data.emailTemplates;
        templates.splice(index, 1); // Remove the template
        chrome.storage.local.set({ emailTemplates: templates }, loadTemplates);
    });
}

// Privacy Enhancer Controls
document.getElementById("toggleAdblock").addEventListener("click", function () {
    chrome.runtime.sendMessage({ action: "toggleAdblock" }, function (response) {
        console.log("Ad blocker toggled");
    });
});

document.getElementById("toggleScriptBlocker").addEventListener("click", function () {
    chrome.runtime.sendMessage({ action: "toggleScriptBlocker" }, function (response) {
        console.log("Script blocker toggled");
    });
});

document.getElementById("clearCookies").addEventListener("click", function () {
    chrome.browsingData.remove(
        { origins: ["<all_urls>"] },
        { cookies: true },
        function () {
            console.log("Cookies cleared");
        }
    );
});

// Pomodoro Timer Controls
let pomodoroTime = 25 * 60 * 1000; 
let shortBreakTime = 5 * 60 * 1000; 
let timeLeft = pomodoroTime;
let isRunning = false;
let timer;
let isPomodoro = true; 
let lapCount = 0;

const timerDisplay = document.getElementById('timer-display');
const startPauseButton = document.getElementById('start-pause-btn');
const resetButton = document.getElementById('reset-btn');
const shortBreakButton = document.getElementById('short-break-btn');
const alarmSound = new Audio('alarm-sound.mp3'); // Ensure the alarm sound file exists

function loadTimerState() {
    const savedState = JSON.parse(localStorage.getItem('pomodoroTimerState'));
    if (savedState) {
        timeLeft = savedState.timeLeft;
        isRunning = savedState.isRunning;
        isPomodoro = savedState.isPomodoro;

        if (isRunning) {
            startPauseTimer(); 
        }
    }
}

function saveTimerState() {
    localStorage.setItem('pomodoroTimerState', JSON.stringify({
        timeLeft: timeLeft,
        isRunning: isRunning,
        isPomodoro: isPomodoro,
    }));
}

function startPauseTimer() {
    if (!isRunning) {
        isRunning = true;
        startPauseButton.textContent = '❚❚'; 
        timer = setInterval(() => {
            if (timeLeft > 0) {
                timeLeft -= 10; 
                updateTimerDisplay();
                saveTimerState(); 
            } else {
                clearInterval(timer);
                isRunning = false;
                timeLeft = isPomodoro ? pomodoroTime : shortBreakTime; 
                updateTimerDisplay();
                startPauseButton.textContent = '►'; 
                alarmSound.play();
                toggleMode(); 
            }
        }, 10);
    } else {
        clearInterval(timer);
        isRunning = false;
        startPauseButton.textContent = '►'; 
        saveTimerState(); 
    }
}

function resetTimer() {
    clearInterval(timer);
    isRunning = false;
    timeLeft = pomodoroTime; 
    isPomodoro = true; 
    updateTimerDisplay();
    startPauseButton.textContent = '►'; 
    document.body.classList.remove('short-break-mode'); 
    saveTimerState(); 
}

function startShortBreak() {
    clearInterval(timer);
    isRunning = false;
    isPomodoro = false;
    timeLeft = shortBreakTime; 
    updateTimerDisplay();
    document.body.classList.add('short-break-mode'); 
    startPauseButton.textContent = '►'; 
    saveTimerState(); 

    lapCount++; 
    displayLapMessage(); 
    saveTimerState(); 
}

function toggleMode() {
    isPomodoro = !isPomodoro;
    timeLeft = isPomodoro ? pomodoroTime : shortBreakTime;
    updateTimerDisplay();

    if (isPomodoro) {
        document.body.classList.remove('short-break-mode');
    } else {
        document.body.classList.add('short-break-mode');
    }
}

function updateTimerDisplay() {
    const minutes = Math.floor(timeLeft / (60 * 1000));
    const seconds = Math.floor((timeLeft % (60 * 1000)) / 1000);
    const milliseconds = Math.floor((timeLeft % 1000) / 10);
    timerDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}:${String(milliseconds).padStart(2, '0')}`;
}

function displayLapMessage() {
    const lapMessage = document.getElementById('lap-message');
    lapMessage.textContent = `${lapCount} lap${lapCount > 1 ? 's' : ''} completed`;
    lapMessage.style.display = 'block'; 
    setTimeout(() => {
        lapMessage.style.display = 'none';
    }, 3000);
}

startPauseButton.addEventListener('click', startPauseTimer);
resetButton.addEventListener('click', resetTimer);
shortBreakButton.addEventListener('click', startShortBreak);
