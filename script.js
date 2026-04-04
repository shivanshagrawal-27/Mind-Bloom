// -------------------- INIT --------------------
let score = localStorage.getItem("score") || 0;
score = parseInt(score);

if (document.getElementById("score")) {
  document.getElementById("score").innerText = score;
}

// Load tasks on refresh
window.onload = function () {
  loadTasks();
};

// -------------------- MOOD --------------------
function setMood(mood, event) {

  // Highlight selected mood
  document.querySelectorAll(".mood-box").forEach(box => {
    box.classList.remove("active");
  });
  if (event) event.currentTarget.classList.add("active");

  // Set mood text
  document.getElementById("selectedMood").innerText = "Mood: " + mood;

  // Save mood history (for future analytics)
  let moods = JSON.parse(localStorage.getItem("moods")) || [];
  moods.push(mood);
  localStorage.setItem("moods", JSON.stringify(moods));

  let suggestion = "";

  switch (mood) {
    case "happy":
      suggestion = "You are operating at peak emotional efficiency—channel this momentum into high-impact, cognitively demanding work.";
      break;

    case "sad":
      suggestion = "Emotional dips are temporary. Initiate micro-actions—small, deliberate wins will reconstruct your confidence baseline.";
      break;

    case "angry":
      suggestion = "Convert emotional intensity into structured output. Pause, recalibrate, and act with controlled precision.";
      break;

    case "neutral":
      suggestion = "Stability is your leverage point. Focus on disciplined execution and incremental improvement.";
      break;

    case "tired":
      suggestion = "Cognitive fatigue reduces efficiency. Strategic rest now will significantly enhance future performance.";
      break;

    case "confused":
      suggestion = "Uncertainty signals growth. Take one clear step forward—clarity is a byproduct of action.";
      break;

    case "calm":
      suggestion = "You are in an optimal decision-making state. Prioritize thoughtful, high-quality output.";
      break;

    case "loved":
      suggestion = "Positive emotional energy enhances creativity—use this state to build something meaningful.";
      break;

    default:
      suggestion = "Stay mindful and keep progressing.";
  }

  let el = document.getElementById("suggestion");
  el.classList.remove("show");

  setTimeout(() => {
    el.innerText = suggestion;
    el.classList.add("show");
  }, 100);
}

// -------------------- TASKS --------------------
function addTask() {
  let input = document.getElementById("taskInput");
  let text = input.value.trim();

  if (!text) return;

  let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
  tasks.push({ text: text, done: false });
  localStorage.setItem("tasks", JSON.stringify(tasks));

  input.value = "";
  loadTasks();
}

function loadTasks() {
  let taskList = document.getElementById("taskList");
  let emptyMsg = document.getElementById("emptyMsg");

  if (!taskList) return;

  taskList.innerHTML = "";

  let tasks = JSON.parse(localStorage.getItem("tasks")) || [];

  if (tasks.length === 0) {
    if (emptyMsg) emptyMsg.style.display = "block";
    return;
  } else {
    if (emptyMsg) emptyMsg.style.display = "none";
  }

  tasks.forEach((task, index) => {
    let li = document.createElement("li");

    li.innerHTML = `
      ${task.text}
      <div>
        <span onclick="completeTask(${index})">✔️</span>
        <span onclick="deleteTask(${index})">❌</span>
      </div>
    `;

    if (task.done) li.style.textDecoration = "line-through";

    taskList.appendChild(li);
  });
}

function completeTask(index) {
  let tasks = JSON.parse(localStorage.getItem("tasks")) || [];

  tasks[index].done = true;
  localStorage.setItem("tasks", JSON.stringify(tasks));

  score += 10;
  localStorage.setItem("score", score);

  document.getElementById("score").innerText = score;

  loadTasks();
}

function deleteTask(index) {
  let tasks = JSON.parse(localStorage.getItem("tasks")) || [];

  tasks.splice(index, 1);
  localStorage.setItem("tasks", JSON.stringify(tasks));

  loadTasks();
}

// -------------------- TIMER --------------------
let t = 1500;
let int;

function startTimer() {
  if (int) return;

  int = setInterval(() => {
    let m = Math.floor(t / 60);
    let s = t % 60;

    let timerEl = document.getElementById("timer");
    if (timerEl) {
      timerEl.innerText = `${m}:${s < 10 ? "0" : ""}${s}`;
    }

    t--;

    if (t < 0) {
      clearInterval(int);
      int = null;
      alert("Time to take a break!");
    }
  }, 1000);
}

// -------------------- CHARTS --------------------
if (document.getElementById("barChart")) {

  new Chart(document.getElementById("barChart"), {
    type: 'bar',
    data: {
      labels: ['Happy', 'Sad', 'Angry'],
      datasets: [{
        label: 'Mood Frequency',
        data: [5, 2, 1],
        backgroundColor: ['#00ffcc', '#ff6b6b', '#ffd93d']
      }]
    }
  });

  new Chart(document.getElementById("lineChart"), {
    type: 'line',
    data: {
      labels: ['Mon', 'Tue', 'Wed'],
      datasets: [{
        label: 'Mood Trend',
        data: [1, 3, 2],
        borderColor: '#00ffcc',
        backgroundColor: 'rgba(0,255,204,0.2)',
        tension: 0.4
      }]
    }
  });

  new Chart(document.getElementById("pieChart"), {
    type: 'doughnut',
    data: {
      labels: ['Work', 'Rest'],
      datasets: [{
        label: 'Activity Split',
        data: [60, 40],
        backgroundColor: ['#00ffcc', '#ff6b6b']
      }]
    }
  });

  // Heatmap
    let heatmap = document.getElementById("heatmap");
    if (heatmap) {
    heatmap.innerHTML = "";

    for (let i = 0; i < 35; i++) {
        let d = document.createElement("div");

        let intensity = Math.random();

        if (intensity > 0.75) d.style.background = "#ff4d6d";
        else if (intensity > 0.5) d.style.background = "#ff8fab";
        else if (intensity > 0.25) d.style.background = "#ffc2d1";
        else d.style.background = "#f1f1f1";

        heatmap.appendChild(d);
    }
    }
}