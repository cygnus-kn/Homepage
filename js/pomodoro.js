// ============================================================
//  POMODORO TIMER MODULE
// ============================================================

function createPomodoroWidget() {
  const container = document.createElement("div");
  container.className = "pomodoro-widget";
  
  // Status circle or icon
  const icon = document.createElement("span");
  icon.className = "pomodoro-icon";
  icon.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 22h14"></path><path d="M5 2h14"></path><path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22"></path><path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2"></path></svg>`;
  
  const timeDisplay = document.createElement("span");
  timeDisplay.className = "pomodoro-time";
  timeDisplay.textContent = "25:00";
  
  container.appendChild(icon);
  container.appendChild(timeDisplay);
  
  let baseMinutes = 25;
  let timeLeft = baseMinutes * 60;
  let isRunning = false;
  let timerInterval = null;
  
  function updateDisplay() {
    const mins = Math.floor(timeLeft / 60);
    const secs = timeLeft % 60;
    timeDisplay.textContent = `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    document.title = isRunning ? `(${timeDisplay.textContent}) ${CONFIG.siteTitle}` : CONFIG.siteTitle;
    
    // Update progress bar
    const totalSecs = baseMinutes * 60;
    const progress = Math.max(0, (timeLeft / totalSecs) * 100);
    container.style.setProperty("--progress", `${progress}%`);
  }
  
  function startTimer() {
    isRunning = true;
    container.classList.add("running");
    timerInterval = setInterval(() => {
      if (timeLeft > 0) {
        timeLeft--;
        updateDisplay();
      } else {
        pauseTimer();
        container.classList.remove("running");
        container.classList.add("finished");
        timeDisplay.textContent = "Done!";
        // Notification API if permitted
        if (Notification.permission === "granted") {
          new Notification("Pomodoro Complete!", { body: "Time to take a break." });
        }
      }
    }, 1000);
  }
  
  function pauseTimer() {
    isRunning = false;
    container.classList.remove("running");
    clearInterval(timerInterval);
    updateDisplay();
  }
  
  function resetTimer() {
    pauseTimer();
    container.classList.remove("finished");
    timeLeft = baseMinutes * 60;
    updateDisplay();
  }
  
  // ── Dropdown Menu ─────────────────────────────────────────
  const dropdown = document.createElement("div");
  dropdown.className = "pomodoro-dropdown";
  dropdown.style.cssText = `
    position: absolute;
    top: 100%;
    right: 0;
    margin-top: 8px;
    background: var(--bg-secondary);
    backdrop-filter: blur(10px);
    border: 1px solid var(--surface-border);
    border-radius: var(--radius-md);
    padding: 8px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 120px;
    opacity: 0;
    pointer-events: none;
    transform: translateY(-10px);
    transition: opacity 0.2s ease, transform 0.2s ease;
    z-index: 1000;
  `;
  container.style.position = "relative"; // Ensure absolute positioning works

  const presets = [15, 30, 45];
  presets.forEach(mins => {
    const btn = document.createElement("button");
    btn.className = "site-option"; // Reuse existing sleek button styles
    btn.textContent = `${mins} minutes`;
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      baseMinutes = mins;
      resetTimer();
      dropdown.style.opacity = "0";
      dropdown.style.pointerEvents = "none";
      dropdown.style.transform = "translateY(-10px)";
    });
    dropdown.appendChild(btn);
  });
  
  // Also add a custom option
  const customBtn = document.createElement("button");
  customBtn.className = "site-option";
  customBtn.textContent = "Custom...";
  customBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    dropdown.style.opacity = "0";
    dropdown.style.pointerEvents = "none";
    dropdown.style.transform = "translateY(-10px)";
    
    // Fall back to the content editable trick
    timeDisplay.contentEditable = "true";
    timeDisplay.style.cursor = "text";
    timeDisplay.focus();
    const range = document.createRange();
    range.selectNodeContents(timeDisplay);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  });
  dropdown.appendChild(customBtn);
  container.appendChild(dropdown);

  timeDisplay.addEventListener("click", (e) => {
    if (!isRunning) {
      e.stopPropagation();
      const isOpen = dropdown.style.opacity === "1";
      dropdown.style.opacity = isOpen ? "0" : "1";
      dropdown.style.pointerEvents = isOpen ? "none" : "auto";
      dropdown.style.transform = isOpen ? "translateY(-10px)" : "translateY(0)";
    }
  });

  document.addEventListener("click", (e) => {
    if (!container.contains(e.target)) {
      dropdown.style.opacity = "0";
      dropdown.style.pointerEvents = "none";
      dropdown.style.transform = "translateY(-10px)";
    }
  });

  function finishEditing() {
    timeDisplay.contentEditable = "false";
    timeDisplay.style.cursor = "";
    
    let rawText = timeDisplay.textContent;
    let newMins = parseInt(rawText.split(":")[0].replace(/[^0-9]/g, ""), 10);
    
    if (!isNaN(newMins) && newMins > 0 && newMins < 999) {
      baseMinutes = newMins;
    }
    resetTimer(); 
  }

  timeDisplay.addEventListener("blur", () => {
    if (timeDisplay.contentEditable === "true") finishEditing();
  });

  timeDisplay.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      timeDisplay.blur();
    }
  });

  // Global Spacebar handling for Pomodoro Play/Pause
  document.addEventListener("keydown", (e) => {
    // Don't trigger if typing in an input, textarea, or renaming a category
    const activeEl = document.activeElement;
    const isTyping = activeEl && (
      activeEl.tagName === "INPUT" || 
      activeEl.tagName === "TEXTAREA" || 
      activeEl.isContentEditable
    );
    
    if (e.code === "Space" && !isTyping) {
      e.preventDefault(); // Stop the website from scrolling down
      
      if (timeLeft === 0) {
        resetTimer();
      } else if (isRunning) {
        pauseTimer();
      } else {
        startTimer();
        if (Notification.permission === "default") {
          Notification.requestPermission();
        }
      }
    }
  });

  container.addEventListener("click", () => {
    if (timeLeft === 0) {
      resetTimer();
    } else if (isRunning) {
      pauseTimer();
    } else {
      startTimer();
      // Ask for notification permission if not yet decided
      if (Notification.permission === "default") {
        Notification.requestPermission();
      }
    }
  });
  
  // Right click to immediately reset
  container.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    resetTimer();
  });
  
  return container;
}
