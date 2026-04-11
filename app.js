// == js/storage.js == 
// ============================================================
//  STORAGE — localStorage get/save helpers
// ============================================================

const STORAGE_KEY     = "homepage_custom_links";
const DELETED_KEY     = "homepage_deleted_links";
const RENAMED_KEY     = "homepage_renamed_cats";
const CUSTOM_CATS_KEY = "homepage_custom_cats";
const ORDERS_KEY      = "homepage_category_orders";
const COLLAPSED_KEY   = "homepage_collapsed_cats";
const CATEGORY_ICONS_KEY = "homepage_category_icons";

function getCustomLinks() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; } catch { return {}; }
}
function saveCustomLinks(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function getDeletedLinks() {
  try { return JSON.parse(localStorage.getItem(DELETED_KEY)) || []; } catch { return []; }
}
function saveDeletedLinks(data) {
  localStorage.setItem(DELETED_KEY, JSON.stringify(data));
}

function getRenamedCats() {
  try { return JSON.parse(localStorage.getItem(RENAMED_KEY)) || {}; } catch { return {}; }
}
function saveRenamedCats(data) {
  localStorage.setItem(RENAMED_KEY, JSON.stringify(data));
}

function getCustomCats() {
  try { return JSON.parse(localStorage.getItem(CUSTOM_CATS_KEY)) || []; } catch { return []; }
}
function saveCustomCats(data) {
  localStorage.setItem(CUSTOM_CATS_KEY, JSON.stringify(data));
}

function getCategoryOrders() {
  try { return JSON.parse(localStorage.getItem(ORDERS_KEY)) || {}; } catch { return {}; }
}
function saveCategoryOrders(data) {
  localStorage.setItem(ORDERS_KEY, JSON.stringify(data));
}

function getCollapsedCats() {
  try { return JSON.parse(localStorage.getItem(COLLAPSED_KEY)) || []; } catch { return []; }
}
function saveCollapsedCats(data) {
  localStorage.setItem(COLLAPSED_KEY, JSON.stringify(data));
}

function getCategoryIconsMap() {
  try { return JSON.parse(localStorage.getItem(CATEGORY_ICONS_KEY)) || {}; } catch { return {}; }
}
function saveCategoryIconsMap(data) {
  localStorage.setItem(CATEGORY_ICONS_KEY, JSON.stringify(data));
}


// == js/nav.js == 
// ============================================================
//  NAV — Header, theme toggle, navigation, footer
// ============================================================

function initNav(app) {
  // ── Header Target Nodes ───────────────────────────────────
  const centerTarget = document.getElementById("topbar-center");
  const controlsTarget = document.getElementById("topbar-controls");

  const title = document.createElement("h1");
  title.className = "header__title";
  title.textContent = CONFIG.siteTitle;
  if(centerTarget) centerTarget.appendChild(title);

  // ── Theme Toggle ──────────────────────────────────────────
  const themeBtn = document.createElement("button");
  themeBtn.className = "theme-toggle";
  themeBtn.setAttribute("aria-label", "Toggle Light/Dark Theme");

  const themes = ["dark", "light", "read"];
  const icons = {
    dark:  `<svg class="icon-theme" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`,
    light: `<svg class="icon-theme" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`,
    read:  `<svg class="icon-theme" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>`
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
    const isRight = themeBtn.classList.contains("is-right");
    const leftIcon  = isRight ? icons[currentTheme] : icons[next];
    const rightIcon = isRight ? icons[next]          : icons[currentTheme];
    themeBtn.innerHTML = `
      <span class="theme-toggle__icons">${leftIcon}${rightIcon}</span>
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

    const statsIframe = document.querySelector("#stats-view iframe");
    if (statsIframe && statsIframe.contentWindow) {
      statsIframe.contentWindow.postMessage({ theme: next }, "*");
    }

    renderToggle(next);
  });

  const controls = document.createElement("div");
  controls.className = "header__controls";
  
  if (typeof createPomodoroWidget === "function") {
    controls.appendChild(createPomodoroWidget());
  }
  controls.appendChild(themeBtn);

  if(controlsTarget) controlsTarget.appendChild(controls);

  // ── Navigation sidebar ────────────────────────────────────
  const navHome      = document.getElementById("nav-home");
  const navStats     = document.getElementById("nav-stats");
  const homeView     = document.getElementById("home-view");
  const statsView    = document.getElementById("stats-view");
  const siteMenu     = document.getElementById("site-menu");
  const sidebarToggle = document.getElementById("sidebar-toggle");

  if (sidebarToggle && siteMenu) {
    sidebarToggle.addEventListener("click", (e) => {
      e.stopPropagation();
      siteMenu.classList.toggle("open");
    });
    document.addEventListener("click", (e) => {
      if (!siteMenu.contains(e.target) && e.target !== sidebarToggle && !sidebarToggle.contains(e.target)) {
        siteMenu.classList.remove("open");
      }
    });
  }

  if (navHome && navStats && homeView && statsView) {
    navHome.addEventListener("click", () => {
      navHome.classList.add("active");
      navStats.classList.remove("active");
      homeView.classList.add("active");
      statsView.classList.remove("active");
      if (siteMenu) siteMenu.classList.remove("open");
    });

    navStats.addEventListener("click", () => {
      navStats.classList.add("active");
      navHome.classList.remove("active");
      statsView.classList.add("active");
      homeView.classList.remove("active");
      if (siteMenu) siteMenu.classList.remove("open");

      const iframe = document.getElementById("stats-iframe");
      if (iframe && !iframe.getAttribute("src")) {
        iframe.setAttribute("src", iframe.getAttribute("data-src"));
      }
    });
  }
}

function initFooter(app) {
  const footer = document.createElement("footer");
  footer.className = "footer";
  footer.innerHTML = `<div>Edit <strong>config.js</strong> to customize your links without UI</div>`;
  app.appendChild(footer);
}


// == js/rss.js == 
// ============================================================
//  RSS — Feed collection, fetching, and rendering
// ============================================================

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

function collectRssSources() {
  const renamedCats  = getRenamedCats();
  const customCats   = getCustomCats();
  const deletedLinks = getDeletedLinks();
  const customLinks  = getCustomLinks();

  let blogsNode = CONFIG.categories.find(c => c.name === "Blogs" || renamedCats[c.name] === "Blogs");
  if (!blogsNode) blogsNode = customCats.find(c => c.name === "Blogs" || renamedCats[c.name] === "Blogs");
  if (!blogsNode) return [];

  const blogsKey = blogsNode.name;
  let blogsLinks = [];

  if (CONFIG.categories.some(c => c.name === blogsKey)) {
    (blogsNode.links || []).forEach(link => {
      const linkId = blogsKey + "||" + link.url;
      if (!deletedLinks.includes(linkId)) blogsLinks.push(link);
    });
  }

  (customLinks[blogsKey] || []).forEach(link => blogsLinks.push(link));

  return blogsLinks.map(link => {
    let fUrl = link.url;
    if (!fUrl.endsWith('.xml') && !fUrl.includes('rss')) {
      fUrl = fUrl.endsWith('/') ? fUrl + "feed" : fUrl + "/feed";
    }
    return { name: link.title, url: fUrl };
  });
}

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
  row.querySelector(".feed-item__hide").addEventListener("click", (e) => {
    e.preventDefault();
    hiddenArticles.push(article.link);
    localStorage.setItem('homepage_hidden_articles', JSON.stringify(hiddenArticles));
    row.remove();
  });
  return row;
}

function createSkeletonLoader(count = 5) {
  return Array.from({ length: count }, (_, i) => `
    <div class="feed-skeleton" style="animation-delay: ${i * 0.1}s">
      <div class="feed-skeleton__number"></div>
      <div class="feed-skeleton__main">
        <div class="feed-skeleton__title" style="width: ${70 + Math.floor((i * 37) % 25)}%"></div>
        <div class="feed-skeleton__meta"></div>
      </div>
    </div>
  `).join("");
}

function buildRssFeedBox(appEl) {
  const RssSources = collectRssSources();
  if (RssSources.length === 0) return;

  const hiddenArticles = JSON.parse(localStorage.getItem('homepage_hidden_articles') || '[]');

  const feedBox = document.createElement("div");
  feedBox.className = "feed-box";
  const feedContent = document.createElement("div");
  feedContent.className = "feed-content";
  feedContent.innerHTML = createSkeletonLoader(5);
  feedBox.appendChild(feedContent);
  appEl.appendChild(feedBox);

  const cutoffTime = Date.now() - 7 * 24 * 60 * 60 * 1000;

  (async function () {
    try {
      const CACHE_LIFETIME = 60 * 60 * 1000;
      const fetchPromises = RssSources.map(async (source) => {
        const cacheKey = `rss_cache_${source.url}`;
        try {
          const cached = localStorage.getItem(cacheKey);
          if (cached) {
            const parsed = JSON.parse(cached);
            if (Date.now() - parsed.timestamp < CACHE_LIFETIME) return parsed.data;
          }
        } catch (e) {}

        const proxyUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(source.url)}`;
        try {
          const response = await fetch(proxyUrl);
          const data = await response.json();
          if (data.status === "ok") {
            const items = data.items
              .filter(item => new Date(item.pubDate).getTime() >= cutoffTime)
              .slice(0, 3)
              .map(item => ({ ...item, blogName: source.name }));
            localStorage.setItem(cacheKey, JSON.stringify({ timestamp: Date.now(), data: items }));
            return items;
          }
        } catch (e) {}
        return [];
      });

      let allArticles = (await Promise.all(fetchPromises)).flat();
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
    } catch (e) {
      feedContent.innerHTML = `<div class="feed-loading">Failed to fetch recent writings.</div>`;
    }
  })();
}


