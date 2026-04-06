// ==========================================
// 1. DATA RESET & CORE STATE
// ==========================================
if (localStorage.getItem('app_version') !== '2.0.1') {
  localStorage.clear();
  localStorage.setItem('app_version', '2.0.1');
}

const state = {
  tasks: JSON.parse(localStorage.getItem('tasks')) || [],
  moodLogs: JSON.parse(localStorage.getItem('moodLogs')) || [],
  scoreHistory: JSON.parse(localStorage.getItem('scoreHistory')) || [],
  currentMood: localStorage.getItem('currentMood') || null,
  streak: parseInt(localStorage.getItem('streak')) || 0,
  lastActive: localStorage.getItem('lastActive') || new Date().toISOString().split('T')[0],
  theme: localStorage.getItem('theme') || 'dark'
};

const MOODS = {
  happy:   { emoji: "😊", label: "Happy",   weight: 5 },
  loved:   { emoji: "❤️", label: "Loved",   weight: 5 },
  calm:    { emoji: "😌", label: "Calm",    weight: 5 },
  neutral: { emoji: "😐", label: "Neutral", weight: 0 },
  sad:     { emoji: "😢", label: "Sad",     weight: -3 },
  angry:   { emoji: "😡", label: "Angry",   weight: -3 },
  tired:   { emoji: "😴", label: "Tired",   weight: -3 },
  confused:{ emoji: "😕", label: "Confused",weight: 0 }
};

if (state.theme === "light") document.body.classList.add("light");

// ==========================================
// 2. INITIALIZATION & TOASTS
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
  setupToastContainer();
  checkStreak();
  updateUI();
  initCharts();
  
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("button, .mood-btn, .cta-btn");
    if (btn && !btn.classList.contains("theme-toggle") && !btn.classList.contains("reset-btn")) {
      btn.style.transform = "scale(0.95)";
      setTimeout(() => btn.style.transform = "", 150);
    }
  });
});

function setupToastContainer() {
  if (!document.getElementById("toast-container")) {
    const container = document.createElement("div");
    container.id = "toast-container";
    container.className = "toast-container";
    document.body.appendChild(container);
  }
}

window.showFeedback = function(message, icon = "✅") {
  const container = document.getElementById("toast-container");
  if(!container) return;
  
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.classList.add("fadeOut");
    setTimeout(() => toast.remove(), 300);
  }, 3000);
};

// ==========================================
// 3. LOGIC & STATE HANDLING
// ==========================================
function checkStreak() {
  const today = new Date().toISOString().split('T')[0];
  if (state.lastActive !== today) {
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    if (state.lastActive === yesterday) {
      state.streak++;
    } else {
      state.streak = 0;
    }
    state.lastActive = today;
    saveState();
  }
}

function saveState() {
  localStorage.setItem('tasks', JSON.stringify(state.tasks));
  localStorage.setItem('moodLogs', JSON.stringify(state.moodLogs));
  localStorage.setItem('scoreHistory', JSON.stringify(state.scoreHistory));
  localStorage.setItem('streak', state.streak.toString());
  localStorage.setItem('lastActive', state.lastActive);
  if(state.currentMood) localStorage.setItem('currentMood', state.currentMood);
}

function calculateScore() {
  const completedTasks = state.tasks.filter(t => t.done).length;
  const moodScore = state.currentMood && MOODS[state.currentMood] ? MOODS[state.currentMood].weight : 0;
  
  let score = (completedTasks * 10) + (state.streak * 5) + moodScore;
  return Math.max(0, score);
}

function getScoreLabel(score) {
  if (score >= 30) return { text: "High", color: "#10b981", width: Math.min(100, score) };
  if (score >= 10) return { text: "Medium", color: "#f59e0b", width: Math.min(100, score) };
  return { text: "Low", color: "#f43f5e", width: Math.min(100, score) };
}

function updateScoreHistory() {
  const today = new Date().toISOString().split('T')[0];
  const score = calculateScore();
  const existing = state.scoreHistory.find(s => s.date === today);
  if(existing) {
      existing.score = score;
  } else {
      state.scoreHistory.push({ date: today, score: score });
  }
}

window.resetData = function() {
  if (confirm("🚨 Are you sure you want to completely reset all data? This cannot be undone.")) {
    localStorage.clear();
    location.reload();
  }
};

// ==========================================
// 4. ACTIONS (Global accessible)
// ==========================================
window.logMood = function(mood) {
  if(!MOODS[mood]) return;
  state.currentMood = mood;
  state.moodLogs.push({ mood, date: new Date().toISOString() });
  updateScoreHistory();
  saveState();
  updateUI();
  showFeedback(`You selected ${MOODS[mood].emoji} ${MOODS[mood].label}`, "🧠");
};

