// ============================================================
//  NAV — Header, theme toggle, navigation, footer
// ============================================================

function initNav(app) {
  // ── Header ────────────────────────────────────────────────
  const header = document.createElement("header");
  header.className = "header";

  const title = document.createElement("h1");
  title.className = "header__title";
  title.textContent = CONFIG.siteTitle;
  header.appendChild(title);

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

  header.appendChild(themeBtn);
  app.appendChild(header);

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
