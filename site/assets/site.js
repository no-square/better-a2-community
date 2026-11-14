const $ = (id) => document.getElementById(id);
const worldNames = { World_L_A: 'Verteron', World_D_A: 'Altgard', Abyss_Reshanta_A: 'Chaotic Lower Reshanta' };
const factionNames = { Elyos: 'Elyos', Asmodian: 'Asmodian', Shared: 'Shared' };
const safe = (value) => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
async function loadRouteCatalog() {
  const list = $('route-list');
  if (!list) return;
  try {
    const response = await fetch('data/catalog.json');
    if (!response.ok) throw new Error('Catalog unavailable');
    const data = await response.json();
    const routes = Array.isArray(data.routes) ? data.routes : [];
    const worlds = [...new Set(routes.map(r => r.world).filter(Boolean))].sort();
    const factions = [...new Set(routes.map(r => r.faction).filter(Boolean))].sort();
    worlds.forEach(value => $('world-filter')?.add(new Option(worldNames[value] || value, value)));
    factions.forEach(value => $('faction-filter')?.add(new Option(factionNames[value] || value, value)));
    const render = () => {
      const query = ($('route-search')?.value || '').trim().toLowerCase();
      const world = $('world-filter')?.value || '';
      const faction = $('faction-filter')?.value || '';
      const filtered = routes.filter(r => [r.name,r.world,r.faction,r.resources,r.description].join(' ').toLowerCase().includes(query) && (!world || r.world === world) && (!faction || r.faction === faction));
      $('result-count').textContent = `${filtered.length} ${filtered.length === 1 ? 'route' : 'routes'}`;
      list.innerHTML = filtered.length ? filtered.map(route => `<article class="route-card"><div class="route-card-main"><div class="route-tags"><span class="pill">${safe(worldNames[route.world] || route.world)}</span><span class="pill pill-muted">${safe(factionNames[route.faction] || route.faction)}</span>${route.status === 'verified' ? '<span class="pill pill-verified">VERIFIED</span>' : ''}</div><h2>${safe(route.name)}</h2><p>${safe(route.description || 'Community route package.')}</p><div class="route-meta"><span>RESOURCES <b>${safe(route.resources || 'Not specified')}</b></span><span>BY <b>${safe(route.author || 'Community')}</b></span></div></div><a class="button button-small" href="${safe(route.package)}" download>Download JSON ↓</a></article>`).join('') : `<div class="empty-state"><span>⌖</span><h2>${routes.length ? 'No matching routes' : 'The library is getting ready'}</h2><p>${routes.length ? 'Try another search or filter.' : 'No route packages have been published yet. Check back as the community library grows.'}</p><a href="contribute.html">How route sharing will work →</a></div>`;
    };
    ['route-search','world-filter','faction-filter'].forEach(id => $(id)?.addEventListener(id === 'route-search' ? 'input' : 'change', render));
    render();
  } catch {
    $('result-count').textContent = 'Route catalog unavailable';
    list.innerHTML = '<div class="empty-state"><h2>Could not load the route catalog</h2><p>Please try again later.</p></div>';
  }
}
loadRouteCatalog();