// == js/ui.js == 
// ============================================================
//  UI — Modal dialog + Context menu + Link deletion
//  (These are tightly coupled: context menu triggers modal,
//   both operate on the same link data)
// ============================================================

// ── Modal state ─────────────────────────────────────────────
let _currentCategoryName = null;
let _currentGrid         = null;
let _currentAddBtn       = null;
let _editingLinkData     = null;
let _modalOverlay, _modalNameInput, _modalUrlInput, _modalIconInput;

// ── Context menu state ──────────────────────────────────────
let _ctxMenu   = null;
let _ctxTarget = null;

// ────────────────────────────────────────────────────────────
//  MODAL
// ────────────────────────────────────────────────────────────

function initModal() {
  _modalOverlay = document.createElement("div");
  _modalOverlay.className = "modal-overlay";
  _modalOverlay.innerHTML = `
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
        <button type="button" class="modal__btn modal__btn--save"   id="modal-save">Add</button>
      </div>
    </div>
  `;
  document.body.appendChild(_modalOverlay);

  _modalNameInput = document.getElementById("modal-name");
  _modalUrlInput  = document.getElementById("modal-url");
  _modalIconInput = document.getElementById("modal-icon");

  document.getElementById("modal-cancel").addEventListener("click", closeModal);
  document.getElementById("modal-save").addEventListener("click", saveFromModal);

  _modalOverlay.addEventListener("click", (e) => {
    if (e.target === _modalOverlay) closeModal();
  });

  document.addEventListener("keydown", (e) => {
    if (!_modalOverlay.classList.contains("active")) return;
    if (e.key === "Escape") closeModal();
    if (e.key === "Enter")  saveFromModal();
  });
}

