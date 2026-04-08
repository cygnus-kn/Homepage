// ============================================================
//  CATEGORIES — Rendering, link cards, drag-drop, export/reset
// ============================================================

const allCards = [];

// ── Utility: make a category name inline-editable ─────────
function makeEditable(h2El, originalName, onRename) {
  h2El.contentEditable = "true";
  h2El.spellcheck = false;
  h2El.style.outline = "none";
  h2El.style.cursor  = "text";

  h2El.addEventListener("blur", () => {
    const newName = h2El.textContent.trim();
    if (newName && newName !== originalName) {
      const renamed = getRenamedCats();
      renamed[originalName] = newName;
      saveRenamedCats(renamed);
      if (onRename) onRename(newName);
    }
  });
  h2El.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); h2El.blur(); }
  });
}

// ── Build a single link card element ──────────────────────
function createLinkEl(link, categoryName, isCustom) {
  const a = document.createElement("a");
  a.className = "link-item";
  a.href      = link.url;
  a.target    = "_blank";
  a.rel       = "noopener noreferrer";
  a.draggable = true;
  a.setAttribute("data-link-title", link.title);
  a.setAttribute("data-link-url",   link.url);
  if (link.iconUrl) a.setAttribute("data-link-icon", link.iconUrl);
  a.setAttribute("data-category", categoryName);
  if (isCustom) a.setAttribute("data-custom", "true");

  let logoUrl = link.iconUrl;
  if (!logoUrl) {
    let hostname = "";
    try { hostname = new URL(link.url).hostname; } catch (e) {}
    logoUrl = `https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=http://${hostname}&size=128`;
  }

  a.innerHTML = `
    <div class="link-item__box">
      <img src="${logoUrl}" class="link-item__logo" alt="" loading="lazy" />
    </div>
    <div class="link-item__title">${link.title}</div>
  `;

  // Desktop right-click
  a.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    showContextMenu(e.clientX, e.clientY, a);
  });

  // Mobile long-press
  let touchTimer;
  let hasMoved = false;
  a.addEventListener("touchstart", (e) => {
    hasMoved = false;
    touchTimer = setTimeout(() => {
      if (!hasMoved) {
        const touch = e.touches[0];
        showContextMenu(touch.clientX, touch.clientY - 70, a);
      }
    }, 600);
  }, { passive: true });
  a.addEventListener("touchmove",   () => { hasMoved = true; clearTimeout(touchTimer); }, { passive: true });
  a.addEventListener("touchend",    () => clearTimeout(touchTimer));
  a.addEventListener("touchcancel", () => clearTimeout(touchTimer));

  return a;
}

