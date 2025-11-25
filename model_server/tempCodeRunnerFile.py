from ultralytics import YOLO

model = YOLO("2nd-driver-behavior-best.pt")
print(model.names)
