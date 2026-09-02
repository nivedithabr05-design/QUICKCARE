// =========================================================
// QuickCare — Smart Hospital Management System
// Front-end demo app. Uses browser localStorage as a stand-in
// "database" with the same collections shown in the original
// design: patients, admissions, prescriptions, food_plans, bills.
// =========================================================

const DB_KEY = "quickcare_db";

function loadDB() {
  let raw = localStorage.getItem(DB_KEY);
  if (raw) return JSON.parse(raw);
  const db = {
    patients: SEED_PATIENTS.map(p => ({ ...p, _id: p.patientId })),
    queue: SEED_QUEUE,
    prescriptions: [],
    food_plans: [],
    bills: []
  };
  saveDB(db);
  return db;
}
function saveDB(db) { localStorage.setItem(DB_KEY, JSON.stringify(db)); }
let DB = loadDB();

function nextPatientId() {
  const nums = DB.patients.map(p => parseInt(p.patientId.replace("P", ""), 10)).filter(n => !isNaN(n));
  const max = nums.length ? Math.max(...nums) : 1000;
  return "P" + (max + 1);
}
function findPatient(idOrPhone) {
  if (!idOrPhone) return null;
  const q = idOrPhone.trim().toLowerCase();
  return DB.patients.find(p => p.patientId.toLowerCase() === q || p.phone === q) || null;
}
function nowStr() {
  return new Date().toLocaleString([], { hour: "2-digit", minute: "2-digit", month: "short", day: "numeric" });
}

// ---------- Navigation ----------
function goTo(id) {
  document.querySelectorAll(".panel").forEach(p => p.classList.remove("active"));
  document.querySelectorAll(".nav-item").forEach(n => n.classList.remove("active"));
  const panel = document.getElementById(id);
  if (panel) panel.classList.add("active");
  document.querySelectorAll(`[data-nav="${id}"]`).forEach(el => {
    if (el.classList.contains("nav-item")) el.classList.add("active");
  });
  if (id === "doctors") renderDoctors();
  if (id === "patients") renderPatients();
  if (id === "queue") renderQueue();
  if (id === "emergency") renderEmergency();
}
document.querySelectorAll("[data-nav]").forEach(el => {
  el.addEventListener("click", () => goTo(el.dataset.nav));
});

// ---------- Departments ----------
function renderDepartments() {
  const grid = document.getElementById("deptGrid");
  grid.innerHTML = DEPARTMENTS.map(d => `
    <div class="dept-card" data-dept="${d.name}">
      <div class="ic">${d.icon}</div>
      <h4>${d.name}</h4>
      <p class="muted" style="font-size:11.5px">${d.location}</p>
    </div>`).join("");
  grid.querySelectorAll(".dept-card").forEach(c => {
    c.addEventListener("click", () => {
      const dept = DEPARTMENTS.find(d => d.name === c.dataset.dept);
      if (dept) {
        goTo("voice");
        showDirection(dept, true);
      }
    });
  });
}

// ---------- Doctors ----------
function populateDeptFilter() {
  const filter = document.getElementById("deptFilter");
  const queueFilter = document.getElementById("queueDeptFilter");
  const admitDept = document.getElementById("admitDept");
  const options = DEPARTMENTS.map(d => `<option value="${d.name}">${d.name}</option>`).join("");
  filter.innerHTML = `<option value="All">All Departments</option>` + options;
  queueFilter.innerHTML = `<option value="All">All Departments</option>` + options;
  admitDept.innerHTML = options;
}
function renderDoctors() {
  const dept = document.getElementById("deptFilter").value || "All";
  const grid = document.getElementById("doctorGrid");
  const list = DOCTORS.filter(d => dept === "All" || d.dept === dept);
  grid.innerHTML = list.map(d => `
    <div class="doctor-card">
      <div class="doctor-avatar"><img src="${d.photo}" alt="${d.name}"></div>
      <h4>${d.name}</h4>
      <p>${d.dept}</p>
      <p>${d.qual}</p>
      <p>${d.exp}</p>
      <p>${d.loc}</p>
      <span class="avail ${d.available ? "yes" : "no"}">${d.available ? "● Available" : "● Not Available"}</span>
    </div>`).join("") || `<p class="muted">No doctors found for this department.</p>`;
}
document.getElementById("deptFilter").addEventListener("change", renderDoctors);

