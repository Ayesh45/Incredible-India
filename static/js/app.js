// Silence non-critical browser warnings
const _warn = console.warn;
console.warn = function (...args) {
  const msg = args.join(" ");
  if (
    msg.includes("preload") ||
    msg.includes("preloaded using link preload") ||
    msg.includes("Mixed Content") ||
    msg.includes("DevTools Console") ||
    msg.includes("deprecated")
  ) {
    // Ignore these known harmless warnings
    return;
  }
  _warn.apply(console, args);
};

// Tableau dashboards
const TABLEAU_BASE_OLD = "https://public.tableau.com/views/crimedataanalysis_17622781570350/Dashboard1?:language=en-US&:sid=&:redirect=auth&:display_count=n&:origin=viz_share_link";
const TABLEAU_BASE_NEW = "https://public.tableau.com/views/crimedataanalysis2/Dashboard1?:language=en-US&:sid=&:redirect=auth&:display_count=n&:origin=viz_share_link";
const TABLEAU_PARAM = "State/Ut";

// Intro animation
window.onload = () => {
  document.getElementById("startBtn").onclick = () => {
    const plane = document.getElementById("plane");
    const clouds = document.querySelectorAll(".cloud");

    // Reset styles
    plane.style.transition = "all 3s cubic-bezier(0.4, 0, 0.2, 1)";
    clouds.forEach((c) => {
      c.style.transition = "transform 3s ease-out, opacity 3s ease-out";
    });

    // Trigger simultaneous animation
    plane.style.transform = "translate(120vw, -40vh) rotate(-8deg)";

    // Clouds pushed outward (different directions)
    clouds.forEach((c, i) => {
      const dirX = i % 2 === 0 ? 1 : -1; // alternate left/right
      const dirY = i % 3 === 0 ? -1 : 1; // alternate up/down
      const moveX = 400 * dirX;
      const moveY = 200 * dirY;
      c.style.transform = `translate(${moveX}px, ${moveY}px)`;
      c.style.opacity = "0";
    });

    // Reveal map after animation
    setTimeout(() => {
      document.getElementById("landing").style.display = "none";
      document.getElementById("mapReveal").style.opacity = 1;
      initMap();
    }, 3000);
  };
};


let map,geoLayer,currentState=null;
const PANEL=document.getElementById("infoPanel"),NAME=document.getElementById("stateName"),CONTENT=document.getElementById("panelContent");

document.getElementById("closePanel").onclick=()=>{PANEL.classList.remove("open");};

function initMap() {
  if (map) return;

  map = L.map('map', { zoomControl: true, attributionControl: false })
           .setView([22.5, 79], 5);

  // 🎨 Terrain + coastline shading
  L.tileLayer(
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Shaded_Relief/MapServer/tile/{z}/{y}/{x}',
    { maxZoom: 10, minZoom: 4, opacity: 1, attribution: '' }
  ).addTo(map);

  // 🗺️ Optional faint coastline overlay (adds soft outlines)
  L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
    maxZoom: 10,
    opacity: 0.25,
    attribution: ''
  }).addTo(map);

  fetch("/api/india-states").then(r => r.json()).then(d => addGeoJsonToMap(d));

  const bounds = L.latLngBounds([6.5, 68], [37.5, 97.5]);
  map.setMaxBounds(bounds);
  map.on('drag', () => map.panInsideBounds(bounds, { animate: false }));
}


function addGeoJsonToMap(geojson) {
  function style() {
    return {
      color: "transparent",       // invisible borders
      fillColor: "transparent",   // no fill
      weight: 1.2,
      fillOpacity: 0,
      opacity: 0
    };
  }

  function highlightFeature(e) {
    const layer = e.target;
    const stateName = getName(layer.feature.properties);
    layer.setStyle({
      color: "#2563eb",           // blue outline on hover
      weight: 2,
      opacity: 1,
      fillColor: "transparent",
      fillOpacity: 0
    });
    layer.bindTooltip(`<b>${stateName}</b>`, {
      sticky: true,
      direction: "top",
      className: "state-tip"
    }).openTooltip();
  }

  function resetHighlight(e) {
    geoLayer.resetStyle(e.target);
    e.target.closeTooltip();
  }

  function zoomToFeature(e) {
    const state = getName(e.target.feature.properties);
    map.fitBounds(e.target.getBounds(), { maxZoom: 7 });
    openPanel(state);
  }

  function onEachFeature(feature, layer) {
    layer.on({
      mouseover: highlightFeature,
      mouseout: resetHighlight,
      click: zoomToFeature
    });
  }

  geoLayer = L.geoJSON(geojson, { style, onEachFeature }).addTo(map);
}


