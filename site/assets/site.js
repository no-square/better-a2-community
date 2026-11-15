const $ = (id) => document.getElementById(id);
const worldNames = { World_L_A: 'Verteron', World_D_A: 'Altgard', Abyss_Reshanta_A: 'Chaotic Lower Reshanta' };
const factionNames = { Elyos: 'Elyos', Asmodian: 'Asmodian', Shared: 'Shared' };
const safe = (value) => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
async function loadRouteCatalog() {
  const list = $('route-list');
  if (!list) return;
  try {
    const response = await fetch('data/catalog.json', { cache: 'no-store' });
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
      list.innerHTML = filtered.length ? filtered.map(route => `<article class="route-card"><div class="route-card-main"><div class="route-tags"><span class="pill">${safe(worldNames[route.world] || route.world)}</span><span class="pill pill-muted">${safe(factionNames[route.faction] || route.faction)}</span>${route.status === 'verified' ? '<span class="pill pill-verified">VERIFIED</span>' : ''}</div><h2>${safe(route.name)}</h2><p>${safe(route.description || 'Community route package.')}</p><div class="route-meta"><span>RESOURCES <b>${safe(route.resources || 'Not specified')}</b></span><span>BY <b>${safe(route.author || 'Community')}</b></span></div></div><div class="route-card-actions"><button class="button button-primary" type="button" data-route-map="${safe(route.package)}" data-world="${safe(route.world)}" data-name="${safe(route.name)}" data-faction="${safe(route.faction)}">View map</button><a class="button button-small" href="${safe(route.package)}" download>Download JSON ↓</a></div></article>`).join('') : `<div class="empty-state"><span>⌖</span><h2>${routes.length ? 'No matching routes' : 'The library is getting ready'}</h2><p>${routes.length ? 'Try another search or filter.' : 'No route packages have been published yet. Check back as the community library grows.'}</p><a href="contribute.html">How route sharing will work →</a></div>`;
    };
    ['route-search','world-filter','faction-filter'].forEach(id => $(id)?.addEventListener(id === 'route-search' ? 'input' : 'change', render));
    render();
  } catch {
    $('result-count').textContent = 'Route catalog unavailable';
    list.innerHTML = '<div class="empty-state"><h2>Could not load the route catalog</h2><p>Please try again later.</p></div>';
  }
}
loadRouteCatalog();

const mapViewer = $('route-map-viewer');
const mapCanvas = $('route-map-canvas');
const mapStatus = $('route-map-status');
const mapContext = mapCanvas?.getContext('2d');
const mapBounds = { World_L_A: 408000, World_D_A: 408000, Abyss_Reshanta_A: 204000 };
const mapFiles = { World_L_A: 'assets/maps/verteron.webp', World_D_A: 'assets/maps/altgard.webp', Abyss_Reshanta_A: 'assets/maps/reshanta.webp' };
const routeMap = { image: null, points: [], world: '', bound: 0, zoom: 1, panX: 0, panY: 0, dragging: false, lastX: 0, lastY: 0 };

function resizeRouteMapCanvas() {
  if (!mapCanvas) return;
  const rect = mapCanvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  mapCanvas.width = Math.max(1, Math.round(rect.width * dpr));
  mapCanvas.height = Math.max(1, Math.round(rect.height * dpr));
  mapContext?.setTransform(dpr, 0, 0, dpr, 0, 0);
  drawRouteMap();
}

function drawRouteMap() {
  if (!mapContext || !routeMap.image || !mapCanvas) return;
  const width = mapCanvas.clientWidth;
  const height = mapCanvas.clientHeight;
  if (!width || !height) return;
  mapContext.clearRect(0, 0, width, height);
  mapContext.fillStyle = '#0a1016';
  mapContext.fillRect(0, 0, width, height);
  const fitScale = Math.min(width / routeMap.image.width, height / routeMap.image.height);
  const scale = fitScale * routeMap.zoom;
  const drawWidth = routeMap.image.width * scale;
  const drawHeight = routeMap.image.height * scale;
  const left = (width - drawWidth) / 2 + routeMap.panX;
  const top = (height - drawHeight) / 2 + routeMap.panY;
  mapContext.drawImage(routeMap.image, left, top, drawWidth, drawHeight);
  const coords = routeMap.points.map(point => ({
    x: left + ((Number(point.x) + routeMap.bound) / (2 * routeMap.bound)) * drawWidth,
    y: top + ((Number(point.y) + routeMap.bound) / (2 * routeMap.bound)) * drawHeight,
    waypoint: point.waypoint === true,
    label: point.label || point.model || '',
  }));
  if (coords.length > 1) {
    mapContext.beginPath();
    coords.forEach((point, index) => index === 0 ? mapContext.moveTo(point.x, point.y) : mapContext.lineTo(point.x, point.y));
    mapContext.strokeStyle = '#59d9cd';
    mapContext.lineWidth = 2.5;
    mapContext.setLineDash([7, 5]);
    mapContext.stroke();
    mapContext.setLineDash([]);
  }
  coords.forEach((point, index) => {
    const color = point.waypoint ? '#f3bd5a' : '#59d9cd';
    mapContext.beginPath();
    mapContext.arc(point.x, point.y, point.waypoint ? 7 : 5.5, 0, Math.PI * 2);
    mapContext.fillStyle = color;
    mapContext.fill();
    mapContext.lineWidth = 2;
    mapContext.strokeStyle = '#091018';
    mapContext.stroke();
    mapContext.font = '600 11px Segoe UI, sans-serif';
    mapContext.textBaseline = 'bottom';
    mapContext.lineWidth = 3;
    mapContext.strokeStyle = '#091018';
    mapContext.strokeText(String(index + 1), point.x + 8, point.y - 6);
    mapContext.fillStyle = '#f2f6f8';
    mapContext.fillText(String(index + 1), point.x + 8, point.y - 6);
  });
}

