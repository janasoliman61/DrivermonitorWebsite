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
drowsiness_model = YOLO("drowsiness_classifier.pt") if os.path.exists("drowsiness_classifier.pt") else None

# print("\nDistraction model loaded.")
# if drowsiness_model:
#     print("Drowsiness model loaded.")
# else:
#     print("Drowsiness model NOT found. Using default 'No' values.")



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
        # -----------------------------------------------
    # 2) RUN DROWSINESS MODEL (Classification)
    # -----------------------------------------------
    drowsiness = "No"  # Default value
    
    if drowsiness_model:
        try:
            # Run classification model
            drowsy_results = drowsiness_model(img, imgsz=640)[0]
            
            # Get probabilities from classification
            if hasattr(drowsy_results, 'probs') and drowsy_results.probs is not None:
                probs = drowsy_results.probs.data.cpu().numpy()
                names = drowsy_results.names
                
                # Print class names to debug
                print(f"CLASS NAMES: {names}")
                print(f"DROWSINESS PROBABILITIES:")
                
                # Find the drowsy probability
                drowsy_prob = None
                
                for idx, prob in enumerate(probs):
                    class_name = names[idx]
                    print(f"   [{idx}] {class_name}: {prob:.2%}")
                    
                    # Check if this is the "Drowsy" class (case-insensitive)
                    if "drowsy" in class_name.lower() and "non" not in class_name.lower():
                        drowsy_prob = prob
                
                # Determine drowsiness level based on probability
                if drowsy_prob is not None:
                    print(f"   Drowsy Probability: {drowsy_prob:.2%}")
                    
                    if drowsy_prob > 0.7:  # 70%+ drowsy
                        drowsiness = "High"
                    elif drowsy_prob > 0.5:  # 50-70% drowsy
                        drowsiness = "Medium"
                    elif drowsy_prob > 0.4:  # 40-50% drowsy
                        drowsiness = "Low"
                    else:  # < 40% drowsy
                        drowsiness = "No"
                    
                    print(f"   Final Drowsiness Level: {drowsiness}")
                else:
                    print("   Could not find 'Drowsy' class in model")
                    drowsiness = "No"
            else:
                print("DROWSINESS: No probs attribute found")
                drowsiness = "No"
                
        except Exception as e:
            print(f"Drowsiness model error: {str(e)}")
            import traceback
            traceback.print_exc()
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