function getName(p){return p["STATE_UT"]||p["name"]||p["State"];}

function openPanel(state) {
  NAME.textContent = state;
  PANEL.classList.add("open");
  showCategoryButtons(state);
}

function showCategoryButtons(state) {
  CONTENT.innerHTML = `
    <div id="panelButtons" class="category-buttons">
      <button class="category-btn" onclick="showTourism('${state}')">
        <span>Tourist Spots</span>
        <span class="icon camera">📸</span>
      </button>
      <button class="category-btn" onclick="showCrimes('${state}')">
        <span>Crime Rates</span>
        <span class="icon chart">📊</span>
      </button>
      <button class="category-btn" onclick="showPrecautions('${state}')">
        <span>Precautions</span>
        <span class="icon locked">🔒</span>
      </button>
    </div>
  `;
}

// 🌍 Real spots with images
function getSpots(state) {
  const data = {
    "Maharashtra": [
      { name: "Gateway of India", img: "https://upload.wikimedia.org/wikipedia/commons/7/7e/Gateway_of_India_Mumbai.jpg" },
      { name: "Ajanta Caves", img: "https://upload.wikimedia.org/wikipedia/commons/0/0a/Ajanta_caves_panorama.jpg" },
      { name: "Ellora Caves", img: "https://upload.wikimedia.org/wikipedia/commons/0/0b/Kailasanatha_temple_Ellora.jpg" },
      { name: "Lonavala", img: "https://upload.wikimedia.org/wikipedia/commons/5/57/Lonavala_ghats.jpg" },
      { name: "Shirdi", img: "https://upload.wikimedia.org/wikipedia/commons/5/53/Shirdi_Temple_Complex.jpg" },
      { name: "Mahabaleshwar", img: "https://upload.wikimedia.org/wikipedia/commons/8/83/Mahabaleshwar_view_point.jpg" },
      { name: "Aurangabad", img: "https://upload.wikimedia.org/wikipedia/commons/d/df/Aurangabad_Caves.jpg" },
      { name: "Nashik", img: "https://upload.wikimedia.org/wikipedia/commons/f/f5/Pandavleni_caves_Nashik.jpg" },
      { name: "Pune", img: "https://upload.wikimedia.org/wikipedia/commons/2/2d/Shaniwarwada_Pune.jpg" },
      { name: "Alibaug", img: "https://upload.wikimedia.org/wikipedia/commons/6/61/Alibaug_Fort.jpg" }
    ],

    "Karnataka": [
      { name: "Mysore Palace", img: "https://upload.wikimedia.org/wikipedia/commons/d/d2/Mysore_Palace_Morning.jpg" },
      { name: "Hampi", img: "https://upload.wikimedia.org/wikipedia/commons/9/9d/Hampi_Vittala_Temple_Complex.jpg" },
      { name: "Coorg", img: "https://upload.wikimedia.org/wikipedia/commons/a/a5/Coorg_hills.jpg" },
      { name: "Gokarna Beach", img: "https://upload.wikimedia.org/wikipedia/commons/f/fb/Gokarna_beach.jpg" },
      { name: "Jog Falls", img: "https://upload.wikimedia.org/wikipedia/commons/5/5f/Jog_Falls.jpg" },
      { name: "Nandi Hills", img: "https://upload.wikimedia.org/wikipedia/commons/4/4c/Nandi_Hills_Sunrise.jpg" },
      { name: "Badami Caves", img: "https://upload.wikimedia.org/wikipedia/commons/3/3e/Badami_Cave_Temples.jpg" },
      { name: "Murudeshwar", img: "https://upload.wikimedia.org/wikipedia/commons/3/34/Murudeshwar_Temple.jpg" },
      { name: "Chikmagalur", img: "https://upload.wikimedia.org/wikipedia/commons/4/4a/Chikmagalur_coffee_plantation.jpg" },
      { name: "Bandipur National Park", img: "https://upload.wikimedia.org/wikipedia/commons/d/dc/Bandipur_Tiger_Reserve.jpg" }
    ],

    "Kerala": [
      { name: "Munnar", img: "https://upload.wikimedia.org/wikipedia/commons/1/1e/Munnar_Tea_Plantations.jpg" },
      { name: "Alleppey Backwaters", img: "https://upload.wikimedia.org/wikipedia/commons/d/d0/Alleppey_backwaters.jpg" },
      { name: "Kovalam Beach", img: "https://upload.wikimedia.org/wikipedia/commons/0/0f/Kovalam_Beach_2015.jpg" },
      { name: "Thekkady", img: "https://upload.wikimedia.org/wikipedia/commons/f/fc/Thekkady_Lake.jpg" },
      { name: "Wayanad", img: "https://upload.wikimedia.org/wikipedia/commons/8/8b/Wayanad_hills.jpg" },
      { name: "Athirappilly Falls", img: "https://upload.wikimedia.org/wikipedia/commons/1/14/Athirappilly_Waterfalls.jpg" },
      { name: "Bekal Fort", img: "https://upload.wikimedia.org/wikipedia/commons/9/9b/Bekal_Fort.jpg" },
      { name: "Kumarakom", img: "https://upload.wikimedia.org/wikipedia/commons/e/e1/Kumarakom_boats.jpg" },
      { name: "Varkala", img: "https://upload.wikimedia.org/wikipedia/commons/a/a0/Varkala_beach.jpg" },
      { name: "Thrissur Pooram", img: "https://upload.wikimedia.org/wikipedia/commons/8/8f/Thrissur_Pooram_Festival.jpg" }
    ],

    "Tamil Nadu": [
      { name: "Ooty", img: "https://upload.wikimedia.org/wikipedia/commons/3/32/Ooty_Tea_Estate.jpg" },
      { name: "Kanyakumari", img: "https://upload.wikimedia.org/wikipedia/commons/4/4e/Kanyakumari_Sunrise.jpg" },
      { name: "Mahabalipuram", img: "https://upload.wikimedia.org/wikipedia/commons/f/f2/Mahabalipuram_Temple.jpg" },
      { name: "Rameswaram", img: "https://upload.wikimedia.org/wikipedia/commons/7/73/Rameswaram_temple.jpg" },
      { name: "Chennai Marina Beach", img: "https://upload.wikimedia.org/wikipedia/commons/6/66/Marina_beach_Chennai.jpg" },
      { name: "Madurai Meenakshi Temple", img: "https://upload.wikimedia.org/wikipedia/commons/5/59/Meenakshi_Amman_Temple_Towers.jpg" },
      { name: "Kodaikanal", img: "https://upload.wikimedia.org/wikipedia/commons/4/49/Kodaikanal_Lake.jpg" },
      { name: "Thanjavur", img: "https://upload.wikimedia.org/wikipedia/commons/8/8b/Brihadeeswarar_Temple_Tanjore.jpg" },
      { name: "Yercaud", img: "https://upload.wikimedia.org/wikipedia/commons/2/2a/Yercaud_Lake.jpg" },
      { name: "Coimbatore", img: "https://upload.wikimedia.org/wikipedia/commons/b/b9/Adiyogi_Shiva_statue_Coimbatore.jpg" }
    ]
  };
  return data[state] || [];
}