// ---------- Patients table ----------
function renderPatients() {
  const tbody = document.querySelector("#patientsTable tbody");
  tbody.innerHTML = DB.patients.map(p => `
    <tr><td>${p.patientId}</td><td>${p.name}</td><td>${p.age}</td><td>${p.gender}</td><td>${p.phone}</td><td>${p.department || "-"}</td></tr>
  `).join("") || `<tr><td colspan="6" class="muted">No patients yet.</td></tr>`;
}

// ---------- Patient Queue ----------
function renderQueue() {
  const dept = document.getElementById("queueDeptFilter").value || "All";
  const tbody = document.querySelector("#queueTable tbody");
  const rows = DB.queue
    .map(q => ({ ...q, p: findPatient(q.patientId) }))
    .filter(r => r.p && (dept === "All" || r.p.department === dept));
  tbody.innerHTML = rows.map((r, i) => {
    const cls = r.status === "Waiting" ? "waiting" : r.status === "Admitted" ? "admitted" : "consult";
    const action = r.status === "Waiting"
      ? `<button class="btn small" data-call="${r.patientId}">🔔 Call</button>`
      : "";
    return `<tr><td>${i + 1}</td><td>${r.p.patientId}</td><td>${r.p.name}</td><td>${r.p.age}</td><td><span class="status ${cls}">${r.status}</span></td><td>${action}</td></tr>`;
  }).join("") || `<tr><td colspan="6" class="muted">Queue is empty.</td></tr>`;
  tbody.querySelectorAll("[data-call]").forEach(btn => {
    btn.addEventListener("click", () => callPatient(btn.dataset.call));
  });
}
document.getElementById("queueDeptFilter").addEventListener("change", renderQueue);

// ---------- Patient-turn ping ----------
function playPing() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  } catch (e) { /* AudioContext unavailable — silently skip */ }
}
function callPatient(patientId) {
  ringPatientTurn();
  const entry = DB.queue.find(q => q.patientId === patientId && q.status === "Waiting");
  if (!entry) return;
  entry.status = "In Consultation";
  saveDB(DB);
  playPing();
  renderQueue();
}
document.getElementById("callNextBtn").addEventListener("click", () => {
  const dept = document.getElementById("queueDeptFilter").value || "All";
  const next = DB.queue.find(q => {
    if (q.status !== "Waiting") return false;
    const p = findPatient(q.patientId);
    return p && (dept === "All" || p.department === dept);
  });
  if (!next) { alert("No patients waiting" + (dept !== "All" ? ` in ${dept}` : "") + "."); return; }
  callPatient(next.patientId);
});

// ---------- Admit Patient ----------
document.getElementById("admitLookupBtn").addEventListener("click", () => {
  const p = findPatient(document.getElementById("admitLookup").value);
  const box = document.getElementById("admitPreview");
  if (p) {
    document.getElementById("admitName").value = p.name;
    document.getElementById("admitAge").value = p.age;
    document.getElementById("admitGender").value = p.gender;
    document.getElementById("admitDept").value = p.department || DEPARTMENTS[0].name;
    box.innerHTML = `<h3>Patient Details</h3>
      <p><strong>${p.patientId}</strong> — ${p.name}</p>
      <p>Age: ${p.age} &nbsp;|&nbsp; ${p.gender}</p>
      <p>Phone: ${p.phone}</p>
      <p>Department: ${p.department || "-"}</p>`;
  } else {
    box.innerHTML = `<h3>Patient Details</h3><p class="muted">No existing patient found — fill the form to register a new one.</p>`;
  }
});
document.getElementById("admitBtn").addEventListener("click", () => {
  const lookupVal = document.getElementById("admitLookup").value.trim();
  const name = document.getElementById("admitName").value.trim();
  const age = document.getElementById("admitAge").value;
  const gender = document.getElementById("admitGender").value;
  const dept = document.getElementById("admitDept").value;
  if (!name || !age) { alert("Please enter patient name and age."); return; }

  let patient = findPatient(lookupVal);
  if (!patient) {
    patient = {
      _id: nextPatientId(), patientId: nextPatientId(), name, age: Number(age),
      gender, phone: /^\d{7,}$/.test(lookupVal) ? lookupVal : "", department: dept
    };
    patient._id = patient.patientId;
    DB.patients.push(patient);
  } else {
    Object.assign(patient, { name, age: Number(age), gender, department: dept });
  }
  DB.queue.push({ patientId: patient.patientId, status: "Waiting" });
  saveDB(DB);
  document.getElementById("admitPreview").innerHTML =
    `<h3>Patient Admitted ✅</h3><p><strong>${patient.patientId}</strong> — ${patient.name}</p><p>Department: ${dept}</p><p>Added to the ${dept} queue.</p>`;
  ["admitLookup", "admitName", "admitAge"].forEach(id => document.getElementById(id).value = "");
});
document.getElementById("emergencyAdmitBtn").addEventListener("click", () => {
  document.getElementById("admitDept").value = "Emergency";
  goTo("admit");
});