window.addTask = function() {
  const input = document.getElementById("taskInput");
  if (!input) return;
  const val = input.value.trim();
  
  if (!val) {
    showFeedback("Task cannot be empty", "⚠️");
    return;
  }
  
  if (state.tasks.some(t => t.text.toLowerCase() === val.toLowerCase())) {
     showFeedback("Task already exists", "⚠️");
     return;
  }
  
  state.tasks.push({ 
    id: Date.now(), 
    text: val, 
    done: false, 
    date: new Date().toISOString().split('T')[0] 
  });
  
  input.value = "";
  updateScoreHistory();
  saveState();
  updateUI();
  showFeedback("Task added successfully", "📌");
};

window.toggleTask = function(id) {
  const task = state.tasks.find(t => t.id === id);
  if (task) {
    task.done = !task.done;
    updateScoreHistory();
    saveState();
    updateUI();
    if(task.done) {
        showFeedback("Task completed! Score increased.", "🎯");
    } else {
        showFeedback("Task unchecked", "🔄");
    }
  }
};

window.deleteTask = function(id) {
  state.tasks = state.tasks.filter(t => t.id !== id);
  updateScoreHistory();
  saveState();
  updateUI();
  showFeedback("Task removed", "🗑️");
};

window.toggleTheme = function() {
  const isLight = document.body.classList.toggle("light");
  state.theme = isLight ? "light" : "dark";
  localStorage.setItem("theme", state.theme);
  
  document.querySelectorAll(".theme-toggle").forEach(btn => {
    btn.innerText = state.theme === "light" ? "🌙" : "☀️";
  });
};

// ==========================================
// 5. UI UPDATES
// ==========================================
function updateUI() {
  document.querySelectorAll(".theme-toggle").forEach(btn => {
    btn.innerText = state.theme === "light" ? "🌙" : "☀️";
  });
  
  document.querySelectorAll(".mood-btn").forEach(btn => {
    btn.style.borderColor = '';
    btn.style.boxShadow = '';
    if(state.currentMood && btn.getAttribute('onclick') === `logMood('${state.currentMood}')`) {
       btn.style.borderColor = '#10b981';
       btn.style.boxShadow = '0 0 15px rgba(16, 185, 129, 0.4)';
    }
  });

  const moodText = document.getElementById("selectedMoodText");
  if(moodText) {
    moodText.innerText = state.currentMood 
      ? `Selected Mood: ${MOODS[state.currentMood].emoji} ${MOODS[state.currentMood].label}` 
      : "Selected Mood: None";
  }

  const taskList = document.getElementById("taskList");
  if (taskList) {
    taskList.innerHTML = "";
    const sortedTasks = [...state.tasks].sort((a,b) => a.done === b.done ? 0 : a.done ? 1 : -1);
    
    sortedTasks.forEach(t => {
      const li = document.createElement("li");
      li.className = t.done ? "task-done" : "";
      
      const textSpan = document.createElement("span");
      textSpan.className = "task-text";
      textSpan.innerText = t.text;
      textSpan.onclick = () => toggleTask(t.id);
      
      const actions = document.createElement("div");
      actions.className = "task-actions";
      
      const checkBtn = document.createElement("button");
      checkBtn.className = "btn-icon";
      checkBtn.innerText = t.done ? "🔄" : "✔️";
      checkBtn.onclick = () => toggleTask(t.id);
      
      const delBtn = document.createElement("button");
      delBtn.className = "btn-icon";
      delBtn.innerText = "❌";
      delBtn.onclick = () => deleteTask(t.id);
      
      actions.appendChild(checkBtn);
      actions.appendChild(delBtn);
      li.appendChild(textSpan);
      li.appendChild(actions);
      taskList.appendChild(li);
    });
    
    if(sortedTasks.length === 0) {
        taskList.innerHTML = `<p style="color: var(--text-secondary); text-align: center; padding: 20px;">No tasks. Write something to execute today.</p>`;
    }
    
    const completed = state.tasks.filter(t => t.done).length;
    
    const statsTasks = document.getElementById("stats-tasks");
    if(statsTasks) statsTasks.innerText = `${completed} / ${state.tasks.length}`;
    
    const statsStreak = document.getElementById("stats-streak");
    if(statsStreak) statsStreak.innerText = `${state.streak} Days`;
    
    const currentScore = calculateScore();
    const metrics = getScoreLabel(currentScore);
    
    const scoreNum = document.getElementById("score-numeric");
    if(scoreNum) scoreNum.innerText = currentScore;
    
    const scoreLabel = document.getElementById("score-label");
    if(scoreLabel) {
      scoreLabel.innerText = metrics.text;
      scoreLabel.style.color = metrics.color;
    }
    
    const scoreFill = document.getElementById("score-progress-fill");
    if(scoreFill) {
      scoreFill.style.width = `${metrics.width}%`;
      scoreFill.style.background = metrics.color;
    }
    
    // Update Score Breakdown Sub-panel
    const bTasks = document.getElementById("breakdown-tasks");
    const bStreak = document.getElementById("breakdown-streak");
    const bMood = document.getElementById("breakdown-mood");
    if(bTasks) bTasks.innerText = `+${completed * 10}`;
    if(bStreak) bStreak.innerText = `+${state.streak * 5}`;
    if(bMood) {
      let mWeight = state.currentMood ? MOODS[state.currentMood].weight : 0;
      bMood.innerText = (mWeight >= 0 ? "+" : "") + mWeight;
      bMood.style.color = mWeight < 0 ? "#f43f5e" : (mWeight > 0 ? "#10b981" : "var(--text-secondary)");
    }
  }
}

