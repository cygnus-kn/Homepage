// ============================================================
//  HOMEPAGE APP — Orchestrator
//  Modules: js/storage.js → js/nav.js → js/rss.js →
//           js/ui.js → js/categories.js
// ============================================================

(function () {
  "use strict";

  const app = document.getElementById("app");
  if (!app || typeof CONFIG === "undefined") return;

  // 1. Header + theme toggle + sidebar navigation
  initNav(app);

  // 2. RSS feed box
  buildRssFeedBox(app);

  // 3. Category grid (returns all link card elements)
  const cards = initCategories(app);

  // 4. Modal + Context menu (must init after categories exist)
  initModal();
  initContextMenu();
  initIconPicker();

  // 5. Export / Reset actions bar
  initActionsBar(app);

  // 6. Footer
  initFooter(app);


  // 7. Staggered fade-in
  requestAnimationFrame(() => {
    cards.forEach(({ el }, i) => {
      setTimeout(() => el.classList.add("visible"), 30 * i);
    });
  });
})();

// ── Export (Save Layout) + Reset buttons ──────────────────
function initActionsBar(app) {
  const actionsContainer = document.createElement("div");
  actionsContainer.className = "actions-bar";

  const resetBtn = document.createElement("button");
  resetBtn.className   = "action-btn action-btn--reset";
  resetBtn.textContent = "♻️ Reset to Default";
  resetBtn.addEventListener("click", () => {
    if (confirm("Are you sure you want to discard your browser's local edits and fully restore your layout directly from the master 'config.js' file?")) {
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith("homepage_")) keys.push(k);
      }
      keys.forEach(k => {
        if (k !== "homepage_theme" && k !== "homepage_toggle_right") localStorage.removeItem(k);
      });
      window.location.reload();
    }
  });

  const exportBtn = document.createElement("button");
  exportBtn.className   = "action-btn action-btn--export";
  exportBtn.textContent = "💾 Save Layout";
  exportBtn.addEventListener("click", () => {
    if (!confirm("This will securely construct your entire displayed layout into code and download it as 'config.js'. Do you want to proceed?")) return;

    const exportCats = [];
    const sections   = document.querySelectorAll(".category");
    const allConfigCats = CONFIG.categories || [];
    const allCustomCats = getCustomCats();

    sections.forEach((sec) => {
      const catId    = sec.getAttribute("data-category");
      let icon       = "📁";
      const confCat  = allConfigCats.find(c => c.name === catId);
      if (confCat) icon = confCat.icon || "📁";
      else {
        const custCat = allCustomCats.find(c => c.name === catId);
        if (custCat) icon = custCat.icon || "📁";
      }

      const displayName = sec.querySelector(".category__name").textContent.trim();
      const links = [];
      sec.querySelectorAll(".link-item").forEach(a => {
        const l = { title: a.getAttribute("data-link-title"), url: a.getAttribute("data-link-url") };
        const iconUrl = a.getAttribute("data-link-icon");
        if (iconUrl) l.iconUrl = iconUrl;
        links.push(l);
      });

      exportCats.push({ name: displayName, icon, links });
    });

    const fileContent = `// ============================================================
//  HOMEPAGE CONFIGURATION
//  Edit this file to customize your homepage links & settings.
//  No other files need to be changed!
// ============================================================

const CONFIG = {
  siteTitle: ${JSON.stringify(CONFIG.siteTitle)},
  categories: ${JSON.stringify(exportCats, null, 4).replace(/"([^"]+)":/g, '$1:')}
};
`;

    const blob = new Blob([fileContent], { type: "text/javascript" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = "config.js";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setTimeout(() => alert("Success! 'config.js' downloaded.\n\nTo finalize:\n1. Drag the file into your GitHub folder (replacing the old one).\n2. Commit and Push to GitHub.\n3. CLEAR your phone's Safari Cache entirely so your browser successfully resets onto the master code!"), 600);
  });

  actionsContainer.appendChild(resetBtn);
  actionsContainer.appendChild(exportBtn);
  app.appendChild(actionsContainer);
}