// ---------- Prescription ----------
let rxMeds = [];
function renderRxMeds() {
  const tbody = document.querySelector("#rxMedTable tbody");
  tbody.innerHTML = rxMeds.map((m, i) => `
    <tr>
      <td><input data-i="${i}" data-f="name" value="${m.name}"></td>
      <td><input data-i="${i}" data-f="dosage" value="${m.dosage}"></td>
      <td><input data-i="${i}" data-f="frequency" value="${m.frequency}"></td>
      <td><input data-i="${i}" data-f="duration" value="${m.duration}"></td>
      <td><input data-i="${i}" data-f="price" type="number" value="${m.price}"></td>
      <td><button class="btn small" data-del="${i}">✕</button></td>
    </tr>`).join("");
  tbody.querySelectorAll("input").forEach(inp => {
    inp.addEventListener("input", () => {
      const i = inp.dataset.i, f = inp.dataset.f;
      rxMeds[i][f] = f === "price" ? Number(inp.value) : inp.value;
    });
  });
  tbody.querySelectorAll("[data-del]").forEach(b => {
    b.addEventListener("click", () => { rxMeds.splice(b.dataset.del, 1); renderRxMeds(); });
  });
}
document.getElementById("addMedBtn").addEventListener("click", () => {
  rxMeds.push({ name: "", dosage: "", frequency: "", duration: "", price: 0 });
  renderRxMeds();
});
let rxPatient = null;
document.getElementById("rxLookupBtn").addEventListener("click", () => {
  rxPatient = findPatient(document.getElementById("rxLookup").value);
  const box = document.getElementById("rxPreview");
  if (rxPatient) {
    box.innerHTML = `<h3>Patient</h3><p><strong>${rxPatient.name}</strong></p><p>Age: ${rxPatient.age} · ${rxPatient.gender}</p><p>Phone: ${rxPatient.phone}</p><p>Dept: ${rxPatient.department || "-"}</p>`;
  } else {
    box.innerHTML = `<h3>Patient</h3><p class="muted">No patient found for that ID/phone.</p>`;
  }
});
document.getElementById("saveRxBtn").addEventListener("click", () => {
  if (!rxPatient) { alert("Look up a patient first."); return; }
  const rx = {
    patientId: rxPatient.patientId,
    medicines: rxMeds,
    instructions: document.getElementById("rxInstructions").value,
    createdAt: new Date().toISOString()
  };
  DB.prescriptions.push(rx);
  saveDB(DB);
  alert("Prescription saved.");
});
document.getElementById("sendRxBtn").addEventListener("click", () => {
  if (!rxPatient) { alert("Look up a patient first."); return; }
  const total = rxMeds.reduce((s, m) => s + (Number(m.price) || 0), 0);
  const lines = rxMeds.map(m => `- ${m.name} - ${m.dosage} (${m.frequency})`).join("<br>");
  pushSms(`<strong>Hello ${rxPatient.name},</strong><br>Your Prescription:<br>${lines}<br>Duration: ${rxMeds[0]?.duration || "-"}<br>Instructions: ${document.getElementById("rxInstructions").value}<br>- QuickCare Hospital`);
  goTo("bill");
  document.getElementById("billLookup").value = rxPatient.patientId;
});

