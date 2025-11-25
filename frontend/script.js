// BASIC CAMERA + BACKEND COMMUNICATION
const video = document.getElementById("video");
let streaming = false;
let intervalId;

// IMPORTANT: send to Node backend, not Python directly
const backendUrl = "http://localhost:3000/process-frame";

// UI elements
const drowsyStatus = document.getElementById("drowsyStatus");
const phoneStatus = document.getElementById("phoneStatus");
const drinkStatus = document.getElementById("drinkStatus");
const smokeStatus = document.getElementById("smokeStatus");

const drowsyBar = document.getElementById("drowsyBar");
const phoneBar = document.getElementById("phoneBar");
const drinkBar = document.getElementById("drinkBar");
const smokeBar = document.getElementById("smokeBar");

const eventLogBody = document.querySelector("#eventLog tbody");

// Buttons
document.getElementById("startBtn").addEventListener("click", startCamera);
document.getElementById("stopBtn").addEventListener("click", stopCamera);

// EXIT BUTTON → go to sign_in.html
document.querySelector(".exit-btn").addEventListener("click", () => {
    stopCamera(); // stop monitoring safely
    window.location.href = "sign_in.html";
});

// ---------------------------------------------------------
// START CAMERA
// ---------------------------------------------------------
async function startCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user" },
      audio: false
    });

    video.srcObject = stream;
    streaming = true;

    // send frames every 500ms
    intervalId = setInterval(sendFrame, 500);

  } catch (err) {
    alert("Camera permission required: " + err.message);
  }
}

// ---------------------------------------------------------
// CAPTURE FRAME + SEND TO BACKEND
// ---------------------------------------------------------
async function sendFrame() {
  if (!streaming || video.videoWidth === 0) return;

  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const ctx = canvas.getContext("2d");
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  const dataUrl = canvas.toDataURL("image/jpeg", 0.7);

  try {
    const resp = await fetch(backendUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ frame: dataUrl })
    });

    if (!resp.ok) throw new Error("Backend error");

    const result = await resp.json();
    updateStatus(result);

  } catch (err) {
    // fallback simulation if backend offline
    updateStatus(simulate());
  }
}

// ---------------------------------------------------------
// UPDATE UI
// ---------------------------------------------------------
function updateStatus(payload) {
  const mapVal = (v) => {
    if (typeof v === "number") return Math.round(v * 100);

    if (typeof v === "string") {
      const l = v.toLowerCase();
      if (l.includes("no")) return 4;
      if (l.includes("low")) return 30;
      if (l.includes("medium")) return 55;
      if (l.includes("high") || l.includes("yes")) return 85;
    }
    return 0;
  };

  const dVal = mapVal(payload.drowsiness);
  const pVal = mapVal(payload.phone);
  const drVal = mapVal(payload.drinking || payload.drink || "No");
  const sVal = mapVal(payload.smoking);

  drowsyStatus.innerText = labelFromValue(dVal);
  phoneStatus.innerText = labelFromValue(pVal);
  drinkStatus.innerText = labelFromValue(drVal);
  smokeStatus.innerText = labelFromValue(sVal);

  drowsyBar.style.width = dVal + "%";
  phoneBar.style.width = pVal + "%";
  drinkBar.style.width = drVal + "%";
  smokeBar.style.width = sVal + "%";

  // Event log auto-append
  if (dVal >= 70) appendLog("Drowsiness", `DRV${Date.now().toString().slice(-4)}`, "Warning", new Date(), "High");
  if (pVal >= 60) appendLog("Phone usage", `PHN${Date.now().toString().slice(-4)}`, "Warning", new Date(), "Medium");
  if (sVal >= 60) appendLog("Smoking", `SMK${Date.now().toString().slice(-4)}`, "Warning", new Date(), "Medium");
}

// ---------------------------------------------------------
function labelFromValue(n) {
  if (n === 0) return "—";
  if (n < 25) return "No";
  if (n < 50) return "Low";
  if (n < 75) return "Medium";
  return "High";
}

// ---------------------------------------------------------
// LOG TABLE
// ---------------------------------------------------------
function appendLog(eventName, code, type, time, severity) {
  if (!eventLogBody) return;

  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td>${eventLogBody.children.length + 1}</td>
    <td>${eventName}</td>
    <td>${code}</td>
    <td>${type}</td>
    <td>${time.toLocaleTimeString()}</td>
    <td>${severity}</td>
  `;
  eventLogBody.prepend(tr);

  // keep last 20
  while (eventLogBody.children.length > 20)
    eventLogBody.removeChild(eventLogBody.lastChild);
}

// ---------------------------------------------------------
function stopCamera() {
  streaming = false;
  clearInterval(intervalId);

  const s = video.srcObject;
  if (s) {
    s.getTracks().forEach(t => t.stop());
    video.srcObject = null;
  }
}

// ---------------------------------------------------------
// SIMULATE MODEL WHEN BACKEND OFFLINE
// ---------------------------------------------------------
function simulate() {
  return {
    drowsiness: Math.random() > 0.9 ? "High" : (Math.random() > 0.96 ? "Medium" : "No"),
    phone: Math.random() > 0.95 ? "High" : "No",
    smoking: Math.random() > 0.98 ? "Yes" : "No",
    drinking: Math.random() > 0.99 ? "Yes" : "No"
  };
}