function openModal(categoryName, grid, addBtn, editData = null) {
  _currentCategoryName = categoryName;
  _currentGrid         = grid;
  _currentAddBtn       = addBtn;
  _editingLinkData     = editData;

  if (editData) {
    _modalNameInput.value = editData.title || "";
    _modalUrlInput.value  = editData.url   || "";
    _modalIconInput.value = editData.icon  || "";
  } else {
    _modalNameInput.value = "";
    _modalUrlInput.value  = "";
    _modalIconInput.value = "";
  }

  _modalOverlay.classList.add("active");
  setTimeout(() => _modalNameInput.focus(), 100);
}

function closeModal() {
  _modalOverlay.classList.remove("active");
  _currentCategoryName = null;
  _currentGrid         = null;
  _currentAddBtn       = null;
  _editingLinkData     = null;
}

function saveFromModal() {
  const title   = _modalNameInput.value.trim();
  const url     = _modalUrlInput.value.trim();
  const iconUrl = _modalIconInput.value.trim();
  if (!title || !url) return;

  const link = { title, url };
  if (iconUrl) link.iconUrl = iconUrl;

  if (_editingLinkData) {
    // Remove old entry
    if (_editingLinkData.isCustom) {
      let data = getCustomLinks();
      if (data[_currentCategoryName]) {
        data[_currentCategoryName] = data[_currentCategoryName].filter(
          (l) => !(l.title === _editingLinkData.title && l.url === _editingLinkData.url)
        );
        saveCustomLinks(data);
      }
    } else {
      const deleted = getDeletedLinks();
      const linkId = _currentCategoryName + "||" + _editingLinkData.url;
      if (!deleted.includes(linkId)) {
        deleted.push(linkId);
        saveDeletedLinks(deleted);
      }
    }

    // Save updated entry
    let data = getCustomLinks();
    if (!data[_currentCategoryName]) data[_currentCategoryName] = [];
    data[_currentCategoryName].push(link);
    saveCustomLinks(data);

    // Swap DOM element in place
    const a = createLinkEl(link, _currentCategoryName, true);
    const el = _editingLinkData.el;
    if (el && el.parentNode) {
      el.parentNode.replaceChild(a, el);
      const orders = getCategoryOrders();
      if (orders[_currentCategoryName]) {
        const idx = orders[_currentCategoryName].indexOf(_editingLinkData.url);
        if (idx !== -1) {
          orders[_currentCategoryName][idx] = link.url;
          saveCategoryOrders(orders);
        }
      }
    } else {
      _currentGrid.insertBefore(a, _currentAddBtn);
    }
    requestAnimationFrame(() => a.classList.add("visible"));
    closeModal();
    return;
  }

  // New link
  const data = getCustomLinks();
  if (!data[_currentCategoryName]) data[_currentCategoryName] = [];
  data[_currentCategoryName].push(link);
  saveCustomLinks(data);

  const a = createLinkEl(link, _currentCategoryName, true);
  _currentGrid.insertBefore(a, _currentAddBtn);
  requestAnimationFrame(() => a.classList.add("visible"));
  closeModal();
}