// ---------- Food Plan ----------
const MEAL_MENU = {
  "Pediatric Balanced Meal": { Breakfast: "Milk / Oats / Idli + Fruit", Lunch: "Rice + Dal + Veg + Curd", Dinner: "Chapati + Veg + Soup" },
  "Diabetic Diet": { Breakfast: "Vegetable Upma + Sugar-free Tea", Lunch: "Millet Roti + Dal + Salad", Dinner: "Vegetable Soup + Multigrain Bread" },
  "Low Sodium Diet": { Breakfast: "Plain Oats + Fruit", Lunch: "Steamed Rice + Unsalted Dal + Veg", Dinner: "Boiled Vegetables + Roti" },
  "Liquid Diet": { Breakfast: "Fruit Juice", Lunch: "Clear Soup + Coconut Water", Dinner: "Milk / Herbal Tea" },
  "Regular Diet": { Breakfast: "Bread + Eggs / Paratha", Lunch: "Rice + Dal + Sabzi + Salad", Dinner: "Chapati + Curry + Curd" }
};
let fpPatient = null;
document.getElementById("fpLookupBtn").addEventListener("click", () => {
  fpPatient = findPatient(document.getElementById("fpLookup").value);
  if (!fpPatient) { document.getElementById("fpPreview").innerHTML = `<h3>Meal Details</h3><p class="muted">No patient found.</p>`; return; }
  renderFoodPreview();
});
function renderFoodPreview() {
  if (!fpPatient) return;
  const plan = document.getElementById("fpPlan").value;
  const menu = MEAL_MENU[plan];
  const b = document.getElementById("mBreak").checked, l = document.getElementById("mLunch").checked, d = document.getElementById("mDinner").checked;
  let html = `<h3>Meal Details</h3><p><strong>${plan}</strong> for ${fpPatient.name}</p>`;
  if (b) html += `<p><strong>Breakfast</strong><br>${menu.Breakfast}</p>`;
  if (l) html += `<p><strong>Lunch</strong><br>${menu.Lunch}</p>`;
  if (d) html += `<p><strong>Dinner</strong><br>${menu.Dinner}</p>`;
  html += `<p><strong>Instructions</strong><br>${document.getElementById("fpInstructions").value}</p>`;
  document.getElementById("fpPreview").innerHTML = html;
}
["fpPlan", "mBreak", "mLunch", "mDinner", "fpInstructions"].forEach(id =>
  document.getElementById(id).addEventListener("input", renderFoodPreview)
);
document.getElementById("saveFpBtn").addEventListener("click", () => {
  if (!fpPatient) { alert("Look up a patient first."); return; }
  DB.food_plans.push({
    patientId: fpPatient.patientId,
    plan: document.getElementById("fpPlan").value,
    meals: { breakfast: document.getElementById("mBreak").checked, lunch: document.getElementById("mLunch").checked, dinner: document.getElementById("mDinner").checked },
    quantity: document.getElementById("fpQty").value,
    instructions: document.getElementById("fpInstructions").value,
    createdAt: new Date().toISOString()
  });
  saveDB(DB);
  alert("Food plan saved.");
});

