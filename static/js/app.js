/* =========================
   CONFIG (edit these 2 lines for Tableau)
   ========================= */
// Your single Tableau dashboard base URL:
const TABLEAU_BASE = "https://public.tableau.com/views/crimedataanalysis_17622781570350/Dashboard1?:language=en-US&publish=yes&:sid=&:redirect=auth&:display_count=n&:origin=viz_share_link";
// The filter parameter name used in your dashboard (rename if needed, e.g., 'STATE/UT' ➜ 'STATE')
const TABLEAU_STATE_PARAM = "State/Ut"; // change to "STATE/UT" if your Tableau filter field is exactly that

/* =========================
   LANDING: plane + clouds
   ========================= */
window.addEventListener("DOMContentLoaded", () => {
  const startBtn = document.getElementById("startBtn");
  startBtn.addEventListener("click", () => {
    const plane = document.getElementById("plane");
    const clouds = document.querySelectorAll(".cloud");
    const welcome = document.getElementById("welcomeCard");

    // Plane takeoff (smooth)
    plane.style.left = "120%";
    plane.style.top = "10%";
    plane.style.transform = "rotate(-6deg) scale(1.05)";

    // Push clouds away + fade (staggered)
    clouds.forEach((c, i) => {
      setTimeout(() => {
        c.style.transform = (i % 2 === 0) ? "translate(-150vw, -50vh) scale(1.5)" : "translate(150vw, 50vh) scale(1.5)";
        c.style.opacity = "0";
      }, i * 180);
    });

    welcome.style.opacity = "0";

    setTimeout(() => {
      document.getElementById("landing").style.display = "none";
      const mapReveal = document.getElementById("mapReveal");
      mapReveal.style.opacity = "1";
      initMap();
    }, 3200);
  });
});

/* =========================
   GLOBALS
   ========================= */
let map, geoLayer, currentState = null, stateData = {};
const PANEL = document.getElementById('infoPanel');
const PANEL_CONTENT = document.getElementById('panelContent');
const STATE_NAME_EL = document.getElementById('stateName');
const TABS = Array.from(document.querySelectorAll('.panelButtons button'));
const MINI = document.getElementById('miniTooltip');

// Close panel
document.getElementById('closePanel').addEventListener('click', () => {
  PANEL.classList.remove('open');
  PANEL.setAttribute('aria-hidden', 'true');
});

// Tabs
TABS.forEach(btn => btn.addEventListener('click', () => {
  TABS.forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderPanel(currentState);
}));

// Load stateData.json
fetch("/api/state-data")
  .then(r => r.json())
  .then(j => { stateData = j || {}; })
  .catch(() => {});

/* =========================
   MAP
   ========================= */
function initMap(){
  if(map) return;

  map = L.map('map', {
    zoomControl: true,
    attributionControl: false   // no "Leaflet | © OSM"
  }).setView([22.0, 79.0], 5);

  // Optional background image
  fetch("/static/assets/map-bg.jpg", { method: "HEAD" }).then(r => {
    if (r.ok) {
      const m = document.getElementById('map');
      m.classList.add('has-bg');
      m.style.setProperty('--bg', "url('/static/assets/map-bg.jpg')");
      // style via CSS ::before would need inline, so set background directly:
      m.style.backgroundImage = "url('/static/assets/map-bg.jpg')";
    }
  });

  // Vibrant tiles
  // Plain background — no cities, no roads
  L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png', {
    minZoom: 4,
    maxZoom: 10,
    opacity: 0, // transparent tiles
    attribution: ''
  }).addTo(map);


  // India-only bounds
  const indiaBounds = L.latLngBounds([6.5, 68], [37.5, 97.5]);
  map.setMaxBounds(indiaBounds);
  map.on('drag', () => map.panInsideBounds(indiaBounds, { animate: false }));

  // Load accurate GeoJSON if present; else fallback
  fetch("/api/india-states")
    .then(r => r.json())
    .then(data => {
      if (data && data.type === "FeatureCollection") {
        addGeoJsonToMap(data);
      } else {
        addGeoJsonToMap(embeddedFallbackGeo); // minimal set but ensures map works
      }
    })
    .catch(() => addGeoJsonToMap(embeddedFallbackGeo));
}

function addGeoJsonToMap(geojson) {
  function style() {
    return {
      color: '#1e3a8a',     // border color (indigo)
      weight: 1.8,          // border thickness
      fillColor: '#e0f2fe', // light blue fill
      fillOpacity: 0.7,
      dashArray: '3'
    };
  }

  function highlightFeature(e) {
    const layer = e.target;
    layer.setStyle({
      weight: 3,
      color: '#2563eb',     // bright blue highlight
      fillOpacity: 0.9
    });
    layer.bindTooltip(`<b>${getName(layer.feature.properties)}</b>`, {
      sticky: true,
      direction: 'top',
      className: 'state-tip'
    }).openTooltip();
  }

  function resetHighlight(e) {
    geoLayer.resetStyle(e.target);
    e.target.closeTooltip();
  }

  function zoomToFeature(e) {
    const layer = e.target;
    const state = getName(layer.feature.properties);
    map.fitBounds(layer.getBounds(), { maxZoom: 8 });
    openPanel(state);
  }

  function onEachFeature(feature, layer) {
    layer.on({
      mouseover: highlightFeature,
      mouseout: resetHighlight,
      click: zoomToFeature
    });
  }

  geoLayer = L.geoJSON(geojson, {
    style,
    onEachFeature
  }).addTo(map);

  try {
    const b = geoLayer.getBounds();
    if (b.isValid()) map.fitBounds(b, { padding: [40, 40] });
  } catch (e) {}
}


