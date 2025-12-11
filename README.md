# 🚗 Real-Time Driver Monitoring System (DMS)

A real-time Driver Monitoring System that detects **drowsiness** and **distracted behaviors** using deep learning, applies temporal rules to avoid false alarms, and provides **visual and audio alerts** to improve driving safety.

---

## 📌 Project Overview
This project was developed as part of the DEPI training program.  
It aims to:
- Detect **driver drowsiness** using CNN/MobileNetV2.
- Detect **distraction behaviors** (phone use, smoking, eating, etc.).
- Apply **temporal rules** to avoid missclassifying blinking with drowsiness.
- Provide **visual & sound alerts** in real-time on webcam feed.
- Log all events (drowsiness, distractions) (Optinoal feature).

---

## 🖼️ Final Interface
- **Live Webcam Feed** – Shows real-time detection.
- **Status Panel** – Displays current driver state (Drowsy, Alert, Distracted).
- **Alerts** – Visual (red border/text) + Audio (buzzer/beep)(optional).
- **Logging System** – Saves `.csv` file after each session with(optional):
  - Timestamp of events
  - Event type (Drowsy/Distraction)
  - Duration of event
  - Alert triggered (Yes/No)

---
## ⚙️ Tech Stack

- **Python** (TensorFlow / OpenCV / NumPy / Pandas / Pytorch)
- **Yolo** for detection and classification
- **Matplotlib/ Seaborn** for visualizations
- **PyAudio / Playsound** for audio alerts (Optional)

---
## Data 
- Drowsiness :
  1- https://www.kaggle.com/datasets/ismailnasri20/driver-drowsiness-dataset-ddd
  2- https://drive.google.com/drive/folders/1iknet8ImRTlQkcPCQYEr4F9nt3DS-JJ1

- Behaivior
  1- https://universe.roboflow.com/alora-jubkn/ultilmate5-dbkgs
  (V1)

--
## How to Run the Web Application

1. Download the entire Driver Monitoring System folder.

2. Open the project in VS Code.

3. Navigate to the backend folder:
   ```sh
   cd model_server
   ```

4. Install all required dependencies:
   ```sh
   pip install -r requirements.txt
   ```

5. Run the Flask application:
   ```sh
   python inference.py
   ```

6. Start the frontend:
   - Use "Go Live" in VS Code (Live Server extension)
   - Open the file:
     ```sh
     frontend/first.html
     ```