// ---------- Billing ----------
let billPatient = null;
function computeBill(patientId) {
  const items = [];
  const rx = DB.prescriptions.filter(r => r.patientId === patientId).pop();
  const fp = DB.food_plans.filter(f => f.patientId === patientId).pop();
  items.push({ cat: "Consultation", details: "General Consultation", amt: 500 });
  items.push({ cat: "Room Charges", details: "General Ward (1 day)", amt: 1500 });
  if (rx) {
    const medTotal = rx.medicines.reduce((s, m) => s + (Number(m.price) || 0), 0);
    items.push({ cat: "Medicines", details: "From Prescription", amt: medTotal });
  }
  items.push({ cat: "Lab Tests", details: "CBC, Urine", amt: 800 });
  if (fp) items.push({ cat: "Food Charges", details: `${fp.plan} (${fp.quantity} day)`, amt: 300 * Number(fp.quantity || 1) });
  return items;
}
document.getElementById("billLookupBtn").addEventListener("click", () => {
  billPatient = findPatient(document.getElementById("billLookup").value);
  const tbody = document.querySelector("#billTable tbody");
  if (!billPatient) { tbody.innerHTML = `<tr><td colspan="3" class="muted">No patient found.</td></tr>`; document.getElementById("billTotal").textContent = "₹0"; return; }
  const items = computeBill(billPatient.patientId);
  tbody.innerHTML = items.map(i => `<tr><td>${i.cat}</td><td>${i.details}</td><td>${i.amt}</td></tr>`).join("");
  const total = items.reduce((s, i) => s + i.amt, 0);
  document.getElementById("billTotal").textContent = "₹" + total;
});
document.getElementById("saveBillBtn").addEventListener("click", () => {
  if (!billPatient) { alert("Look up a patient first."); return; }
  const items = computeBill(billPatient.patientId);
  const total = items.reduce((s, i) => s + i.amt, 0);
  DB.bills.push({ patientId: billPatient.patientId, items, totalAmount: total, status: "Paid", createdAt: new Date().toISOString() });
  saveDB(DB);
  alert("Bill saved to database.");
});
document.getElementById("sendBillBtn").addEventListener("click", () => {
  if (!billPatient) { alert("Look up a patient first."); return; }
  const items = computeBill(billPatient.patientId);
  const total = items.reduce((s, i) => s + i.amt, 0);
  const lines = items.map(i => `${i.cat}: ₹${i.amt}`).join("<br>");
  pushSms(`<strong>Your Bill Summary</strong><br>${lines}<br>Total: ₹${total}<br>- QuickCare Hospital`);
});
function pushSms(html) {
  const body = document.getElementById("phoneBody");
  if (body.querySelector(".muted")) body.innerHTML = "";
  body.innerHTML += `<div class="msg">${html}<span class="time">${nowStr()}</span></div>`;
  body.scrollTop = body.scrollHeight;
}

// ---------- Emergency: ambulance drivers + guidelines ----------
function renderEmergency() {
  document.getElementById("ambulanceList").innerHTML = AMBULANCE_DRIVERS.map(a => `
    <div class="ambulance-row">
      <div><strong>${a.name}</strong><br><span class="muted">${a.vehicle}</span></div>
      <a class="btn success small" href="tel:${a.phone}">📞 ${a.phone}</a>
    </div>`).join("");
  document.getElementById("guidelinesList").innerHTML =
    EMERGENCY_GUIDELINES.map(g => `<li>${g}</li>`).join("");
}

// ---------- Voice Assistant ----------
const micBtn = document.getElementById("micBtn");
const voiceStatus = document.getElementById("voiceStatus");
const navResult = document.getElementById("navResult");
let recognizing = false;

function matchDept(text) {
  text = text.toLowerCase();
  return DEPARTMENTS.find(d => text.includes(d.name.toLowerCase())) || null;
}
function showDirection(dept, fromDepartmentClick = false) {
  const routes = {
    "Cardiology": [
      "Take the main corridor, turn left at the reception desk, then continue to the Heart Care Wing on the first floor.",
      "From the main entrance, follow the blue hospital signs, take the lift to Floor 1, and turn right toward the Cardiology Wing."
    ],
    "Neurology": [
      "Walk straight from reception to the central lift, go to Floor 2, and follow the green signs to Neurology.",
      "Take the corridor beside the pharmacy, turn right at the waiting area, and continue to the Neurology Department."
    ],
    "Orthopedics": [
      "From the entrance, follow the orange signs to the Orthopedics Wing and continue past the physiotherapy unit.",
      "Take the main lift to Floor 1, turn left, and follow the Orthopedics signs to the consultation rooms."
    ],
    "Pediatrics": [
      "Follow the child-care signs from reception, take the corridor on the right, and continue to the Pediatrics Wing.",
      "From the main entrance, take the lift to Floor 2 and follow the yellow signs to Pediatrics."
    ],
    "Emergency": [
      "Proceed straight to the Emergency entrance, located beside the ambulance bay, and report to the emergency reception.",
      "Follow the red emergency signs from the main entrance. The Emergency Department is on the ground floor."
    ]
  };

  const deptRoutes = routes[dept.name] || [
    `Follow the hospital direction signs from reception to ${dept.location}.`
  ];
  const routeText = deptRoutes[Math.floor(Math.random() * deptRoutes.length)];

  navResult.innerHTML = `
    <div class="route-card">
      <p>📍 <strong>${dept.name}</strong></p>
      <p>${routeText}</p>
      <p class="muted">Destination: ${dept.location}</p>
    </div>`;

  voiceStatus.textContent = fromDepartmentClick
    ? `Routing you to ${dept.name}…`
    : `Recognized: ${dept.name}`;

  speakRoute(`Route to ${dept.name}. ${routeText}`);
}
function speakRoute(text) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel(); // stop any previous utterance
  const utter = new SpeechSynthesisUtterance(text);
  utter.rate = 0.95;
  window.speechSynthesis.speak(utter);
}
function startListeningUI() {
  micBtn.classList.add("listening");
  voiceStatus.innerHTML = "Listening… please say a department name.";
}
function stopListeningUI() {
  micBtn.classList.remove("listening");
}