// ── Build a full category section ─────────────────────────
function buildCategorySection(catName, icon, links, isCustomCat, onRename, onDeleteClick) {
  const renamedCats   = getRenamedCats();
  const deletedLinks  = getDeletedLinks();
  const customLinks   = getCustomLinks();
  const categoryOrders = getCategoryOrders();
  const displayName   = renamedCats[catName] || catName;

  const section = document.createElement("section");
  section.className = "category";
  section.setAttribute("data-category", catName);

  // Header row
  const catHeader = document.createElement("div");
  catHeader.className = "category__header";

  const h2 = document.createElement("h2");
  h2.className   = "category__name";
  h2.textContent = displayName;
  makeEditable(h2, catName, onRename);
  catHeader.appendChild(h2);

  const delCatBtn = document.createElement("button");
  delCatBtn.className   = "category__delete";
  delCatBtn.type        = "button";
  delCatBtn.textContent = "\u2715";
  delCatBtn.title       = "Delete category";
  delCatBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    if (confirm(`Are you sure you want to delete the "${displayName}" category?`)) {
      if (onDeleteClick) onDeleteClick();
      deleteCategory(section, catName, isCustomCat);
    }
  });
  catHeader.appendChild(delCatBtn);
  section.appendChild(catHeader);

  // Link grid
  const grid = document.createElement("div");
  grid.className = "link-grid";

  let combinedLinks = [];
  const seenUrls = new Set();

  links.forEach((link) => {
    const linkId = catName + "||" + link.url;
    if (!deletedLinks.includes(linkId) && !seenUrls.has(link.url)) {
      combinedLinks.push({ ...link, isCustom: isCustomCat });
      seenUrls.add(link.url);
    }
  });

  if (!isCustomCat) {
    (customLinks[catName] || []).forEach((link) => {
      if (!seenUrls.has(link.url)) {
        combinedLinks.push({ ...link, isCustom: true });
        seenUrls.add(link.url);
      }
    });
  }

  // Sort by saved user order
  const orderArray = categoryOrders[catName];
  if (orderArray && orderArray.length > 0) {
    combinedLinks.sort((a, b) => {
      let idxA = orderArray.indexOf(a.url); if (idxA === -1) idxA = 9999;
      let idxB = orderArray.indexOf(b.url); if (idxB === -1) idxB = 9999;
      return idxA - idxB;
    });
  }

  combinedLinks.forEach((item) => {
    const a = createLinkEl(item, catName, item.isCustom);
    grid.appendChild(a);
    allCards.push({ el: a });
  });

  // Drag-and-drop ordering (SortableJS)
  if (typeof Sortable !== "undefined") {
    Sortable.create(grid, {
      animation: 150,
      easing: "cubic-bezier(1, 0, 0, 1)",
      delay: 300,
      delayOnTouchOnly: true,
      filter: ".add-btn",
      draggable: ".link-item",
      ghostClass: "sortable-ghost",
      onEnd: function () {
        const items = grid.querySelectorAll(".link-item");
        const urls  = Array.from(items).map(item => item.getAttribute("data-link-url"));
        const orders = getCategoryOrders();
        orders[catName] = urls;
        saveCategoryOrders(orders);
      }
    });
  }

  // "+" Add button
  const addBtn = document.createElement("button");
  addBtn.className = "add-btn";
  addBtn.type      = "button";
  addBtn.setAttribute("aria-label", "Add a new link");
  addBtn.innerHTML = `<div class="add-btn__box"><span class="add-btn__icon">+</span></div>`;
  addBtn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    openModal(catName, grid, addBtn);
  });
  grid.appendChild(addBtn);

  section.appendChild(grid);
  return section;
}

// ── Delete a category ──────────────────────────────────────
function deleteCategory(sectionEl, catName, isCustomCat) {
  sectionEl.style.opacity   = "0";
  sectionEl.style.transform = "translateY(-10px)";
  sectionEl.style.transition = "opacity 0.2s ease, transform 0.2s ease";
  setTimeout(() => sectionEl.remove(), 200);

  if (isCustomCat) {
    const cats    = getCustomCats();
    saveCustomCats(cats.filter((c) => c.name !== catName));
    const data = getCustomLinks();
    delete data[catName];
    saveCustomLinks(data);
  } else {
    const cat = CONFIG.categories.find((c) => c.name === catName);
    if (cat) {
      const deleted = getDeletedLinks();
      cat.links.forEach((link) => {
        const linkId = catName + "||" + link.url;
        if (!deleted.includes(linkId)) deleted.push(linkId);
      });
      saveDeletedLinks(deleted);
    }
    const hiddenCats = JSON.parse(localStorage.getItem("homepage_hidden_cats") || "[]");
    if (!hiddenCats.includes(catName)) {
      hiddenCats.push(catName);
      localStorage.setItem("homepage_hidden_cats", JSON.stringify(hiddenCats));
    }
  }
}

