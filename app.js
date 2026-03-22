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

  // ── Utility: relative time display ─────────────────────────
  function timeAgo(dateString) {
    const timestamp = new Date(dateString).getTime();
    if (isNaN(timestamp)) return dateString;
    const seconds = Math.floor((new Date() - timestamp) / 1000);
    const intervals = { year: 31536000, month: 2592000, week: 604800, day: 86400, hour: 3600, minute: 60 };
    for (const [unit, secs] of Object.entries(intervals)) {
      const interval = Math.floor(seconds / secs);
      if (interval >= 1) return interval + ' ' + unit + (interval === 1 ? '' : 's') + ' ago';
    }
    return "Just now";
  }

  // ── Collect RSS sources from the "Blogs" category ─────────
  function collectRssSources() {
    const renamedCats = getRenamedCats();
    const customCats = getCustomCats();
    const deletedLinks = getDeletedLinks();
    const customLinks = getCustomLinks();

    // Find the category that represents "Blogs" (checking both original and renamed names)
    let blogsNode = CONFIG.categories.find(c => c.name === "Blogs" || renamedCats[c.name] === "Blogs");
    if (!blogsNode) {
      blogsNode = customCats.find(c => c.name === "Blogs" || renamedCats[c.name] === "Blogs");
    }
    if (!blogsNode) return [];

    const blogsKey = blogsNode.name;
    let blogsLinks = [];

    // Add base links from config if it's a default category
    if (CONFIG.categories.some(c => c.name === blogsKey)) {
      (blogsNode.links || []).forEach(link => {
        const linkId = blogsKey + "||" + link.url;
        if (!deletedLinks.includes(linkId)) blogsLinks.push(link);
      });
    }

    // Add custom links added via the UI
    const extras = customLinks[blogsKey] || [];
    extras.forEach(link => blogsLinks.push(link));

    // Convert blog links to RSS feed URLs
    return blogsLinks.map(link => {
      let fUrl = link.url;
      if (!fUrl.endsWith('.xml') && !fUrl.includes('rss')) {
        fUrl = fUrl.endsWith('/') ? fUrl + "feed" : fUrl + "/feed";
      }
      return { name: link.title, url: fUrl };
    });
  }

  // ── Create a single feed item row ─────────────────────────
  function createFeedItem(article, index, hiddenArticles) {
    let domain = "";
    try { domain = new URL(article.link).hostname.replace('www.', ''); } catch (e) {}

    const row = document.createElement("div");
    row.className = "feed-item";
    row.innerHTML = `
      <span class="feed-item__number">${index + 1}.</span>
      <div class="feed-item__main">
        <div class="feed-item__titleRow">
          <a href="${article.link}" target="_blank" class="feed-item__title" style="text-decoration: none; color: inherit;">${article.title}</a>
          <span class="feed-item__domain">(${domain})</span>
        </div>
        <div class="feed-item__meta">
          <span class="feed-item__date">${timeAgo(article.pubDate)}</span>
          <span style="opacity: 0.5; margin: 0 4px;">•</span>
          <span style="opacity: 0.5; margin-right: 4px;">by</span>
          <span class="feed-item__source">${article.blogName}</span>
        </div>
      </div>
      <button class="feed-item__hide" title="Hide this article">✕</button>
    `;
    const hideBtn = row.querySelector(".feed-item__hide");
    hideBtn.addEventListener("click", (e) => {
      e.preventDefault();
      hiddenArticles.push(article.link);
      localStorage.setItem('homepage_hidden_articles', JSON.stringify(hiddenArticles));
      row.remove();
    });
    return row;
  }

  // ── Build RSS Feed Box ────────────────────────────────────
  function buildRssFeedBox(appEl) {
    const RssSources = collectRssSources();
    if (RssSources.length === 0) return;

    const hiddenArticles = JSON.parse(localStorage.getItem('homepage_hidden_articles') || '[]');

    const feedBox = document.createElement("div");
    feedBox.className = "feed-box";
    const feedContent = document.createElement("div");
    feedContent.className = "feed-content";
    feedContent.innerHTML = `<div class="feed-loading">Loading articles...</div>`;
    feedBox.appendChild(feedContent);
    appEl.appendChild(feedBox);

    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
    const cutoffTime = Date.now() - SEVEN_DAYS_MS;

    (async function() {
      try {
        const fetchPromises = RssSources.map(async (source) => {
          const proxyUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(source.url)}`;
          try {
            const response = await fetch(proxyUrl);
            const data = await response.json();
            if (data.status === "ok") {
              return data.items
                .filter(item => new Date(item.pubDate).getTime() >= cutoffTime)
                .slice(0, 3)
                .map(item => ({...item, blogName: source.name}));
            }
          } catch (e) {}
          return [];
        });

        let allArticles = await Promise.all(fetchPromises);
        allArticles = allArticles.flat();
        let validArticles = allArticles.filter(item => !hiddenArticles.includes(item.link));
        validArticles.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

        const newestArticles = validArticles.slice(0, 20);
        feedContent.innerHTML = "";
        
        if (newestArticles.length === 0) {
          feedContent.innerHTML = `<div class="feed-loading">No recent writings found.</div>`;
          return;
        }

        newestArticles.forEach((article, index) => {
          feedContent.appendChild(createFeedItem(article, index, hiddenArticles));
        });
      } catch(e) {
        feedContent.innerHTML = `<div class="feed-loading">Failed to fetch recent writings.</div>`;
      }
    })();
  }
  buildRssFeedBox(app);

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

    const catIcons = {
      "Blogs": `<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>`,
      "Magazines": `<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z"/></svg>`,
      "Education": `<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>`,
      "Video Essay": `<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>`,
      "Cinema & TV": `<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="2.5" ry="2.5"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/><line x1="2" y1="17" x2="7" y2="17"/><line x1="17" y1="17" x2="22" y2="17"/><line x1="17" y1="7" x2="22" y2="7"/></svg>`,
      "Animation": `<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>`,
      "Video game": `<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="6" y1="12" x2="10" y2="12"/><line x1="8" y1="10" x2="8" y2="14"/><line x1="15" y1="13" x2="15.01" y2="13"/><line x1="18" y1="11" x2="18.01" y2="11"/><rect x="2" y="6" width="20" height="12" rx="2"/></svg>`
    };

    if (catIcons[catName] || icon) {
      const iconSpan = document.createElement("span");
      iconSpan.className = "category__icon";
      iconSpan.style.marginRight = "8px";
      iconSpan.style.display = "flex";
      iconSpan.style.alignItems = "center";
      iconSpan.style.color = "var(--text-muted)";
      iconSpan.innerHTML = catIcons[catName] || `<span style="font-size:1.1rem; filter: saturate(0.5); opacity:0.8;">${icon}</span>`;
      catHeader.appendChild(iconSpan);
    }

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
  // ── Render All Categories with Ordering Persistence ──────
  const hiddenCats = JSON.parse(localStorage.getItem("homepage_hidden_cats") || "[]");
  let savedCategoryOrder = JSON.parse(localStorage.getItem("homepage_category_block_orders") || "[]");

  // Collect all available categories
  const allAvailableCats = [];
  CONFIG.categories.forEach((cat) => {
    if (!hiddenCats.includes(cat.name)) {
      allAvailableCats.push({ name: cat.name, icon: cat.icon, links: cat.links, isCustom: false });
    }
  });
  getCustomCats().forEach((cat) => {
    allAvailableCats.push({ name: cat.name, icon: cat.icon, links: customLinks[cat.name] || [], isCustom: true });
  });

  // Render them based on saved layout array (defaulting remainder at the bottom)
  const renderedCatIds = new Set();
  
  // 1. Render those present in the saved order array securely
  savedCategoryOrder.forEach(savedCatName => {
    const matched = allAvailableCats.find(c => c.name === savedCatName);
    if (matched) {
      const section = buildCategorySection(matched.name, matched.icon, matched.links, matched.isCustom);
      categoriesContainer.appendChild(section);
      renderedCatIds.add(matched.name);
    }
  });

  // 2. Render any brand new/un-ordered ones at the bottom
  allAvailableCats.forEach((cat) => {
    if (!renderedCatIds.has(cat.name)) {
      const section = buildCategorySection(cat.name, cat.icon, cat.links, cat.isCustom);
      categoriesContainer.appendChild(section);
    }
  });

  // ── Initialize Category Drag-and-Drop ─────────────────────
  new Sortable(categoriesContainer, {
    group: "homepage-categories",
    handle: ".category__header", // Users hold the header area to drag
    animation: 250,
    delay: 300,
    delayOnTouchOnly: true,
    ghostClass: "sortable-ghost",
    onEnd: () => {
      // Build an array mapped exclusively to active structural placement
      const domCats = document.querySelectorAll(".category");
      const order = Array.from(domCats).map(el => el.getAttribute("data-category"));
      localStorage.setItem("homepage_category_block_orders", JSON.stringify(order));
    }
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

    // Build and append visually exactly at the bottom of the grid
    const section = buildCategorySection(internalName, icon, [], true);
    categoriesContainer.appendChild(section);
    
    // Log new structural order securely
    const domCats = document.querySelectorAll(".category");
    const order = Array.from(domCats).map(el => el.getAttribute("data-category"));
    localStorage.setItem("homepage_category_block_orders", JSON.stringify(order));

    // Auto-focus the name so user can rename immediately
    const h2 = section.querySelector(".category__name");
    if (h2) {
      h2.focus();
      // Select all text natively smoothly
      const range = document.createRange();
      range.selectNodeContents(h2);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    }
  });
  
  app.appendChild(addCatBtn); // Append securely detached from the sortable container!

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
  const actionsContainer = document.createElement("div");
  actionsContainer.className = "actions-bar";
  
  const resetBtn = document.createElement("button");
  resetBtn.className = "action-btn action-btn--reset";
  resetBtn.textContent = "♻️ Reset to Default";

  const exportBtn = document.createElement("button");
  exportBtn.className = "action-btn action-btn--export";
  exportBtn.textContent = "💾 Save Layout";
  
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
  
  resetBtn.addEventListener("click", () => {
    if (confirm("Are you sure you want to discard your browser's local edits and fully restore your layout directly from the master 'config.js' file?")) {
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith("homepage_")) keys.push(k);
      }
      keys.forEach(k => {
        if (k !== "homepage_theme" && k !== "homepage_toggle_right") {
          localStorage.removeItem(k);
        }
      });
      window.location.reload();
    }
  });

  actionsContainer.appendChild(resetBtn);
  actionsContainer.appendChild(exportBtn);
  app.appendChild(actionsContainer);

  const footer = document.createElement("footer");
  footer.className = "footer";
  footer.innerHTML = `<div>Edit <strong>config.js</strong> to customize your links without UI</div>`;
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
  let editingLinkData = null;

  function openModal(categoryName, grid, addBtn, editData = null) {
    currentCategoryName = categoryName;
    currentGrid = grid;
    currentAddBtn = addBtn;
    editingLinkData = editData;

    if (editData) {
      modalNameInput.value = editData.title || "";
      modalUrlInput.value = editData.url || "";
      modalIconInput.value = editData.icon || "";
    } else {
      modalNameInput.value = "";
      modalUrlInput.value = "";
      modalIconInput.value = "";
    }

    modalOverlay.classList.add("active");
    // Focus after the overlay transition
    setTimeout(() => modalNameInput.focus(), 100);
  }

  function closeModal() {
    modalOverlay.classList.remove("active");
    currentCategoryName = null;
    currentGrid = null;
    currentAddBtn = null;
    editingLinkData = null;
  }

  function saveFromModal() {
    const title = modalNameInput.value.trim();
    const url = modalUrlInput.value.trim();
    const iconUrl = modalIconInput.value.trim();
    if (!title || !url) return;

    const link = { title, url };
    if (iconUrl) link.iconUrl = iconUrl;

    if (editingLinkData) {
      // Remove old data mapping
      if (editingLinkData.isCustom) {
        let data = getCustomLinks();
        if (data[currentCategoryName]) {
          data[currentCategoryName] = data[currentCategoryName].filter(
            (l) => !(l.title === editingLinkData.title && l.url === editingLinkData.url)
          );
          saveCustomLinks(data);
        }
      } else {
        // Mark old default link as deleted
        const deleted = getDeletedLinks();
        const linkId = currentCategoryName + "||" + editingLinkData.url;
        if (!deleted.includes(linkId)) {
          deleted.push(linkId);
          saveDeletedLinks(deleted);
        }
      }

      // Add new link mapping as custom
      let data = getCustomLinks();
      if (!data[currentCategoryName]) data[currentCategoryName] = [];
      data[currentCategoryName].push(link);
      saveCustomLinks(data);

      // Swap elements directly to preserve grid order
      const a = createLinkEl(link, currentCategoryName, true);
      const el = editingLinkData.el;
      if (el && el.parentNode) {
        el.parentNode.replaceChild(a, el);
        
        // Preserve position in user's saved sort order if the URL changed!
        const orders = getCategoryOrders();
        if (orders[currentCategoryName]) {
           const idx = orders[currentCategoryName].indexOf(editingLinkData.url);
           if (idx !== -1) {
             orders[currentCategoryName][idx] = link.url;
             saveCategoryOrders(orders);
           }
        }
      } else {
        currentGrid.insertBefore(a, currentAddBtn);
      }
      requestAnimationFrame(() => a.classList.add("visible"));
      closeModal();
      return;
    }

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
      const grid = ctxTarget.closest(".link-grid");
      const addBtn = grid.querySelector(".add-btn");
      const editData = {
        title: linkTitle,
        url: linkUrl,
        icon: linkIcon,
        isCustom: isCustom,
        catName: catName,
        el: ctxTarget
      };
      openModal(catName, grid, addBtn, editData);
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