micBtn.addEventListener("click", () => {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) {
    // Fallback: text prompt if browser doesn't support speech recognition
    const text = prompt("Speech recognition isn't available in this browser.\nType a department name instead:");
    if (text) {
      const dept = matchDept(text);
      if (dept) { showDirection(dept); voiceStatus.textContent = "Recognized: " + dept.name; }
      else { navResult.innerHTML = `<p class="muted">Sorry, department not recognized. Try: ${DEPARTMENTS.map(d => d.name).join(", ")}.</p>`; }
    }
    return;
  }
  if (recognizing) return;
  const rec = new SR();
  rec.lang = "en-US";
  rec.onstart = () => { recognizing = true; startListeningUI(); };
  rec.onend = () => { recognizing = false; stopListeningUI(); };
  rec.onresult = (e) => {
    const text = e.results[0][0].transcript;
    const dept = matchDept(text);
    if (dept) { showDirection(dept); voiceStatus.textContent = `Recognized: "${text}"`; }
    else { navResult.innerHTML = `<p class="muted">Heard "${text}" — department not recognized. Try: ${DEPARTMENTS.map(d => d.name).join(", ")}.</p>`; }
  };
  rec.onerror = () => { recognizing = false; stopListeningUI(); voiceStatus.textContent = "Couldn't hear that. Tap the mic to try again."; };
  rec.start();
});

// ---------- Nearby Hospitals ----------
const findHospitalsBtn = document.getElementById("findHospitalsBtn");
const nearbyStatus = document.getElementById("nearbyStatus");
const mapsHospitalLink = document.getElementById("mapsHospitalLink");

function findNearbyHospitals() {
  if (!navigator.geolocation) {
    nearbyStatus.textContent = "Location is not supported by this browser. Open the map to search manually.";
    mapsHospitalLink.href = "https://www.google.com/maps/search/hospitals";
    return;
  }

  nearbyStatus.textContent = "Getting your location…";

  navigator.geolocation.getCurrentPosition(
    position => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      mapsHospitalLink.href =
        `https://www.google.com/maps/search/hospitals/@${lat},${lng},14z`;
      nearbyStatus.textContent =
        "Your location was found. Open the map to see hospitals near you.";
    },
    () => {
      nearbyStatus.textContent =
        "Location access was denied. Open the map and search for hospitals manually.";
      mapsHospitalLink.href = "https://www.google.com/maps/search/hospitals";
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
  );
}

if (findHospitalsBtn) {
  findHospitalsBtn.addEventListener("click", findNearbyHospitals);
}

// ---------- Init ----------

renderDepartments();
populateDeptFilter();
renderPatients();
renderEmergency();
goTo("departments");


// Play a short hospital-style chime whenever a patient is called/turned.
document.addEventListener("click", (event) => {
  const el = event.target.closest(
    "#callPatientBtn, .call-patient, [data-action='call-patient'], [data-action='callPatient']"
  );
  if (el) ringPatientTurn();
});
