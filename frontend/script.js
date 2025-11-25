// ---------------------------------------------------------
// GLOBAL USER STATUS (runs on all pages)
// ---------------------------------------------------------
function updateUserStatus() {
    const userStatusBox = document.getElementById("userStatus");
    if (!userStatusBox) return; // If page has no user status element, skip

    const isGuest = localStorage.getItem("isGuest") === "true";
    const username = localStorage.getItem("username");

    if (isGuest) {
        userStatusBox.textContent = "Guest";
    } else if (username) {
        userStatusBox.textContent = username;
    } else {
        userStatusBox.textContent = "User";
    }
}

updateUserStatus(); // Run on every page



// ---------------------------------------------------------
// CAMERA PAGE CHECK (only run camera code if the elements exist)
// ---------------------------------------------------------
const video = document.getElementById("video");
const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const exitBtn = document.querySelector(".exit-btn");

const isCameraPage = video && startBtn && stopBtn;



// ---------------------------------------------------------
// ONLY INITIALIZE CAMERA FUNCTIONS IF ON first.html
// ---------------------------------------------------------
let streaming = false;
let intervalId;
const backendUrl = "http://localhost:3000/process-frame";

// UI elements (only exist on camera page)
const drowsyStatus = document.getElementById("drowsyStatus");
const phoneStatus = document.getElementById("phoneStatus");
const drinkStatus = document.getElementById("drinkStatus");
const smokeStatus = document.getElementById("smokeStatus");

const drowsyBar = document.getElementById("drowsyBar");
const phoneBar = document.getElementById("phoneBar");
const drinkBar = document.getElementById("drinkBar");
const smokeBar = document.getElementById("smokeBar");

const eventLogBody = document.querySelector("#eventLog tbody");



// ---------------------------------------------------------
// EVENT LISTENERS (camera page only)
// ---------------------------------------------------------
if (isCameraPage) {
    startBtn.addEventListener("click", startCamera);
    stopBtn.addEventListener("click", stopCamera);

    if (exitBtn) {
        exitBtn.addEventListener("click", () => {
            stopCamera();
            window.location.href = "sign_in.html";
        });
    }
}



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

        intervalId = setInterval(sendFrame, 500);

    } catch (err) {
        alert("Camera permission required: " + err.message);
    }
}



// ---------------------------------------------------------
// SEND FRAME TO BACKEND
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
        updateStatus(simulate()); // fallback
    }
}



// ---------------------------------------------------------
// UPDATE UI (camera page)
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
// EVENT LOG
// ---------------------------------------------------------
let eventLogArray = [];

function appendLog(eventName, code, type, time, severity) {
  if (!eventLogBody) return;

  // Save event to array
  eventLogArray.push({
    id: eventLogArray.length + 1,
    eventName,
    code,
    type,
    time: time.toLocaleTimeString(),
    severity
  });

  // Create row for UI table
  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td>${eventLogArray.length}</td>
    <td>${eventName}</td>
    <td>${code}</td>
    <td>${type}</td>
    <td>${time.toLocaleTimeString()}</td>
    <td>${severity}</td>
  `;
  eventLogBody.prepend(tr);

  while (eventLogBody.children.length > 20)
    eventLogBody.removeChild(eventLogBody.lastChild);
}




// ---------------------------------------------------------
// STOP CAMERA
// ---------------------------------------------------------
function stopCamera() {
    streaming = false;
    clearInterval(intervalId);

    const s = video?.srcObject;
    if (s) {
        s.getTracks().forEach(t => t.stop());
        video.srcObject = null;
    }
}



// ---------------------------------------------------------
// SIMULATION (fallback)
// ---------------------------------------------------------
function simulate() {
    return {
        drowsiness: Math.random() > 0.9 ? "High" : (Math.random() > 0.96 ? "Medium" : "No"),
        phone: Math.random() > 0.95 ? "High" : "No",
        smoking: Math.random() > 0.98 ? "Yes" : "No",
        drinking: Math.random() > 0.99 ? "Yes" : "No"
    };
}
// -------------------------------------------------------
document.getElementById("downloadReportBtn")?.addEventListener("click", downloadReport);

function downloadReport() {
  const isGuest = localStorage.getItem("isGuest") === "true";
  const username = localStorage.getItem("username") || "Unknown User";
  const userEmail = isGuest ? "Guest (No email)" : username;

  let reportText = `Driver Monitor Report\n\n`;
  reportText += `User Email: ${userEmail}\n`;
  reportText += `Generated At: ${new Date().toLocaleString()}\n\n`;
  reportText += `Recorded Events:\n---------------------------------\n`;

  if (eventLogArray.length === 0) {
    reportText += "No events recorded.\n";
  } else {
    eventLogArray.forEach(ev => {
      reportText += 
        `ID: ${ev.id}\n` +
        `Event: ${ev.eventName}\n` +
        `Code: ${ev.code}\n` +
        `Type: ${ev.type}\n` +
        `Time: ${ev.time}\n` +
        `Severity: ${ev.severity}\n` +
        `---------------------------------\n`;
    });
  }

  // Create file
  const blob = new Blob([reportText], { type: "text/plain" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `DriverMonitor_Report_${Date.now()}.txt`;
  link.click();
}
