// ============================================================
//  STORAGE — localStorage get/save helpers
// ============================================================

const STORAGE_KEY     = "homepage_custom_links";
const DELETED_KEY     = "homepage_deleted_links";
const RENAMED_KEY     = "homepage_renamed_cats";
const CUSTOM_CATS_KEY = "homepage_custom_cats";
const ORDERS_KEY      = "homepage_category_orders";
const COLLAPSED_KEY   = "homepage_collapsed_cats";

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