function getName(props){
  return props["STATE/UT"] || props["ST_NM"] || props["name"] || props["State"] || "Unknown";
}

/* =========================
   PANEL RENDER
   ========================= */
function openPanel(stateName){
  currentState = stateName;
  STATE_NAME_EL.textContent = stateName;
  PANEL.classList.add('open');
  PANEL.setAttribute('aria-hidden','false');
  // default first tab
  TABS.forEach(b => b.classList.remove('active'));
  TABS[0].classList.add('active');
  renderPanel(stateName);
}

function renderPanel(stateName){
  const active = document.querySelector('.panelButtons button.active')?.dataset?.tab || 'spots';
  const s = stateData[stateName] || {};
  if (active === 'spots'){
    const quote = (s.quote) ? s.quote : "Incredible India Awaits You!";
    const spots = ensureMinSpots(s.spots || [], stateName, 10);
    const html = `
      <h3>🌄 ${escapeHtml(stateName)} — “${escapeHtml(quote)}”</h3>
      ${spots.map(sp => `
        <div class="spotCard">
          <img src="${sp.img}" alt="${escapeHtml(sp.name)}">
          <div class="meta">
            <div style="font-weight:800">${escapeHtml(sp.name)}</div>
            <div style="color:#475569;margin-top:6px">${escapeHtml(sp.desc || "")}</div>
          </div>
        </div>`).join('')}
    `;
    PANEL_CONTENT.innerHTML = html;
  }

  if (active === 'crime'){
    // Build Tableau URL with state filter
    const tableauURL = `${TABLEAU_BASE}?:showVizHome=no&${encodeURIComponent(TABLEAU_STATE_PARAM)}=${encodeURIComponent(stateName)}`;
    PANEL_CONTENT.innerHTML = `
      <h3>Crime Overview — ${escapeHtml(stateName)}</h3>
      <div id="loading" style="text-align:center; margin:8px; color:#475569;">Loading dashboard…</div>
      <iframe onload="document.getElementById('loading').style.display='none';"
              src="${tableauURL}"
              style="width:100%; height:460px; border:none; border-radius:10px;"></iframe>
    `;
  }

  if (active === 'prec'){
    const prec = s.precautions || [
      "Stay aware in crowded places; keep valuables secured.",
      "Prefer verified transport and well-reviewed stays."
    ];
    const helplines = s.helplines || [
      { service: "Police", number: "112" },
      { service: "Women Helpline", number: "181" }
    ];
    const html = `
      <div class="precautions-grid">
        <div class="prec-box">
          <h4>Necessary Precautions</h4>
          <ul>${prec.map(p => `<li>${escapeHtml(p)}</li>`).join('')}</ul>
        </div>
        <div class="prec-box">
          <h4>Emergency Helplines</h4>
          <ul>${helplines.map(h => `<li><strong>${escapeHtml(h.service)}:</strong> ${escapeHtml(h.number)}</li>`).join('')}</ul>
        </div>
      </div>
    `;
    PANEL_CONTENT.innerHTML = html;
  }
}

/* =========================
   Helpers
   ========================= */
function ensureMinSpots(spots, stateName, minCount=10){
  const out = spots.slice(0);
  const placeholders = [
    "Old Fort", "City Museum", "Central Park", "Sunset Point", "Riverfront Walk",
    "Heritage Street", "Grand Bazaar", "Botanical Garden", "Hill View", "Art District",
    "Lakeside Promenade", "Cultural Center", "Ancient Temple", "Cliff View", "Valley View"
  ];
  let i=0;
  while (out.length < minCount && i < placeholders.length){
    out.push({
      name: `${stateName} ${placeholders[i]}`,
      img: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=60",
      desc: "A must-visit local favorite."
    });
    i++;
  }
  return out.slice(0, Math.max(minCount, Math.min(30, out.length)));
}

function escapeHtml(s){ return String(s||'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

/* Fallback minimal GeoJSON (so map always shows even without india_states.geojson) */
const embeddedFallbackGeo = {
  "type":"FeatureCollection",
  "features":[
    {"type":"Feature","properties":{"name":"Karnataka","STATE/UT":"Karnataka"},"geometry":{"type":"Polygon","coordinates":[[[74,18],[76.5,18],[78,15],[75,12],[73,14],[74,18]]]}},
    {"type":"Feature","properties":{"name":"Maharashtra","STATE/UT":"Maharashtra"},"geometry":{"type":"Polygon","coordinates":[[[72,22],[79.5,22],[79.5,16],[72,16],[72,22]]]}},
    {"type":"Feature","properties":{"name":"Kerala","STATE/UT":"Kerala"},"geometry":{"type":"Polygon","coordinates":[[[74.5,12.5],[77,12.5],[77,8.5],[74.5,8.5],[74.5,12.5]]]}},
    {"type":"Feature","properties":{"name":"Tamil Nadu","STATE/UT":"Tamil Nadu"},"geometry":{"type":"Polygon","coordinates":[[[77,12.5],[80.5,12.5],[80.5,8.5],[77,8.5],[77,12.5]]]}},
    {"type":"Feature","properties":{"name":"Delhi","STATE/UT":"Delhi"},"geometry":{"type":"Polygon","coordinates":[[[76.9,28.7],[77.4,28.7],[77.4,28.4],[76.9,28.4],[76.9,28.7]]]}}
  ]
};