// ────────────────────────────────────────────────────────────
//  CONTEXT MENU
// ────────────────────────────────────────────────────────────

function initContextMenu() {
  _ctxMenu = document.createElement("div");
  _ctxMenu.className = "ctx-menu";
  _ctxMenu.innerHTML = `
    <button class="ctx-menu__item" data-action="open">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
      Open in new tab
    </button>
    <button class="ctx-menu__item" data-action="edit">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
      Edit
    </button>
    <div class="ctx-menu__divider"></div>
    <button class="ctx-menu__item ctx-menu__item--danger" data-action="delete">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
      Delete
    </button>
  `;
  document.body.appendChild(_ctxMenu);

  _ctxMenu.addEventListener("click", (e) => {
    const btn = e.target.closest(".ctx-menu__item");
    if (!btn || !_ctxTarget) return;

    const action    = btn.getAttribute("data-action");
    const linkTitle = _ctxTarget.getAttribute("data-link-title");
    const linkUrl   = _ctxTarget.getAttribute("data-link-url");
    const linkIcon  = _ctxTarget.getAttribute("data-link-icon") || "";
    const catName   = _ctxTarget.getAttribute("data-category");
    const isCustom  = _ctxTarget.hasAttribute("data-custom");

    if (action === "open")   window.open(linkUrl, "_blank");
    if (action === "edit") {
      const grid   = _ctxTarget.closest(".link-grid");
      const addBtn = grid.querySelector(".add-btn");
      openModal(catName, grid, addBtn, { title: linkTitle, url: linkUrl, icon: linkIcon, isCustom, catName, el: _ctxTarget });
    }
    if (action === "delete") deleteLink(_ctxTarget, catName, linkTitle, linkUrl, isCustom);

    hideContextMenu();
  });

  document.addEventListener("click",  hideContextMenu);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") hideContextMenu(); });
  window.addEventListener("scroll",   hideContextMenu);
}

