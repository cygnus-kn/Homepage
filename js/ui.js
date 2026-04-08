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
