const announcementEscape = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));

async function loadGeneratedAnnouncements() {
  const list = document.getElementById('announcement-list');
  if (!list) return;
  try {
    const response = await fetch('data/announcements.json', { cache: 'no-store' });
    if (!response.ok) return;
    const feed = await response.json();
    if (!Array.isArray(feed.items) || !feed.items.length) return;
    const cards = feed.items.map(item => {
      const productClass = item.kind === 'release' && item.product === 'Better ESP' ? ' pill-purple' : item.kind === 'routes' ? ' pill-muted' : '';
      const label = item.kind === 'routes' ? 'COMMUNITY ROUTES' : item.product.toUpperCase();
      const date = announcementEscape(item.date || '');
      const body = announcementEscape(item.body || '').replace(/\r?\n/g, '<br>');
      const destination = item.kind === 'routes' ? 'Open Route Library ↗' : `View ${announcementEscape(item.product)} release ↗`;
      const target = item.kind === 'routes' ? 'routes.html' : announcementEscape(item.url);
      const external = item.kind === 'release' ? ' target="_blank" rel="noopener noreferrer"' : '';
      return `<article class="announcement-card announcement-generated"><div class="announcement-meta"><span class="pill${productClass}">${announcementEscape(label)}</span><span>${announcementEscape(item.tag)} · ${date}</span></div><h2>${announcementEscape(item.title)}</h2><p class="announcement-summary">${body}</p><a class="text-link" href="${target}"${external}>${destination}</a></article>`;
    }).join('');
    list.insertAdjacentHTML('afterbegin', cards);
  } catch {
    // Existing editorial announcements remain available if the generated feed cannot load.
  }
}

loadGeneratedAnnouncements();