async function openRouteMap(button) {
  const world = button.dataset.world;
  if (!mapFiles[world]) return;
  mapViewer.setAttribute('aria-hidden', 'false');
  document.body.classList.add('route-map-open');
  $('route-map-title').textContent = button.dataset.name || 'Route map';
  $('route-map-subtitle').textContent = `${worldNames[world] || world} · ${factionNames[button.dataset.faction] || button.dataset.faction}`;
  mapStatus.textContent = 'Loading route and map…';
  routeMap.image = null;
  routeMap.points = [];
  routeMap.world = world;
  routeMap.bound = mapBounds[world];
  routeMap.zoom = 1;
  routeMap.panX = routeMap.panY = 0;
  resizeRouteMapCanvas();
  try {
    const [packageResponse, image] = await Promise.all([
      fetch(button.dataset.routeMap, { cache: 'no-store' }),
      new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('Map background could not be loaded.'));
        img.src = mapFiles[world];
      }),
    ]);
    if (!packageResponse.ok) throw new Error(`Route package request failed (${packageResponse.status}).`);
    const data = await packageResponse.json();
    const route = Array.isArray(data.routes) ? data.routes[0] : null;
    if (!route || !Array.isArray(route.points) || !route.points.length) throw new Error('This route package has no viewable route points.');
    routeMap.image = image;
    routeMap.points = route.points;
    mapStatus.textContent = `${route.points.length} points · ${worldNames[world] || world}`;
    drawRouteMap();
  } catch (error) {
    routeMap.image = null;
    mapStatus.textContent = error.message || 'Could not load route preview.';
  }
}

function closeRouteMap() {
  mapViewer?.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('route-map-open');
  routeMap.dragging = false;
}

function changeRouteMapZoom(direction, clientX, clientY) {
  if (!routeMap.image || !mapCanvas) return;
  const current = routeMap.zoom;
  const next = Math.max(1, Math.min(16, current * (direction > 0 ? 1.25 : 0.8)));
  if (next === current) return;
  const rect = mapCanvas.getBoundingClientRect();
  const x = clientX == null ? rect.width / 2 : clientX - rect.left;
  const y = clientY == null ? rect.height / 2 : clientY - rect.top;
  const fitScale = Math.min(rect.width / routeMap.image.width, rect.height / routeMap.image.height);
  const oldW = routeMap.image.width * fitScale * current;
  const oldH = routeMap.image.height * fitScale * current;
  const fx = (x - ((rect.width - oldW) / 2 + routeMap.panX)) / oldW;
  const fy = (y - ((rect.height - oldH) / 2 + routeMap.panY)) / oldH;
  routeMap.zoom = next;
  const newW = routeMap.image.width * fitScale * next;
  const newH = routeMap.image.height * fitScale * next;
  routeMap.panX = x - fx * newW - (rect.width - newW) / 2;
  routeMap.panY = y - fy * newH - (rect.height - newH) / 2;
  drawRouteMap();
}

$('route-list')?.addEventListener('click', event => {
  const button = event.target.closest('[data-route-map]');
  if (button) openRouteMap(button);
});
mapViewer?.querySelector('[data-map-close]')?.addEventListener('click', closeRouteMap);
mapViewer?.querySelector('[data-map-fit]')?.addEventListener('click', () => {
  routeMap.zoom = 1;
  routeMap.panX = routeMap.panY = 0;
  drawRouteMap();
});
mapViewer?.querySelectorAll('[data-map-zoom]').forEach(button => button.addEventListener('click', () => changeRouteMapZoom(Number(button.dataset.mapZoom))));
mapViewer?.addEventListener('click', event => { if (event.target === mapViewer) closeRouteMap(); });
mapCanvas?.addEventListener('wheel', event => { event.preventDefault(); changeRouteMapZoom(event.deltaY < 0 ? 1 : -1, event.clientX, event.clientY); }, { passive: false });
mapCanvas?.addEventListener('pointerdown', event => {
  routeMap.dragging = true;
  routeMap.lastX = event.clientX;
  routeMap.lastY = event.clientY;
  mapCanvas.classList.add('is-dragging');
  mapCanvas.setPointerCapture(event.pointerId);
});
mapCanvas?.addEventListener('pointermove', event => {
  if (!routeMap.dragging) return;
  routeMap.panX += event.clientX - routeMap.lastX;
  routeMap.panY += event.clientY - routeMap.lastY;
  routeMap.lastX = event.clientX;
  routeMap.lastY = event.clientY;
  drawRouteMap();
});
const stopRouteMapDrag = () => { routeMap.dragging = false; mapCanvas?.classList.remove('is-dragging'); };
mapCanvas?.addEventListener('pointerup', stopRouteMapDrag);
mapCanvas?.addEventListener('pointercancel', stopRouteMapDrag);
window.addEventListener('resize', resizeRouteMapCanvas);
window.addEventListener('keydown', event => { if (event.key === 'Escape' && mapViewer?.getAttribute('aria-hidden') === 'false') closeRouteMap(); });