// ==========================================
// 6. CHARTS & ANALYTICS
// ==========================================
function initCharts() {
  if (!document.getElementById("barChart")) return; 

  // 1. Mood Frequency Aggregation
  const moodCounts = {};
  state.moodLogs.forEach(log => {
      if(MOODS[log.mood]) {
        moodCounts[log.mood] = (moodCounts[log.mood] || 0) + 1;
      }
  });
  const moodKeys = Object.keys(moodCounts);
  
  // 2. Score Trend (Real Past 7 Days)
  const past7Days = Array.from({length: 7}, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });
  
  const trendLabels = past7Days.map(date => date.substr(5)); 
  const trendData = past7Days.map(date => {
      const match = state.scoreHistory.find(s => s.date === date);
      return match ? match.score : 0;
  });

  trendData[6] = calculateScore();
  
  // 3. Task Completion Pie Data
  const completedCount = state.tasks.filter(t => t.done).length;
  const pendingCount = state.tasks.length - completedCount;

  createChart("barChart", "bar", 
    moodKeys.map(k => MOODS[k].emoji + " " + MOODS[k].label), 
    "Total Entries", 
    Object.values(moodCounts), 
    ["#6366f1", "#10b981", "#f43f5e", "#f59e0b", "#8b5cf6"]
  );
  
  createChart("lineChart", "line", 
    trendLabels, 
    "Score Value", 
    trendData, 
    "rgba(99, 102, 241, 0.2)", 
    { borderColor: "#6366f1", tension: 0.4, fill: true }
  );
  
  if (completedCount > 0 || pendingCount > 0) {
      createChart("pieChart", "doughnut", 
        ["Completed", "Pending"], 
        "Tasks", 
        [completedCount, pendingCount], 
        ["#10b981", "rgba(255,255,255,0.1)"], 
        { borderColor: "transparent", cutout: "75%" }
      );
  } else {
      document.getElementById("pieChart").style.display = 'none';
      const wrapper = document.getElementById("pieChart").parentElement;
      wrapper.innerHTML += "<p style='color: #64748b; margin-top: auto; margin-bottom: auto;'>No tasks logged yet</p>";
  }
}

function createChart(id, type, labels, label, data, colors, extraOpts = {}) {
  const ctx = document.getElementById(id);
  if (!ctx) return;
  new Chart(ctx, {
    type: type,
    data: {
      labels: labels,
      datasets: [{
        label: label,
        data: data,
        backgroundColor: colors,
        ...extraOpts
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: type !== 'bar' && type !== 'line', labels: { color: "#f8fafc" } } },
      scales: type !== 'doughnut' && type !== 'pie' ? {
        x: { ticks: { color: "#94a3b8" }, grid: { display: false } },
        y: { ticks: { color: "#94a3b8" }, grid: { color: "rgba(255,255,255,0.05)" } }
      } : {}
    }
  });
}

// ==========================================
// 7. FOCUS TIMER
// ==========================================
let timerInterval = null;

window.startTimer = function() {
  if (timerInterval) return; // Prevent multiple instances

  let timeRemaining = 1500; // 25 mins
  const timerEl = document.getElementById("timer");
  if (!timerEl) return;

  // Format UI instantly
  updateTimerDisplay(timeRemaining, timerEl);

  timerInterval = setInterval(() => {
    timeRemaining--;
    updateTimerDisplay(timeRemaining, timerEl);
    
    if (timeRemaining <= 0) {
      clearInterval(timerInterval);
      timerInterval = null;
      
      if(window.showFeedback) showFeedback("Focus Session Complete! Take a break.", "⏰");
      else alert("Session Complete! Take a break.");
      
      updateTimerDisplay(1500, timerEl); // Reset visually
    }
  }, 1000);
};

function updateTimerDisplay(totalSeconds, el) {
  let m = Math.floor(totalSeconds / 60);
  let s = totalSeconds % 60;
  el.innerText = `${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
}