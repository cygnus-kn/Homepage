// ============================================================
//  EPHEMERAL SCRATCHPAD MODULE
// ============================================================

function initScratchpad() {
  const wrapper = document.createElement("div");
  wrapper.className = "scratchpad-wrapper";
  // Visual clue that it's clickable
  wrapper.title = "Click to open scratchpad";

  const panel = document.createElement("div");
  panel.className = "scratchpad-panel";

  const textarea = document.createElement("textarea");
  textarea.className = "scratchpad-textarea";
  textarea.placeholder = "Jot down a quick thought, a URL, or an idea...\nIt saves instantly, and waits here for you.";
  
  // Load existing notes
  textarea.value = localStorage.getItem("homepage_scratchpad") || "";
  
  // Auto-save on typing
  textarea.addEventListener("input", () => {
    localStorage.setItem("homepage_scratchpad", textarea.value);
  });
  
  let isOpen = false;
  
  function toggleScratchpad() {
    isOpen = !isOpen;
    wrapper.classList.toggle("open", isOpen);
    document.body.classList.toggle("scratchpad-active", isOpen);
    
    if (isOpen) {
      wrapper.title = ""; // remove tooltip when open
      setTimeout(() => textarea.focus(), 300); // Wait for the spin animation to finish
    } else {
      wrapper.title = "Click to open scratchpad";
      textarea.blur();
    }
  }

  // Click the whole wrapper to open it (only if closed)
  wrapper.addEventListener("click", (e) => {
    if (!isOpen) {
      e.stopPropagation();
      toggleScratchpad();
    }
  });

  // Click outside to close (or click the background overlay)
  document.addEventListener("click", (e) => {
    if (isOpen && !wrapper.contains(e.target)) {
      toggleScratchpad();
    }
  });
  
  // Escape key to close
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && isOpen) {
      toggleScratchpad();
    }
  });

  panel.appendChild(textarea);
  wrapper.appendChild(panel);
  
  document.body.appendChild(wrapper);
}
