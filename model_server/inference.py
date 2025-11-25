from flask import Flask, request, jsonify
from flask_cors import CORS
from ultralytics import YOLO
import base64
import numpy as np
import cv2

app = Flask(__name__)
CORS(app)

# Load your model (IMPORTANT: use correct filename)
model = YOLO("2nd-driver-behavior1-best-action40.pt")   # <-- change this

def decode_base64(data_url):
    header, encoded = data_url.split(",", 1)
    img_bytes = base64.b64decode(encoded)
    nparr = np.frombuffer(img_bytes, np.uint8)
    return cv2.imdecode(nparr, cv2.IMREAD_COLOR)

@app.post("/infer")
def infer():
    data = request.get_json()
    img = decode_base64(data["frame"])

    results = model(img,imgsz=640, conf=0.3)[0]

    names = results.names
    detections = [names[int(c)].lower() for c in results.boxes.cls]

    print("DETECTED:", detections)

    response = {
        "drowsiness": "No",  # (your model does NOT include drowsy class)
        "drinking": "Yes" if "drinking" in detections else "No",
        "phone": "Yes" if "phone" in detections else "No",
        "smoking": "Yes" if "smoking" in detections else "No",
    }

    return jsonify(response)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