function showContextMenu(x, y, linkEl) {
  _ctxTarget = linkEl;
  _ctxMenu.style.left = x + "px";
  _ctxMenu.style.top  = y + "px";
  _ctxMenu.classList.add("active");

  requestAnimationFrame(() => {
    const rect = _ctxMenu.getBoundingClientRect();
    let newLeft = x;
    let newTop  = y;
    if (rect.right  > window.innerWidth)  newLeft = window.innerWidth  - rect.width  - 8;
    if (rect.bottom > window.innerHeight) newTop  = window.innerHeight - rect.height - 8;
    if (newTop  < 8) newTop  = 8;
    if (newLeft < 8) newLeft = 8;
    _ctxMenu.style.left = newLeft + "px";
    _ctxMenu.style.top  = newTop  + "px";
  });
}

function hideContextMenu() {
  if (_ctxMenu) _ctxMenu.classList.remove("active");
  _ctxTarget = null;
}

// ────────────────────────────────────────────────────────────
//  LINK DELETION (shared by context menu + categories)
// ────────────────────────────────────────────────────────────

function deleteLink(el, catName, linkTitle, linkUrl, isCustom) {
  el.style.opacity   = "0";
  el.style.transform = "scale(0.8)";
  setTimeout(() => el.remove(), 200);

  if (isCustom) {
    const data = getCustomLinks();
    if (data[catName]) {
      data[catName] = data[catName].filter((l) => !(l.title === linkTitle && l.url === linkUrl));
      if (data[catName].length === 0) delete data[catName];
      saveCustomLinks(data);
    }
  } else {
    const deleted = getDeletedLinks();
    const linkId  = catName + "||" + linkUrl;
    if (!deleted.includes(linkId)) {
      deleted.push(linkId);
      saveDeletedLinks(deleted);
    }
  }
}

// ────────────────────────────────────────────────────────────
//  ICON PICKER
// ────────────────────────────────────────────────────────────

let _iconPicker = null;
let _iconPickerCallback = null;

const ICON_PAGES = [
  // Page 1: General & Media
  [
    `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>`,
    `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>`,
    `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>`,
    `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>`,
    `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="15" rx="2" ry="2"></rect><polyline points="17 2 12 7 7 2"></polyline></svg>`,
    `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>`,
    `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6"></path><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path></svg>`,
    `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>`,
    `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="12" rx="2" ry="2"></rect><path d="M6 12h4"></path><path d="M8 10v4"></path><line x1="15" y1="13" x2="15.01" y2="13"></line><line x1="18" y1="11" x2="18.01" y2="11"></line></svg>`,
    `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>`,
    `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>`,
    `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 17 10 11 4 5"></polyline><line x1="12" y1="19" x2="20" y2="19"></line></svg>`,
    `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>`,
    `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>`,
    `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`,
    `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"></path><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path><line x1="6" y1="1" x2="6" y2="4"></line><line x1="10" y1="1" x2="10" y2="4"></line><line x1="14" y1="1" x2="14" y2="4"></line></svg>`,
    `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>`,
    `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon><line x1="8" y1="2" x2="8" y2="18"></line><line x1="16" y1="6" x2="16" y2="22"></line></svg>`,
    `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>`,
    `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>`
  ],
  // Page 2: Utility & Social
  [
    `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>`,
    `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>`,
    `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>`,
    `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`,
    `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>`,
    `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>`,
    `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>`,
    `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>`,
    `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon></svg>`,
    `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>`,
    `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>`,
    `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`,
    `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"></path></svg>`,
    `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="6" width="22" height="12" rx="2" ry="2"></rect><line x1="1" y1="12" x2="23" y2="12"></line></svg>`,
    `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"></path><path d="M1.42 9a16 16 0 0 1 21.16 0"></path><path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path><line x1="12" y1="20" x2="12.01" y2="20"></line></svg>`,
    `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="12 5 12 12 16 16"></polyline><circle cx="12" cy="12" r="10"></circle></svg>`,
    `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`,
    `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19l7-7 3 3-7 7-3-3z"></path><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path><path d="M2 2l7.586 7.586"></path><circle cx="11" cy="11" r="2"></circle></svg>`,
    `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>`,
    `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>`
  ]
];

