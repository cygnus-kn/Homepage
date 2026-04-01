// ============================================================
//  CATEGORIES — Rendering, link cards, drag-drop, export/reset
// ============================================================

const allCards = [];

// ── Utility: make a category name inline-editable ─────────
function makeEditable(h2El, originalName) {
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
function buildCategorySection(catName, icon, links, isCustomCat) {
  const renamedCats   = getRenamedCats();
  const deletedLinks  = getDeletedLinks();
  const customLinks   = getCustomLinks();
  const categoryOrders = getCategoryOrders();
  const displayName   = renamedCats[catName] || catName;

  const section = document.createElement("section");
  section.className = "category";
  section.setAttribute("data-category", catName);

  const collapsed = getCollapsedCats();
  if (collapsed.includes(catName)) section.classList.add("collapsed");

  // Header row
  const catHeader = document.createElement("div");
  catHeader.className = "category__header";

  const chevronBtn = document.createElement("button");
  chevronBtn.className = "category__chevron";
  chevronBtn.title = "Toggle Category";
  chevronBtn.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="6 9 12 15 18 9"></polyline>
    </svg>
  `;
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
  h2.className   = "category__name";
  h2.textContent = displayName;
  makeEditable(h2, catName);
  catHeader.appendChild(h2);

  const delCatBtn = document.createElement("button");
  delCatBtn.className   = "category__delete";
  delCatBtn.type        = "button";
  delCatBtn.textContent = "\u2715";
  delCatBtn.title       = "Delete category";
  delCatBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    if (confirm(`Are you sure you want to delete the "${displayName}" category?`)) {
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
  const categoriesContainer = document.createElement("div");
  categoriesContainer.id = "categories";
  app.appendChild(categoriesContainer);

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

  savedCategoryOrder.forEach(savedCatName => {
    const matched = allAvailableCats.find(c => c.name === savedCatName);
    if (matched) {
      categoriesContainer.appendChild(buildCategorySection(matched.name, matched.icon, matched.links, matched.isCustom));
      renderedCatIds.add(matched.name);
    }
  });

  allAvailableCats.forEach((cat) => {
    if (!renderedCatIds.has(cat.name)) {
      categoriesContainer.appendChild(buildCategorySection(cat.name, cat.icon, cat.links, cat.isCustom));
    }
  });

  // Category-level drag-and-drop
  new Sortable(categoriesContainer, {
    group: "homepage-categories",
    handle: ".category__header",
    animation: 250,
    delay: 300,
    delayOnTouchOnly: true,
    ghostClass: "sortable-ghost",
    onEnd: () => {
      const domCats = document.querySelectorAll(".category");
      const order   = Array.from(domCats).map(el => el.getAttribute("data-category"));
      localStorage.setItem("homepage_category_block_orders", JSON.stringify(order));
    }
  });

  // "Add new category" button (outside the sortable container)
  const addCatBtn = document.createElement("button");
  addCatBtn.className   = "add-category-btn";
  addCatBtn.type        = "button";
  addCatBtn.textContent = "+ Add new category";
  addCatBtn.addEventListener("click", () => {
    const internalName = "New Category_" + Date.now();
    const icon = "\uD83D\uDCC1";
    const cats = getCustomCats();
    cats.push({ name: internalName, icon });
    saveCustomCats(cats);

    const section = buildCategorySection(internalName, icon, [], true);
    categoriesContainer.appendChild(section);

    const domCats = document.querySelectorAll(".category");
    const order   = Array.from(domCats).map(el => el.getAttribute("data-category"));
    localStorage.setItem("homepage_category_block_orders", JSON.stringify(order));

    const h2 = section.querySelector(".category__name");
    if (h2) {
      h2.focus();
      const range = document.createRange();
      range.selectNodeContents(h2);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    }
  });
  app.appendChild(addCatBtn);

  return allCards;
}

