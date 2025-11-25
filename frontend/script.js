// Basic camera handling + demo updates for cards + event log
const video = document.getElementById("video");
let streaming = false;
let intervalId;
const backendUrl = "http://localhost:3000/process-frame"; // keep as-is to match earlier backend

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

document.getElementById("startBtn").addEventListener("click", startCamera);
document.getElementById("stopBtn").addEventListener("click", stopCamera);

// start camera and begin sending frames
async function startCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
    video.srcObject = stream;
    streaming = true;

    // send frames periodically
    intervalId = setInterval(sendFrame, 500); // every 500 ms
  } catch (err) {
    alert("Camera permission required: " + err.message);
  }
}

// capture a frame and POST to backend
async function sendFrame() {
  if (!streaming || video.videoWidth === 0) return;

  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  const dataUrl = canvas.toDataURL("image/jpeg", 0.7);

  // POST frame to backend (backend should forward to python model server)
  try {
    const resp = await fetch(backendUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ frame: dataUrl })
    });

    if (!resp.ok) throw new Error("Network response was not ok");

    const result = await resp.json();

    // expect shape: { drowsiness: "No/Yes/Low", phone: "No/Yes", smoking: "...", drinking: "..." }
    updateStatus(result);

  } catch (err) {
    // If backend is not running, simulate demo values so UI looks correct
    updateStatus(simulate());
    // console.warn("Frame send error:", err);
  }
}

// update UI from model output
function updateStatus(payload) {
  // simple mapping: payload values can be "No"/"Low"/"High" or numeric [0..1]
  const mapVal = (v) => {
    if (typeof v === "number") return Math.round(v*100);
    if (typeof v === "string") {
      if (v.toLowerCase().includes("no")) return 4;
      if (v.toLowerCase().includes("low")) return 30;
      if (v.toLowerCase().includes("medium")) return 55;
      if (v.toLowerCase().includes("high") || v.toLowerCase().includes("yes")) return 85;
      const parsed = parseInt(v);
      if (!isNaN(parsed)) return parsed;
    }
    return 0;
  };

  const dVal = mapVal(payload.drowsiness);
  const pVal = mapVal(payload.phone);
  const drVal = mapVal(payload.drinking || payload.drink || 0);
  const sVal = mapVal(payload.smoking);

  drowsyStatus.innerText = labelFromValue(dVal);
  phoneStatus.innerText = labelFromValue(pVal);
  drinkStatus.innerText = labelFromValue(drVal);
  smokeStatus.innerText = labelFromValue(sVal);

  drowsyBar.style.width = dVal + "%";
  phoneBar.style.width = pVal + "%";
  drinkBar.style.width = drVal + "%";
  smokeBar.style.width = sVal + "%";

  // append to event log if severity high
  if (dVal >= 70) appendLog("Drowsiness", `DRV${Date.now().toString().slice(-4)}`, "Warning", new Date(), "High");
  if (pVal >= 60) appendLog("Phone usage", `PHN${Date.now().toString().slice(-4)}`, "Warning", new Date(), "Medium");
  if (sVal >= 60) appendLog("Smoking", `SMK${Date.now().toString().slice(-4)}`, "Warning", new Date(), "Medium");
}

// human label from bar %
function labelFromValue(n){
  if (n === 0) return "—";
  if (n < 25) return "No";
  if (n < 50) return "Low";
  if (n < 75) return "Medium";
  return "High";
}

// append row to event log table
function appendLog(eventName, code, type, time, severity) {
  // limit rows to last 20
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
  while(eventLogBody.children.length > 20) eventLogBody.removeChild(eventLogBody.lastChild);
}

// stop camera
function stopCamera() {
  streaming = false;
  clearInterval(intervalId);
  const s = video.srcObject;
  if (s) {
    s.getTracks().forEach(t => t.stop());
    video.srcObject = null;
  }
}

// demo simulate values when backend not reachable
function simulate() {
  return {
    drowsiness: Math.random() > 0.9 ? "High" : (Math.random() > 0.96 ? "Medium" : "No"),
    phone: Math.random() > 0.95 ? "High" : "No",
    smoking: Math.random() > 0.98 ? "Yes" : "No",
    drinking: Math.random() > 0.99 ? "Yes" : "No"
  };
}
