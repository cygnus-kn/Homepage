// ============================================================
//  HOMEPAGE APP — Renders links from config.js
// ============================================================

(function () {
  "use strict";

  const app = document.getElementById("app");
  if (!app || typeof CONFIG === "undefined") return;

  // ── LocalStorage helpers ──────────────────────────────────
  const STORAGE_KEY = "homepage_custom_links";
  const DELETED_KEY = "homepage_deleted_links";
  const RENAMED_KEY = "homepage_renamed_cats";
  const CUSTOM_CATS_KEY = "homepage_custom_cats";
  const ORDERS_KEY = "homepage_category_orders";

  function getCustomLinks() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch {
      return {};
    }
  }

  function saveCustomLinks(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function getDeletedLinks() {
    try {
      return JSON.parse(localStorage.getItem(DELETED_KEY)) || [];
    } catch {
      return [];
    }
  }

  function saveDeletedLinks(data) {
    localStorage.setItem(DELETED_KEY, JSON.stringify(data));
  }

  function getRenamedCats() {
    try {
      return JSON.parse(localStorage.getItem(RENAMED_KEY)) || {};
    } catch {
      return {};
    }
  }

  function saveRenamedCats(data) {
    localStorage.setItem(RENAMED_KEY, JSON.stringify(data));
  }

  function getCustomCats() {
    try {
      return JSON.parse(localStorage.getItem(CUSTOM_CATS_KEY)) || [];
    } catch {
      return [];
    }
  }

  function saveCustomCats(data) {
    localStorage.setItem(CUSTOM_CATS_KEY, JSON.stringify(data));
  }

  function getCategoryOrders() {
    try {
      return JSON.parse(localStorage.getItem(ORDERS_KEY)) || {};
    } catch {
      return {};
    }
  }

  function saveCategoryOrders(data) {
    localStorage.setItem(ORDERS_KEY, JSON.stringify(data));
  }

  const COLLAPSED_KEY = "homepage_collapsed_cats";
  
  function getCollapsedCats() {
    try {
      return JSON.parse(localStorage.getItem(COLLAPSED_KEY)) || [];
    } catch {
      return [];
    }
  }

  function saveCollapsedCats(data) {
    localStorage.setItem(COLLAPSED_KEY, JSON.stringify(data));
  }

  // ── Build Header (top-left, compact) ──────────────────────
  const header = document.createElement("header");
  header.className = "header";
  
  const title = document.createElement("h1");
  title.className = "header__title";
  title.textContent = CONFIG.siteTitle;
  header.appendChild(title);

  // Theme Toggle Button
  const themeBtn = document.createElement("button");
  themeBtn.className = "theme-toggle";
  themeBtn.setAttribute("aria-label", "Toggle Light/Dark Theme");
  const themes = ["dark", "light", "read"];
  const icons = {
    dark: `<svg class="icon-theme" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`,
    light: `<svg class="icon-theme" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`,
    read: `<svg class="icon-theme" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>`
  };

  const savedTheme = localStorage.getItem("homepage_theme") || "dark";
  document.documentElement.setAttribute("data-theme", savedTheme);

  const isToggleRightRaw = localStorage.getItem("homepage_toggle_right");
  let isToggleRight = isToggleRightRaw !== null ? isToggleRightRaw === "true" : true;

  if (isToggleRight) themeBtn.classList.add("is-right");

  function getNextTheme(current) {
    const idx = themes.indexOf(current);
    return themes[(idx + 1) % themes.length];
  }

  function renderToggle(currentTheme) {
    const next = getNextTheme(currentTheme);
    const currIcon = icons[currentTheme];
    const nextIcon = icons[next];

    const isRight = themeBtn.classList.contains("is-right");
    const leftIcon = isRight ? currIcon : nextIcon;
    const rightIcon = isRight ? nextIcon : currIcon;

    themeBtn.innerHTML = `
      <span class="theme-toggle__icons">
        ${leftIcon}
        ${rightIcon}
      </span>
      <span class="theme-toggle__knob"></span>
    `;
  }

  renderToggle(savedTheme);

  themeBtn.addEventListener("click", () => {
    isToggleRight = !isToggleRight;
    themeBtn.classList.toggle("is-right", isToggleRight);
    localStorage.setItem("homepage_toggle_right", isToggleRight);

    const current = document.documentElement.getAttribute("data-theme") || "dark";
    const next = getNextTheme(current);
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("homepage_theme", next);
    
    renderToggle(next);
  });
  
  header.appendChild(themeBtn);
  app.appendChild(header);

  // ── Build Categories ──────────────────────────────────────
  // ── Globals ───────────────────────────────────────────────
  const categoriesContainer = document.createElement("div");
  categoriesContainer.id = "categories";
  app.appendChild(categoriesContainer);

  const customLinks = getCustomLinks();
  const deletedLinks = getDeletedLinks();
  const renamedCats = getRenamedCats();
  const categoryOrders = getCategoryOrders();
  const allCards = [];

  // ── Helper: make a category name editable ─────────────────
  function makeEditable(h2El, originalName) {
    h2El.contentEditable = "true";
    h2El.spellcheck = false;
    h2El.style.outline = "none";
    h2El.style.cursor = "text";

    h2El.addEventListener("blur", () => {
      const newName = h2El.textContent.trim();
      if (newName && newName !== originalName) {
        const renamed = getRenamedCats();
        renamed[originalName] = newName;
        saveRenamedCats(renamed);
      }
    });

    h2El.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        h2El.blur();
      }
    });
  }

  // ── Helper: build a full category section ─────────────────
  function buildCategorySection(catName, icon, links, isCustomCat) {
    const displayName = renamedCats[catName] || catName;

    const section = document.createElement("section");
    section.className = "category";
    section.setAttribute("data-category", catName);

    // Apply collapsed state on load
    const collapsed = getCollapsedCats();
    if (collapsed.includes(catName)) {
      section.classList.add("collapsed");
    }

    const catHeader = document.createElement("div");
    catHeader.className = "category__header";

    // Collapse Chevron
    const chevronBtn = document.createElement("button");
    chevronBtn.className = "category__chevron";
    chevronBtn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="6 9 12 15 18 9"></polyline>
      </svg>
    `;
    chevronBtn.title = "Toggle Category";
    chevronBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      section.classList.toggle("collapsed");
      let cols = getCollapsedCats();
      if (section.classList.contains("collapsed")) {
        if (!cols.includes(catName)) cols.push(catName);
      } else {
        cols = cols.filter(c => c !== catName);
      }
      saveCollapsedCats(cols);
    });
    catHeader.appendChild(chevronBtn);

    const h2 = document.createElement("h2");
    h2.className = "category__name";
    h2.textContent = displayName;
    makeEditable(h2, catName);
    catHeader.appendChild(h2);

    // Delete category button
    const delCatBtn = document.createElement("button");
    delCatBtn.className = "category__delete";
    delCatBtn.type = "button";
    delCatBtn.textContent = "\u2715";
    delCatBtn.title = "Delete category";
    delCatBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (confirm(`Are you sure you want to delete the "${displayName}" category?`)) {
        deleteCategory(section, catName, isCustomCat);
      }
    });
    catHeader.appendChild(delCatBtn);

    section.appendChild(catHeader);

    const grid = document.createElement("div");
    grid.className = "link-grid";

    // Grab all valid links for this category
    let combinedLinks = [];

    links.forEach((link) => {
      const linkId = catName + "||" + link.url;
      if (!deletedLinks.includes(linkId)) {
        combinedLinks.push({ ...link, isCustom: isCustomCat });
      }
    });

    const extras = customLinks[catName] || [];
    if (!isCustomCat) {
      extras.forEach((link) => {
        combinedLinks.push({ ...link, isCustom: true });
      });
    }

    // Sort by saved user order (if any)
    const orderArray = categoryOrders[catName];
    if (orderArray && orderArray.length > 0) {
      combinedLinks.sort((a, b) => {
        let idxA = orderArray.indexOf(a.url);
        let idxB = orderArray.indexOf(b.url);
        if (idxA === -1) idxA = 9999;
        if (idxB === -1) idxB = 9999;
        return idxA - idxB;
      });
    }

    // Render sorted links
    combinedLinks.forEach((item) => {
      const a = createLinkEl(item, catName, item.isCustom);
      grid.appendChild(a);
      allCards.push({ el: a });
    });

    // Initialize SortableJS for smooth drag-and-drop animations
    if (typeof Sortable !== "undefined") {
      Sortable.create(grid, {
        animation: 150,
        easing: "cubic-bezier(1, 0, 0, 1)",
        delay: 300,             // 300ms hold delay before drag starts
        delayOnTouchOnly: true, // Only apply hold delay on mobile mapping to touch screens
        filter: ".add-btn", // Prevent dragging the Add button
        draggable: ".link-item", // Only links are draggable
        ghostClass: "sortable-ghost", // Class added to the dragged item shadow
        onEnd: function () {
          // Save new order
          const items = grid.querySelectorAll(".link-item");
          const urls = Array.from(items).map(item => item.getAttribute("data-link-url"));
          const orders = getCategoryOrders();
          orders[catName] = urls;
          saveCategoryOrders(orders);
        }
      });
    }

    // "+" Add button
    const addBtn = document.createElement("button");
    addBtn.className = "add-btn";
    addBtn.type = "button";
    addBtn.setAttribute("aria-label", "Add a new link");
    addBtn.innerHTML = `
      <div class="add-btn__box">
        <span class="add-btn__icon">+</span>
      </div>
      <div class="add-btn__label">Add</div>
    `;
    addBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      openModal(catName, grid, addBtn);
    });
    grid.appendChild(addBtn);

    section.appendChild(grid);
    return section;
  }

  function createLinkEl(link, categoryName, isCustom) {
    const a = document.createElement("a");
    a.className = "link-item";
    a.href = link.url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.draggable = true;
    a.setAttribute("data-link-title", link.title);
    a.setAttribute("data-link-url", link.url);
    if (link.iconUrl) a.setAttribute("data-link-icon", link.iconUrl);
    a.setAttribute("data-category", categoryName);
    if (isCustom) a.setAttribute("data-custom", "true");

    let logoUrl = link.iconUrl;
    if (!logoUrl) {
      let hostname = "";
      try { hostname = new URL(link.url).hostname; } catch (e) {}
      // The V2 API handles substacks and non-standard icons much better
      logoUrl = `https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=http://${hostname}&size=128`;
    }

    a.innerHTML = `
      <div class="link-item__box">
        <img src="${logoUrl}" class="link-item__logo" alt="" loading="lazy" />
      </div>
      <div class="link-item__title">${link.title}</div>
    `;

    // Right-click context menu (Desktop)
    a.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      showContextMenu(e.clientX, e.clientY, a);
    });

    // Touch-and-hold for Context Menu (Mobile)
    let touchTimer;
    let hasMoved = false;

    a.addEventListener("touchstart", (e) => {
      hasMoved = false;
      touchTimer = setTimeout(() => {
        if (!hasMoved) {
          // Open menu via touch using coordinates
          const touch = e.touches[0];
          showContextMenu(touch.clientX, touch.clientY, a);
        }
      }, 600); // 600ms hold triggers the right-clip box
    }, { passive: true });

    a.addEventListener("touchmove", () => {
      hasMoved = true;
      clearTimeout(touchTimer);
    }, { passive: true });

    a.addEventListener("touchend", () => clearTimeout(touchTimer));
    a.addEventListener("touchcancel", () => clearTimeout(touchTimer));

    return a;
  }

  // Render config categories
  const hiddenCats = JSON.parse(localStorage.getItem("homepage_hidden_cats") || "[]");
  CONFIG.categories.forEach((cat) => {
    if (hiddenCats.includes(cat.name)) return;
    const section = buildCategorySection(cat.name, cat.icon, cat.links, false);
    categoriesContainer.appendChild(section);
  });

  // Render custom (user-created) categories from localStorage
  getCustomCats().forEach((cat) => {
    const links = customLinks[cat.name] || [];
    const section = buildCategorySection(cat.name, cat.icon, links, true);
    categoriesContainer.appendChild(section);
  });

  // ── "Add new category" button ─────────────────────────────
  const addCatBtn = document.createElement("button");
  addCatBtn.className = "add-category-btn";
  addCatBtn.type = "button";
  addCatBtn.textContent = "+ Add new category";
  addCatBtn.addEventListener("click", () => {
    const catName = "New Category";
    const icon = "\uD83D\uDCC1";
    // Use a unique internal key
    const internalName = catName + "_" + Date.now();

    // Save to localStorage
    const cats = getCustomCats();
    cats.push({ name: internalName, icon });
    saveCustomCats(cats);

    // Build and insert before the add-category button
    const section = buildCategorySection(internalName, icon, [], true);
    categoriesContainer.insertBefore(section, addCatBtn);

    // Auto-focus the name so user can rename immediately
    const h2 = section.querySelector(".category__name");
    if (h2) {
      h2.focus();
      // Select all text so user can just type
      const range = document.createRange();
      range.selectNodeContents(h2);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    }
  });
  categoriesContainer.appendChild(addCatBtn);

  // ── Delete Category ───────────────────────────────────────
  function deleteCategory(sectionEl, catName, isCustomCat) {
    // Animate out
    sectionEl.style.opacity = "0";
    sectionEl.style.transform = "translateY(-10px)";
    sectionEl.style.transition = "opacity 0.2s ease, transform 0.2s ease";
    setTimeout(() => sectionEl.remove(), 200);

    if (isCustomCat) {
      // Remove from custom categories list
      const cats = getCustomCats();
      const updated = cats.filter((c) => c.name !== catName);
      saveCustomCats(updated);

      // Remove any links stored for this category
      const data = getCustomLinks();
      delete data[catName];
      saveCustomLinks(data);
    } else {
      // For default categories, mark all their links as deleted
      const cat = CONFIG.categories.find((c) => c.name === catName);
      if (cat) {
        const deleted = getDeletedLinks();
        cat.links.forEach((link) => {
          const linkId = catName + "||" + link.url;
          if (!deleted.includes(linkId)) deleted.push(linkId);
        });
        saveDeletedLinks(deleted);
      }

      // Also store the category itself as hidden
      const hiddenCats = JSON.parse(localStorage.getItem("homepage_hidden_cats") || "[]");
      if (!hiddenCats.includes(catName)) {
        hiddenCats.push(catName);
        localStorage.setItem("homepage_hidden_cats", JSON.stringify(hiddenCats));
      }
    }
  }

  // ── Footer / Export Config ──────────────────────────────────
  const exportBtn = document.createElement("button");
  exportBtn.className = "add-category-btn";
  exportBtn.style.marginTop = "2rem";
  exportBtn.style.marginBottom = "3rem";
  exportBtn.style.background = "var(--text-primary)";
  exportBtn.style.color = "var(--bg-primary)";
  exportBtn.style.fontWeight = "bold";
  exportBtn.textContent = "💾 Download Layout to config.js";
  
  exportBtn.addEventListener("click", () => {
    if (!confirm("This will securely construct your entire displayed layout into code and download it as 'config.js'. Do you want to proceed?")) return;

    const exportCats = [];
    const sections = document.querySelectorAll(".category");
    
    const allConfigCats = CONFIG.categories || [];
    const allCustomCats = getCustomCats();

    sections.forEach((sec) => {
      const catId = sec.getAttribute("data-category");
      let icon = "📁";
      const confCat = allConfigCats.find(c => c.name === catId);
      if (confCat) icon = confCat.icon || "📁";
      else {
        const custCat = allCustomCats.find(c => c.name === catId);
        if (custCat) icon = custCat.icon || "📁";
      }

      const displayName = sec.querySelector(".category__name").textContent.trim();

      const links = [];
      sec.querySelectorAll(".link-item").forEach(a => {
        const l = {
          title: a.getAttribute("data-link-title"),
          url: a.getAttribute("data-link-url")
        };
        const iconUrl = a.getAttribute("data-link-icon");
        if (iconUrl) l.iconUrl = iconUrl;
        links.push(l);
      });

      exportCats.push({
        name: displayName,
        icon: icon,
        links: links
      });
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
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "config.js";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    setTimeout(() => alert("Success! 'config.js' downloaded.\\n\\nTo finalize:\\n1. Drag the file into your GitHub folder (replacing the old one).\\n2. Commit and Push to GitHub.\\n3. CLEAR your phone's Safari Cache entirely so your browser successfully resets onto the master code!"), 600);
  });
  
  app.appendChild(exportBtn);

  const footer = document.createElement("footer");
  footer.className = "footer";
  footer.innerHTML = `Edit <strong>config.js</strong> to customize your links without UI`;
  app.appendChild(footer);

  // ── Staggered Fade-In ─────────────────────────────────────
  requestAnimationFrame(() => {
    allCards.forEach(({ el }, i) => {
      setTimeout(() => el.classList.add("visible"), 30 * i);
    });
  });

  // ── Custom Modal (replaces prompt()) ──────────────────────
  const modalOverlay = document.createElement("div");
  modalOverlay.className = "modal-overlay";
  modalOverlay.innerHTML = `
    <div class="modal">
      <h3 class="modal__title">Add Link</h3>
      <label class="modal__label">
        Name
        <input type="text" class="modal__input" id="modal-name" placeholder="e.g. Spotify" autocomplete="off" />
      </label>
      <label class="modal__label">
        URL
        <input type="url" class="modal__input" id="modal-url" placeholder="e.g. https://spotify.com" autocomplete="off" />
      </label>
      <label class="modal__label">
        Icon URL <span style="font-size: 0.75rem; color: var(--text-muted);">(optional)</span>
        <input type="url" class="modal__input" id="modal-icon" placeholder="Leave empty for auto-detect" autocomplete="off" />
      </label>
      <div class="modal__actions">
        <button type="button" class="modal__btn modal__btn--cancel" id="modal-cancel">Cancel</button>
        <button type="button" class="modal__btn modal__btn--save" id="modal-save">Add</button>
      </div>
    </div>
  `;
  document.body.appendChild(modalOverlay);

  const modalNameInput = document.getElementById("modal-name");
  const modalUrlInput = document.getElementById("modal-url");
  const modalIconInput = document.getElementById("modal-icon");
  const modalCancelBtn = document.getElementById("modal-cancel");
  const modalSaveBtn = document.getElementById("modal-save");

  let currentCategoryName = null;
  let currentGrid = null;
  let currentAddBtn = null;

  function openModal(categoryName, grid, addBtn) {
    currentCategoryName = categoryName;
    currentGrid = grid;
    currentAddBtn = addBtn;
    modalNameInput.value = "";
    modalUrlInput.value = "";
    modalIconInput.value = "";
    modalOverlay.classList.add("active");
    // Focus after the overlay transition
    setTimeout(() => modalNameInput.focus(), 100);
  }

  function closeModal() {
    modalOverlay.classList.remove("active");
    currentCategoryName = null;
    currentGrid = null;
    currentAddBtn = null;
  }

  function saveFromModal() {
    const title = modalNameInput.value.trim();
    const url = modalUrlInput.value.trim();
    const iconUrl = modalIconInput.value.trim();
    if (!title || !url) return;

    const link = { title, url };
    if (iconUrl) link.iconUrl = iconUrl;

    // Save to localStorage
    const data = getCustomLinks();
    if (!data[currentCategoryName]) data[currentCategoryName] = [];
    data[currentCategoryName].push(link);
    saveCustomLinks(data);

    // Insert before the "+" button
    const a = createLinkEl(link, currentCategoryName, true);
    currentGrid.insertBefore(a, currentAddBtn);
    requestAnimationFrame(() => a.classList.add("visible"));

    closeModal();
  }

  modalCancelBtn.addEventListener("click", closeModal);
  modalSaveBtn.addEventListener("click", saveFromModal);

  // Close on overlay click (outside modal)
  modalOverlay.addEventListener("click", (e) => {
    if (e.target === modalOverlay) closeModal();
  });

  // Close on Escape, submit on Enter
  document.addEventListener("keydown", (e) => {
    if (!modalOverlay.classList.contains("active")) return;
    if (e.key === "Escape") closeModal();
    if (e.key === "Enter") saveFromModal();
  });

  // ── Right-Click Context Menu ──────────────────────────────
  const ctxMenu = document.createElement("div");
  ctxMenu.className = "ctx-menu";
  ctxMenu.innerHTML = `
    <button class="ctx-menu__item" data-action="open">🔗  Open in new tab</button>
    <button class="ctx-menu__item" data-action="edit">✏️  Edit</button>
    <div class="ctx-menu__divider"></div>
    <button class="ctx-menu__item ctx-menu__item--danger" data-action="delete">🗑  Delete</button>
  `;
  document.body.appendChild(ctxMenu);

  let ctxTarget = null; // the <a> element that was right-clicked

  function showContextMenu(x, y, linkEl) {
    ctxTarget = linkEl;
    ctxMenu.style.left = x + "px";
    ctxMenu.style.top = y + "px";
    ctxMenu.classList.add("active");

    // Adjust if menu goes off-screen
    requestAnimationFrame(() => {
      const rect = ctxMenu.getBoundingClientRect();
      if (rect.right > window.innerWidth) {
        ctxMenu.style.left = (window.innerWidth - rect.width - 8) + "px";
      }
      if (rect.bottom > window.innerHeight) {
        ctxMenu.style.top = (window.innerHeight - rect.height - 8) + "px";
      }
    });
  }

  function hideContextMenu() {
    ctxMenu.classList.remove("active");
    ctxTarget = null;
  }

  // Handle menu item clicks
  ctxMenu.addEventListener("click", (e) => {
    const btn = e.target.closest(".ctx-menu__item");
    if (!btn || !ctxTarget) return;

    const action = btn.getAttribute("data-action");
    const linkTitle = ctxTarget.getAttribute("data-link-title");
    const linkUrl = ctxTarget.getAttribute("data-link-url");
    const linkIcon = ctxTarget.getAttribute("data-link-icon") || "";
    const catName = ctxTarget.getAttribute("data-category");
    const isCustom = ctxTarget.hasAttribute("data-custom");

    if (action === "open") {
      window.open(linkUrl, "_blank");
    }

    if (action === "edit") {
      // Pre-fill modal for editing — remove old, add new
      deleteLink(ctxTarget, catName, linkTitle, linkUrl, isCustom);
      const grid = ctxTarget.closest(".link-grid");
      const addBtn = grid.querySelector(".add-btn");
      openModal(catName, grid, addBtn);
      modalNameInput.value = linkTitle;
      modalUrlInput.value = linkUrl;
      modalIconInput.value = linkIcon;
    }

    if (action === "delete") {
      deleteLink(ctxTarget, catName, linkTitle, linkUrl, isCustom);
    }

    hideContextMenu();
  });

  function deleteLink(el, catName, linkTitle, linkUrl, isCustom) {
    // Animate out
    el.style.opacity = "0";
    el.style.transform = "scale(0.8)";
    setTimeout(() => el.remove(), 200);

    if (isCustom) {
      // Remove from localStorage
      const data = getCustomLinks();
      if (data[catName]) {
        data[catName] = data[catName].filter(
          (l) => !(l.title === linkTitle && l.url === linkUrl)
        );
        if (data[catName].length === 0) delete data[catName];
        saveCustomLinks(data);
      }
    } else {
      // Mark default link as deleted so it doesn't come back on refresh
      const deleted = getDeletedLinks();
      const linkId = catName + "||" + linkUrl;
      if (!deleted.includes(linkId)) {
        deleted.push(linkId);
        saveDeletedLinks(deleted);
      }
    }
  }

  // Dismiss context menu
  document.addEventListener("click", hideContextMenu);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") hideContextMenu();
  });
  window.addEventListener("scroll", hideContextMenu);
})();
