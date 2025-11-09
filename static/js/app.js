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

// 🏝️ Tourist Spots Section


// ✨ Optional Tagline (custom per state)
function getTagline(state) {
  const quotes = {
    "Karnataka": "Land of Sandalwood, Hills and Heritage.",
    "Kerala": "God’s Own Country.",
    "Tamil Nadu": "Where Culture Meets Coastline.",
    "Maharashtra": "Gateway to India’s Heritage.",
    "Rajasthan": "The Desert Jewel of India.",
    "Puducherry": "Where French Charm Meets Indian Soul."
  };
  return quotes[state] || "Discover the beauty and stories of this region.";
}

// 🏝️ Tourist Spots Section
function showTourism(state) {
  const spots = getSpots(state);
  const safeState = state.replace(/\s+/g, "_");
  const imagePath = `/static/images/states_optimized/${safeState}.jpg`;

  CONTENT.innerHTML = `
    <div class="section-header">
      <button class="back-btn" onclick="showCategoryButtons('${state}')">← Back</button>
      <h3>Top Tourist Spots in ${state}</h3>
    </div>

    <div class="state-banner">
      <img src="${imagePath}" alt="${state}" onerror="this.src='/static/images/default.jpg'">
      <div class="state-tagline">"${getTagline(state)}"</div>
    </div>

    <div class="spots-grid fancy-grid">
      ${spots.map(spot => `
        <div class="spotCardBox">
          <div class="spotName">${spot}</div>
        </div>
      `).join('')}
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
    // 🟢 SOUTH INDIA
    "Andhra Pradesh": ["Tirupati Balaji Temple", "Araku Valley", "Vizag RK Beach", "Lepakshi Temple", "Gandikota Canyon", "Srisailam Temple", "Belum Caves", "Papikondalu", "Nagarjuna Sagar Dam", "Ahobilam Temple"],
    "Telangana": ["Charminar", "Golconda Fort", "Ramoji Film City", "Warangal Fort", "Birla Mandir Hyderabad", "Hussain Sagar Lake", "Chilkur Balaji Temple", "Bhongir Fort", "Kuntala Waterfalls", "Basar Temple"],
    "Karnataka": ["Mysore Palace", "Hampi", "Coorg", "Gokarna", "Jog Falls", "Badami Caves", "Nandi Hills", "Murudeshwar", "Chikmagalur", "Bandipur National Park"],
    "Kerala": ["Munnar", "Alleppey Backwaters", "Kochi", "Wayanad", "Kovalam", "Kumarakom", "Thekkady", "Varkala", "Athirappilly Falls", "Bekal Fort"],
    "Tamil Nadu": ["Marina Beach", "Meenakshi Temple", "Ooty", "Kodaikanal", "Mahabalipuram", "Rameswaram", "Kanyakumari", "Thanjavur Temple", "Yercaud", "Coimbatore Adiyogi Statue"],
    "Goa": ["Baga Beach", "Anjuna Beach", "Fort Aguada", "Dudhsagar Falls", "Basilica of Bom Jesus", "Chapora Fort", "Palolem Beach", "Colva Beach", "Se Cathedral", "Spice Plantations"],
    
    // 🟡 WEST INDIA
    "Maharashtra": ["Gateway of India", "Ajanta Caves", "Ellora Caves", "Shirdi", "Lonavala", "Mahabaleshwar", "Pune Shaniwarwada", "Alibaug", "Aurangabad Bibi Ka Maqbara", "Nashik Trimbakeshwar Temple"],
    "Gujarat": ["Statue of Unity", "Gir National Park", "Somnath Temple", "Dwarkadhish Temple", "Rann of Kutch", "Saputara Hills", "Sabarmati Ashram", "Laxmi Vilas Palace", "Modhera Sun Temple", "Junagadh Fort"],
    "Rajasthan": ["Jaipur Amer Fort", "Udaipur City Palace", "Jaisalmer Fort", "Mount Abu", "Pushkar Lake", "Mehrangarh Fort", "Hawa Mahal", "Chittorgarh Fort", "Ranthambore National Park", "Bikaner Junagarh Fort"],
    "Goa": ["Baga Beach", "Calangute Beach", "Fort Aguada", "Chapora Fort", "Se Cathedral", "Basilica of Bom Jesus", "Dudhsagar Falls", "Spice Plantations", "Palolem Beach", "Anjuna Market"],

    // 🟠 CENTRAL INDIA
    "Madhya Pradesh": ["Khajuraho Temples", "Sanchi Stupa", "Kanha National Park", "Bandhavgarh National Park", "Orchha Fort", "Pachmarhi", "Bhedaghat Marble Rocks", "Ujjain Mahakaleshwar Temple", "Gwalior Fort", "Bhimbetka Caves"],
    "Chhattisgarh": ["Chitrakote Falls", "Tirathgarh Waterfalls", "Barnawapara Sanctuary", "Bastar Palace", "Kanger Valley National Park", "Rajim Temple", "Sirpur Heritage Site", "Mainpat", "Bhoramdeo Temple", "Dongargarh Temple"],

    // 🔵 NORTH INDIA
    "Delhi": ["Red Fort", "Qutub Minar", "India Gate", "Lotus Temple", "Humayun’s Tomb", "Akshardham Temple", "Connaught Place", "Chandni Chowk", "Rashtrapati Bhavan", "Lodhi Garden"],
    "Uttar Pradesh": ["Taj Mahal", "Varanasi Ghats", "Fatehpur Sikri", "Mathura", "Vrindavan", "Ayodhya Ram Mandir", "Lucknow Bara Imambara", "Jhansi Fort", "Agra Fort", "Sarnath"],
    "Punjab": ["Golden Temple", "Wagah Border", "Jallianwala Bagh", "Chandigarh Rock Garden", "Anandpur Sahib", "Kapurthala Palace", "Ropar Wetland", "Qila Mubarak", "Ludhiana Museum", "Maharaja Ranjit Singh Museum"],
    "Haryana": ["Kurukshetra", "Pinjore Gardens", "Morni Hills", "Sultanpur Bird Sanctuary", "Damdama Lake", "Kingdom of Dreams", "Tilyar Lake", "Karna Lake", "Panipat Battlefield", "Yadavindra Gardens"],
    "Himachal Pradesh": ["Shimla Ridge", "Manali", "Kullu Valley", "Dalhousie", "Spiti Valley", "Kinnaur Kailash", "Dharamshala", "Kasol", "Bir Billing", "Chail Palace"],
    "Uttarakhand": ["Rishikesh", "Haridwar", "Nainital", "Mussoorie", "Jim Corbett", "Auli", "Badrinath Temple", "Kedarnath", "Valley of Flowers", "Lansdowne"],
    "Jammu and Kashmir": ["Srinagar Dal Lake", "Gulmarg", "Pahalgam", "Sonmarg", "Vaishno Devi", "Leh Palace", "Amarnath Cave", "Kupwara", "Hemis Monastery", "Kargil War Memorial"],
    "Ladakh": ["Pangong Lake", "Nubra Valley", "Leh Palace", "Magnetic Hill", "Tso Moriri Lake", "Thiksey Monastery", "Zanskar Valley", "Hemis Monastery", "Khardung La", "Diskit Gompa"],
    "Chandigarh": ["Rock Garden", "Sukhna Lake", "Rose Garden", "Capitol Complex", "Government Museum", "Japanese Garden", "Terraced Garden", "Shanti Kunj", "Elante Mall", "Garden of Fragrance"],

    // 🔴 EAST INDIA
    "Bihar": ["Bodh Gaya", "Nalanda University Ruins", "Rajgir", "Vaishali", "Patna Museum", "Mahavir Mandir", "Vikramshila", "Kaimur Hills", "Kesaria Stupa", "Pawapuri"],
    "Jharkhand": ["Betla National Park", "Hundru Falls", "Dassam Falls", "Parasnath Hill", "Ranchi Lake", "Netarhat", "Deoghar Temple", "Patratu Valley", "Hazaribagh", "Jonha Falls"],
    "Odisha": ["Konark Sun Temple", "Puri Jagannath Temple", "Chilika Lake", "Lingaraja Temple", "Bhitarkanika National Park", "Simlipal National Park", "Dhauli Stupa", "Raghurajpur Heritage Village", "Udayagiri Caves", "Hirakud Dam"],
    "West Bengal": ["Victoria Memorial", "Howrah Bridge", "Sundarbans", "Darjeeling", "Kalimpong", "Digha Beach", "Belur Math", "Shantiniketan", "Murshidabad Palace", "Bishnupur Temples"],
    "Sikkim": ["Gangtok", "Tsomgo Lake", "Nathula Pass", "Pelling", "Yuksom", "Rumtek Monastery", "Lachung", "Lachen", "Zuluk", "Namchi"],

    // 🟣 NORTHEAST INDIA
    "Assam": ["Kaziranga National Park", "Kamakhya Temple", "Majuli Island", "Sivasagar", "Manas National Park", "Hajo", "Pobitora Wildlife Sanctuary", "Tezpur", "Jorhat", "Diphu"],
    "Arunachal Pradesh": ["Tawang Monastery", "Ziro Valley", "Bomdila", "Itanagar", "Sela Pass", "Dirang", "Namdapha National Park", "Mechuka", "Pasighat", "Roing"],
    "Nagaland": ["Kohima War Cemetery", "Dzukou Valley", "Khonoma Village", "Tuophema Village", "Japfu Peak", "Mokokchung", "Longleng", "Phek", "Wokha", "Dimapur"],
    "Manipur": ["Loktak Lake", "Kangla Fort", "Keibul Lamjao National Park", "Ima Keithel Market", "Shirui Hills", "Andro Village", "Tharon Cave", "Kangkhui Cave", "Sendra Island", "Moirang INA Museum"],
    "Mizoram": ["Aizawl", "Phawngpui Peak", "Reiek", "Hmuifang", "Tam Dil Lake", "Vantawng Falls", "Lunglei", "Serchhip", "Saiha", "Champhai"],
    "Tripura": ["Ujjayanta Palace", "Neermahal", "Sepahijala Sanctuary", "Unakoti", "Jampui Hills", "Tripura Sundari Temple", "Dumboor Lake", "Chhabimura", "Baramura Hills", "Heritage Park"],
    "Meghalaya": ["Cherrapunji", "Shillong", "Mawsynram", "Dawki River", "Mawlynnong", "Nohkalikai Falls", "Laitlum Canyons", "Elephant Falls", "Krang Suri Falls", "Umiam Lake"],

    // ⚪ UNION TERRITORIES
    "Andaman and Nicobar Islands": ["Radhanagar Beach", "Cellular Jail", "Havelock Island", "Neil Island", "Ross Island", "Baratang Caves", "North Bay Island", "Mount Harriet", "Chidiya Tapu", "Long Island"],
    "Lakshadweep": ["Agatti Island", "Bangaram Island", "Kavaratti", "Kalpeni", "Minicoy", "Kadmat Island", "Thinnakara", "Suheli Par", "Andretti", "Chetlat"],
    "Puducherry": ["Auroville", "Promenade Beach", "Aurobindo Ashram", "Paradise Beach", "French Quarter", "Serenity Beach", "Chunnambar Boat House", "Manakula Vinayagar Temple", "Bharathi Park", "Botanical Garden"],
    "Daman and Diu": ["Diu Fort", "Nagoa Beach", "Jampore Beach", "St. Paul’s Church", "Naida Caves", "Devka Beach", "Somnath Mahadev Temple", "INS Khukri Memorial", "Gangeshwar Temple", "Fort of Moti Daman"],
    "Dadra and Nagar Haveli": ["Vanganga Lake", "Hirwa Van Garden", "Tribal Museum", "Dudhni Lake", "Khanvel", "Satmaliya Deer Park", "Silvassa Church", "Vasona Lion Safari", "Island Garden", "Bindrabin Temple"],
    "Ladakh": ["Pangong Lake", "Nubra Valley", "Leh Palace", "Magnetic Hill", "Tso Moriri", "Thiksey Monastery", "Khardung La", "Zanskar Valley", "Hemis Monastery", "Diskit Gompa"],
    "Jammu and Kashmir": ["Srinagar Dal Lake", "Gulmarg", "Pahalgam", "Sonmarg", "Vaishno Devi", "Amarnath Cave", "Leh Palace", "Kupwara", "Hemis Monastery", "Kargil"],
    "Chandigarh": ["Rock Garden", "Sukhna Lake", "Rose Garden", "Capitol Complex", "Japanese Garden", "Elante Mall", "Shanti Kunj", "Government Museum", "Terraced Garden", "Garden of Fragrance"]
  };

  return topSpots[state] || [];
}