// ── Render all categories + category drag-drop + Add Cat ──
function initCategories(app) {
  const layout = document.createElement("div");
  layout.className = "category-layout";

  const sidebarWrapper = document.createElement("div");
  sidebarWrapper.className = "category-sidebar-wrapper";

  // Mobile custom dropdown (hidden on desktop via CSS)
  const mobileDropdown = document.createElement("div");
  mobileDropdown.className = "category-mobile-dropdown";
  mobileDropdown.setAttribute("aria-label", "Select category");

  const mobileDropdownTrigger = document.createElement("button");
  mobileDropdownTrigger.className = "cmd-trigger";
  mobileDropdownTrigger.type = "button";
  mobileDropdownTrigger.innerHTML = `
    <span class="cmd-selected">
      <span class="cmd-sel-icon"></span>
      <span class="cmd-sel-text">Select category</span>
    </span>
    <svg class="cmd-chevron" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
  `;

  const mobileDropdownPanel = document.createElement("div");
  mobileDropdownPanel.className = "cmd-panel";

  mobileDropdown.appendChild(mobileDropdownTrigger);
  mobileDropdown.appendChild(mobileDropdownPanel);
  sidebarWrapper.appendChild(mobileDropdown);

  // Toggle open/close
  mobileDropdownTrigger.addEventListener("click", (e) => {
    e.stopPropagation();
    mobileDropdown.classList.toggle("open");
  });

  // Close on outside click or Escape
  document.addEventListener("click", () => mobileDropdown.classList.remove("open"));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") mobileDropdown.classList.remove("open"); });
  
  const sidebar = document.createElement("div");
  sidebar.className = "category-sidebar";

  sidebarWrapper.appendChild(sidebar);

  const categoriesContainer = document.createElement("div");
  categoriesContainer.id = "categories";
  categoriesContainer.className = "category-content";

  layout.appendChild(sidebarWrapper);
  layout.appendChild(categoriesContainer);
  app.appendChild(layout);

  const hiddenCats          = JSON.parse(localStorage.getItem("homepage_hidden_cats") || "[]");
  const savedCategoryOrder  = JSON.parse(localStorage.getItem("homepage_category_block_orders") || "[]");
  const customLinks         = getCustomLinks();

  const allAvailableCats = [];
  const seenCats = new Set();

  CONFIG.categories.forEach((cat) => {
    if (!hiddenCats.includes(cat.name)) {
      allAvailableCats.push({ name: cat.name, icon: cat.icon, links: cat.links, isCustom: false });
      seenCats.add(cat.name);
    }
  });
  getCustomCats().forEach((cat) => {
    if (!seenCats.has(cat.name)) {
      allAvailableCats.push({ name: cat.name, icon: cat.icon, links: customLinks[cat.name] || [], isCustom: true });
      seenCats.add(cat.name);
    }
  });

  const renderedCatIds = new Set();
  let firstCat = null;
  const tabsMap = {};

  // Helper: update the dropdown trigger display to the active category
  function syncMobileDropdownTrigger(catName, iconHtml, displayName) {
    const selIcon = mobileDropdownTrigger.querySelector(".cmd-sel-icon");
    const selText = mobileDropdownTrigger.querySelector(".cmd-sel-text");
    if (selIcon) selIcon.innerHTML = iconHtml;
    if (selText) selText.textContent = displayName;
  }

  const renderCategory = (cat) => {
    if (renderedCatIds.has(cat.name)) return;
    renderedCatIds.add(cat.name);

    const displayName = getRenamedCats()[cat.name] || cat.name;

    const svgIcons = {
      "Blogs": `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>`,
      "Friends of the Blogs": `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>`,
      "Magazines": `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>`,
      "Education": `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c3 3 9 3 12 0v-5"></path></svg>`,
      "Video Essay": `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect><line x1="7" y1="2" x2="7" y2="22"></line><line x1="17" y1="2" x2="17" y2="22"></line><line x1="2" y1="12" x2="22" y2="12"></line><line x1="2" y1="7" x2="7" y2="7"></line><line x1="2" y1="17" x2="7" y2="17"></line><line x1="17" y1="17" x2="22" y2="17"></line><line x1="17" y1="7" x2="22" y2="7"></line></svg>`,
      "Cinema & TV": `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="15" rx="2" ry="2"></rect><polyline points="17 2 12 7 7 2"></polyline></svg>`,
      "Animation": `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 4V2"></path><path d="M15 16v-2"></path><path d="M8 9h2"></path><path d="M20 9h2"></path><path d="M17.8 11.8L19 13"></path><path d="M15 9h0"></path><path d="M17.8 6.2L19 5"></path><path d="M3 21l9-9"></path><path d="M12.2 6.2L11 5"></path></svg>`,
      "Video game": `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="12" rx="2" ry="2"></rect><path d="M6 12h4"></path><path d="M8 10v4"></path><line x1="15" y1="13" x2="15.01" y2="13"></line><line x1="18" y1="11" x2="18.01" y2="11"></line></svg>`
    };

    // Use a matched elegant SVG icon if mapped, otherwise default folder SVG
    let itemIcon = getCategoryIconsMap()[cat.name] || cat.icon;
    if (!itemIcon || itemIcon === "📁" || itemIcon === "\uD83D\uDCC1") {
      itemIcon = svgIcons[cat.name] || `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>`;
    }

    const tab = document.createElement("button");
    tab.className = "sidebar-tab";
    tab.setAttribute("data-catname", cat.name);
    tab.innerHTML = `<span class="tab-name"><span class="tab-icon" title="Change Icon" style="pointer-events: auto;">${itemIcon}</span> <span class="tab-text">${displayName}</span></span>`;

    // Add a matching row to the mobile custom dropdown panel
    const dropdownItem = document.createElement("button");
    dropdownItem.className = "cmd-item";
    dropdownItem.type = "button";
    dropdownItem.setAttribute("data-catname", cat.name);
    dropdownItem.innerHTML = `<span class="cmd-item-icon" title="Change Icon" style="pointer-events: auto;">${itemIcon}</span><span class="cmd-item-text">${displayName}</span>`;
    
    // Set up icon picker interactions
    const handlePickerTrigger = (e) => {
      if(e.stopPropagation) e.stopPropagation();
      if(typeof showIconPicker === "function") {
        showIconPicker(e.clientX, e.clientY, (newIconHtml) => {
          const tIcon = tab.querySelector(".tab-icon");
          if (tIcon) tIcon.innerHTML = newIconHtml;
          const dItemIcon = dropdownItem.querySelector(".cmd-item-icon");
          if (dItemIcon) dItemIcon.innerHTML = newIconHtml;
          if (tab.classList.contains("active")) {
             syncMobileDropdownTrigger(cat.name, newIconHtml, getRenamedCats()[cat.name] || cat.name);
          }
          itemIcon = newIconHtml;
          if (cat.isCustom) {
             const customCats = getCustomCats();
             const target = customCats.find(c => c.name === cat.name);
             if (target) {
               target.icon = newIconHtml;
               saveCustomCats(customCats);
             }
          } else {
             const map = getCategoryIconsMap();
             map[cat.name] = newIconHtml;
             saveCategoryIconsMap(map);
          }
        });
      }
    };
    
    // Attach to tab-icon and cmd-item-icon
    const tIconElem = tab.querySelector(".tab-icon");
    const dIconElem = dropdownItem.querySelector(".cmd-item-icon");
    
    [tIconElem, dIconElem].forEach(el => {
      if(!el) return;
      el.style.cursor = "pointer";
      el.addEventListener("click", handlePickerTrigger);
      el.addEventListener("contextmenu", (e) => { e.preventDefault(); handlePickerTrigger(e); });
      let touchTimer;
      let hasMovedPicker = false;
      el.addEventListener("touchstart", (e) => {
        hasMovedPicker = false;
        touchTimer = setTimeout(() => {
          if (!hasMovedPicker) {
            const touch = e.touches[0];
            handlePickerTrigger({ clientX: touch.clientX, clientY: touch.clientY - 20, stopPropagation: () => {} });
          }
        }, 600);
      }, { passive: true });
      el.addEventListener("touchmove",   () => { hasMovedPicker = true; clearTimeout(touchTimer); }, { passive: true });
      el.addEventListener("touchend",    () => clearTimeout(touchTimer));
      el.addEventListener("touchcancel", () => clearTimeout(touchTimer));
    });

    dropdownItem.addEventListener("click", (e) => {
      e.stopPropagation();
      if (tabsMap[cat.name]) tabsMap[cat.name].tab.click();
      mobileDropdown.classList.remove("open");
    });
    mobileDropdownPanel.appendChild(dropdownItem);

    const section = buildCategorySection(cat.name, itemIcon, cat.links, cat.isCustom,
      (newName) => {
        const textSpan = tab.querySelector(".tab-text");
        if (textSpan) textSpan.textContent = newName;
        // Also update the dropdown item text
        const dItem = mobileDropdownPanel.querySelector(`[data-catname="${CSS.escape(cat.name)}"] .cmd-item-text`);
        if (dItem) dItem.textContent = newName;
        // Update trigger if this is the active tab
        if (tab.classList.contains("active")) syncMobileDropdownTrigger(cat.name, itemIcon, newName);
      },
      () => {
        tab.remove();
        // Remove dropdown item
        const dItem = mobileDropdownPanel.querySelector(`[data-catname="${CSS.escape(cat.name)}"]`);
        if (dItem) dItem.remove();
        if (tab.classList.contains("active")) {
          const remainingTabs = sidebar.querySelectorAll(".sidebar-tab");
          if (remainingTabs.length > 0) remainingTabs[0].click();
        }
      }
    );

    tab.addEventListener("click", () => {
      sidebar.querySelectorAll(".sidebar-tab").forEach(t => t.classList.remove("active"));
      categoriesContainer.querySelectorAll(".category").forEach(c => c.classList.remove("active-tab"));
      tab.classList.add("active");
      section.classList.add("active-tab");
      localStorage.setItem("homepage_active_tab", cat.name);
      // Sync the mobile dropdown trigger
      syncMobileDropdownTrigger(cat.name, itemIcon, displayName);
      // Highlight active item in panel
      mobileDropdownPanel.querySelectorAll(".cmd-item").forEach(i => i.classList.remove("active"));
      dropdownItem.classList.add("active");
    });

    categoriesContainer.appendChild(section);
    sidebar.appendChild(tab);
    tabsMap[cat.name] = { tab, section };
    if (!firstCat) firstCat = tabsMap[cat.name];
  };

  savedCategoryOrder.forEach(savedCatName => {
    const matched = allAvailableCats.find(c => c.name === savedCatName);
    if (matched) renderCategory(matched);
  });

  allAvailableCats.forEach(cat => renderCategory(cat));

  // "Add new category" button
  const addCatBtn = document.createElement("button");
  addCatBtn.className   = "add-category-btn";
  addCatBtn.type        = "button";
  addCatBtn.textContent = "+ Add new category";
  addCatBtn.addEventListener("click", () => {
    const internalName = "New Category_" + Date.now();
    const icon = ""; // Let it default to the clean SVG
    const cats = getCustomCats();
    cats.push({ name: internalName, icon });
    saveCustomCats(cats);

    renderCategory({ name: internalName, icon, links: [], isCustom: true });

    const domTabs = sidebar.querySelectorAll(".sidebar-tab");
    const order   = Array.from(domTabs).map(el => el.getAttribute("data-catname"));
    localStorage.setItem("homepage_category_block_orders", JSON.stringify(order));

    tabsMap[internalName].tab.click();

    const h2 = tabsMap[internalName].section.querySelector(".category__name");
    if (h2) {
      h2.focus();
      const range = document.createRange();
      range.selectNodeContents(h2);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    }
  });
  sidebarWrapper.appendChild(addCatBtn);

  // Activate saved or first tab
  const savedTab = localStorage.getItem("homepage_active_tab");
  if (savedTab && tabsMap[savedTab]) {
    tabsMap[savedTab].tab.click();
  } else if (firstCat) {
    firstCat.tab.click();
  }

  // Sidebar drag-and-drop
  if (typeof Sortable !== "undefined") {
    new Sortable(sidebar, {
      animation: 250,
      ghostClass: "sortable-ghost",
      onEnd: () => {
        const domTabs = sidebar.querySelectorAll(".sidebar-tab");
        const order   = Array.from(domTabs).map(el => el.getAttribute("data-catname"));
        localStorage.setItem("homepage_category_block_orders", JSON.stringify(order));
      }
    });
  }

  return allCards;
}

