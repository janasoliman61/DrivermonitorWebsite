from flask import Flask, request, jsonify
from flask_cors import CORS
from ultralytics import YOLO
import base64
import numpy as np
import cv2
import os

app = Flask(__name__)
CORS(app)


# ---------------------------------------------------
# LOAD MODELS
# ---------------------------------------------------

# Model 1 model (phone, drink, smoke)
distraction_model = YOLO("behavior-ultimate2-v8s-100-epochs-best.pt")

# Model 2 drowsiness model (if not ready, skip)
drowsiness_model_path = "drowsiness-model.pt"
drowsiness_model = YOLO(drowsiness_model_path) if os.path.exists(drowsiness_model_path) else None

print("\nDistraction model loaded.")
if drowsiness_model:
    print("Drowsiness model loaded.")
else:
    print("Drowsiness model NOT found. Using default 'No' values.")



# ---------------------------------------------------
# DECODE BASE64 IMAGE
# ---------------------------------------------------
def decode_base64(data_url):
    header, encoded = data_url.split(",", 1)
    img_bytes = base64.b64decode(encoded)
    nparr = np.frombuffer(img_bytes, np.uint8)
    return cv2.imdecode(nparr, cv2.IMREAD_COLOR)



# ---------------------------------------------------
# ENDPOINT: /infer
# ---------------------------------------------------
@app.post("/infer")
def infer():
    data = request.get_json()
    img = decode_base64(data["frame"])

    # -----------------------------------------------
    # 1) RUN DISTRACTION MODEL
    # -----------------------------------------------
    det_results = distraction_model(img, imgsz=640, conf=0.45)[0]

    names = det_results.names
    detections = [names[int(c)].lower() for c in det_results.boxes.cls]

    print("DETECTED:", detections)

    # Map: If class exists → YES else NO
    phone = "Yes" if "phone" in detections else "No"
    drinking = "Yes" if "drinking" in detections else "No"
    smoking = "Yes" if "smoking" in detections else "No"


    # -----------------------------------------------
    # 2) RUN DROWSINESS MODEL (if available)
    # -----------------------------------------------
    if drowsiness_model:
        drowsy_results = drowsiness_model(img, imgsz=640, conf=0.45)[0]
        drowsy_names = drowsy_results.names
        drowsy_dets = [drowsy_names[int(c)].lower() for c in drowsy_results.boxes.cls]

        # Example → customize (depends on your final model classes):
        # e.g., class names: ["awake", "eyes_closed", "yawning"]
        if "eyes_closed" in drowsy_dets or "yawning" in drowsy_dets:
            drowsiness = "High"
        else:
            drowsiness = "No"
    else:
        # Default safe value when drowsiness model not available yet
        drowsiness = "No"



    # ---------------------------------------------------
    # FINAL RESPONSE TO FRONTEND
    # ---------------------------------------------------
    response = {
        "drowsiness": drowsiness,
        "drinking": drinking,
        "phone": phone,
        "smoking": smoking,
    }

    return jsonify(response)



# ---------------------------------------------------
# RUN SERVER
# ---------------------------------------------------
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