function initIconPicker() {
  _iconPicker = document.createElement("div");
  _iconPicker.className = "icon-picker";
  
  let html = `<div class="icon-picker__pages">`;
  ICON_PAGES.forEach((page, pIdx) => {
    html += `<div class="icon-picker__page" data-page-index="${pIdx}">`;
    page.forEach((icon, i) => {
      html += `<button class="icon-picker__btn" data-page="${pIdx}" data-index="${i}">${icon}</button>`;
    });
    html += `</div>`;
  });
  html += `</div>`;
  
  html += `<div class="icon-picker__dots">`;
  ICON_PAGES.forEach((_, pIdx) => {
    html += `<div class="icon-picker__dot ${pIdx === 0 ? 'active' : ''}" data-page="${pIdx}"></div>`;
  });
  html += `</div>`;
  
  html += `<div class="icon-picker__custom">
             <input type="text" id="icon-picker-custom-input" placeholder="Paste custom <svg>..." autocomplete="off"/>
             <button type="button" id="icon-picker-custom-btn">Use</button>
           </div>`;

  _iconPicker.innerHTML = html;
  document.body.appendChild(_iconPicker);

  const pagesContainer = _iconPicker.querySelector(".icon-picker__pages");
  const dotsContainer = _iconPicker.querySelectorAll(".icon-picker__dot");
  
  // Update dots on scroll snap
  pagesContainer.addEventListener("scroll", () => {
    const pageIndex = Math.round(pagesContainer.scrollLeft / pagesContainer.clientWidth);
    dotsContainer.forEach((dot, idx) => {
      dot.classList.toggle("active", idx === pageIndex);
    });
  }, { passive: true });

  const customBtn = document.getElementById("icon-picker-custom-btn");
  const customInput = document.getElementById("icon-picker-custom-input");
  
  customBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    const val = customInput.value.trim();
    if (val && _iconPickerCallback) {
      if (val.toLowerCase().startsWith("<svg")) {
         let processed = val.replace(/width="[^"]+"/, 'width="16"').replace(/height="[^"]+"/, 'height="16"');
         _iconPickerCallback(processed);
         hideIconPicker();
      } else {
         alert("Please paste valid <svg> HTML code.");
      }
    }
  });

  _iconPicker.addEventListener("click", (e) => {
    const btn = e.target.closest(".icon-picker__btn");
    const dot = e.target.closest(".icon-picker__dot");
    
    if (btn) {
      e.stopPropagation();
      const pIdx = btn.getAttribute("data-page");
      const iIdx = btn.getAttribute("data-index");
      if (_iconPickerCallback) _iconPickerCallback(ICON_PAGES[pIdx][iIdx]);
      hideIconPicker();
    } else if (dot) {
      e.stopPropagation();
      const pIdx = parseInt(dot.getAttribute("data-page"));
      pagesContainer.scrollTo({ left: pIdx * pagesContainer.clientWidth, behavior: "smooth" });
    }
  });

  document.addEventListener("click", (e) => {
    if (!e.target.closest(".icon-picker") && !e.target.closest(".category__icon-display")) {
       hideIconPicker();
    }
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") hideIconPicker(); });
  window.addEventListener("scroll", hideIconPicker);
}

function showIconPicker(x, y, callback) {
  _iconPickerCallback = callback;
  _iconPicker.style.left = x + "px";
  _iconPicker.style.top  = y + "px";
  _iconPicker.classList.add("active");

  requestAnimationFrame(() => {
    const rect = _iconPicker.getBoundingClientRect();
    let newLeft = x;
    let newTop  = y;
    if (rect.right  > window.innerWidth)  newLeft = window.innerWidth  - rect.width  - 8;
    if (rect.bottom > window.innerHeight) newTop  = window.innerHeight - rect.height - 8;
    if (newTop  < 8) newTop  = 8;
    if (newLeft < 8) newLeft = 8;
    _iconPicker.style.left = newLeft + "px";
    _iconPicker.style.top  = newTop  + "px";
  });
}

function hideIconPicker() {
  if (_iconPicker) _iconPicker.classList.remove("active");
  _iconPickerCallback = null;
}


// == js/categories.js == 
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



// == app.js == 
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