// 🏝️ Tourist Spots Section
function showTourism(state) {
  const spots = getSpots(state);

  // Check if spots exist
  function showTourism(state) {
  const spots = getSpots(state);

  if (!spots || spots.length === 0) {
    CONTENT.innerHTML = `
      <div class="section-header">
        <button class="back-btn" onclick="showCategoryButtons('${state}')">← Back</button>
        <h3>Top Tourist Spots in ${state}</h3>
        <p>No tourist spots available for this state.</p>
      </div>
    `;
    return;
  }

  CONTENT.innerHTML = `
    <div class="section-header">
      <button class="back-btn" onclick="showCategoryButtons('${state}')">← Back</button>
      <h3>Top Tourist Spots in ${state}</h3>
    </div>
    <div class="spots-grid">
      ${spots.map((s, i) => `
        <div class="spotCard" style="animation-delay:${i * 0.1}s;">
          <img src="${s.img}" alt="${s.name}">
          <div class="meta"><strong>${s.name}</strong></div>
        </div>`).join("")}
    </div>
  `;
}


  // Build grid with images from Unsplash for variety
  CONTENT.innerHTML = `
    <div class="section-header">
      <button class="back-btn" onclick="showCategoryButtons('${state}')">← Back</button>
      <h3>Top Tourist Spots in ${state}</h3>
    </div>
    <div class="spots-grid">
      ${spots.map((spot, i) => `
        <div class="spotCard" style="animation-delay:${i * 0.1}s">
          <img src="https://source.unsplash.com/featured/?${encodeURIComponent(spot)},India" alt="${spot}">
          <div class="meta"><strong>${spot}</strong></div>
        </div>`).join('')}
    </div>
  `;
}


