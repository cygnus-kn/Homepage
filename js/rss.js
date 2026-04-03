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
