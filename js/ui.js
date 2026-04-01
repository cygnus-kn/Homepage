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