// 📊 Crime Rates Section
function showCrimes(state) {
  const tableauOld = `${TABLEAU_BASE_OLD}?:showVizHome=no&${TABLEAU_PARAM}=${encodeURIComponent(state)}`;
  const tableauNew = `${TABLEAU_BASE_NEW}?:showVizHome=no&${TABLEAU_PARAM}=${encodeURIComponent(state)}`;
  CONTENT.innerHTML = `
    <div class="section-header">
      <button class="back-btn" onclick="showCategoryButtons('${state}')">← Back</button>
      <h3>Crime Overview — ${state}</h3>
    </div>
    <div class="dashboard-section">
      <h4>Previous Statistics (2001–2013)</h4>
      <iframe src="${tableauOld}" allowfullscreen></iframe>
    </div>
    <div class="dashboard-section">
      <h4>Current Statistics (2020–2023)</h4>
      <iframe src="${tableauNew}" allowfullscreen></iframe>
    </div>
  `;
}


// 🛡️ Precautions Section
function showPrecautions(state) {
  const precList = [
    "Avoid isolated areas after dark and travel in groups.",
    "Use official taxis or verified transport apps only.",
    "Carry copies of your ID separately from originals.",
    "Be aware of local customs and dress respectfully.",
    "Avoid displaying valuables in crowded places.",
    "Use hotel safes to store cash and passports.",
    "Keep emergency contacts handy at all times.",
    "Women travelers: avoid sharing trip details publicly.",
    "If in distress, reach out immediately to local police or helplines."
  ];
  const help = [
    { service: "Police", number: "112" },
    { service: "Women Helpline", number: "181" },
    { service: "Tourist Helpline", number: "1363" },
    { service: "Ambulance", number: "102" }
  ];

  CONTENT.innerHTML = `
    <div class="section-header">
      <button class="back-btn" onclick="showCategoryButtons('${state}')">← Back</button>
      <h3>Precautions & Helplines</h3>
    </div>
    <div class="precautions-section">
      <div class="prec-box">
        <h4>Necessary Precautions</h4>
        <ul>${precList.map(p => `<li>${p}</li>`).join('')}</ul>
      </div>
      <div class="prec-box">
        <h4>Emergency Helplines</h4>
        <ul>${help.map(h => `<li><b>${h.service}</b>: ${h.number}</li>`).join('')}</ul>
      </div>
    </div>
  `;
}

// 🌍 Utility: Real spots by state
function getSpots(state) {
  const topSpots = {
    "Karnataka": ["Mysore Palace", "Hampi", "Coorg", "Gokarna", "Jog Falls", "Badami Caves", "Nandi Hills", "Murudeshwar", "Chikmagalur", "Bandipur National Park"],
    "Kerala": ["Munnar", "Alleppey", "Wayanad", "Kochi", "Kovalam", "Kumarakom", "Thekkady", "Varkala", "Athirappilly Falls", "Bekal Fort"],
    "Tamil Nadu": ["Chennai Marina Beach", "Madurai Meenakshi Temple", "Ooty", "Kodaikanal", "Mahabalipuram", "Rameswaram", "Thanjavur", "Yercaud", "Coimbatore", "Kanyakumari"],
    "Maharashtra": ["Mumbai Gateway of India", "Ajanta Caves", "Ellora Caves", "Lonavala", "Shirdi", "Mahabaleshwar", "Aurangabad", "Nashik", "Pune", "Alibaug"],
    "Delhi": ["Red Fort", "Qutub Minar", "India Gate", "Lotus Temple", "Humayun’s Tomb", "Akshardham", "Connaught Place", "Chandni Chowk", "Rashtrapati Bhavan", "Lodhi Garden"]
  };
  return topSpots[state] || ["Taj Mahal", "Golden Temple", "Dal Lake", "Kaziranga", "Khajuraho", "Darjeeling", "Rann of Kutch", "Ganga Aarti", "Sundarbans"];
}

