"""
AI-Based Predictive Thermal Management for Energy-Efficient Data Centers
Root System Launcher
"""
import os
import sys
import subprocess
import webbrowser
import time

def main():
    print("=" * 70)
    print("  AI-BASED PREDICTIVE THERMAL MANAGEMENT FOR DATA CENTERS")
    print("  Digital Twin Simulation Prototype (IoT + ML + Safety Controller)")
    print("=" * 70)

    # 1. Verify model artifact exists, train if missing
    model_path = os.path.join(os.path.dirname(__file__), "models", "rf_thermal_model.pkl")
    if not os.path.exists(model_path):
        print("\n[INFO] Initializing Machine Learning Model...")
        subprocess.run([sys.executable, os.path.join("backend", "ml", "train_model.py")], check=True)
    else:
        print("[INFO] Trained Random Forest thermal model found.")

    # 2. Check frontend build
    dist_path = os.path.join(os.path.dirname(__file__), "frontend", "dist", "index.html")
    if not os.path.exists(dist_path):
        print("\n[INFO] Building frontend production bundle...")
        subprocess.run(["npm", "run", "build"], cwd=os.path.join(os.path.dirname(__file__), "frontend"), shell=True, check=True)

    print("\n[INFO] Starting FastAPI server with WebSocket telemetry at http://127.0.0.1:8000...")
    print("[INFO] Press Ctrl+C to terminate the simulation.\n")

    # Open browser automatically after 1.5 seconds
    def open_browser():
        time.sleep(1.5)
        webbrowser.open("http://127.0.0.1:8000/")

    import threading
    threading.Thread(target=open_browser, daemon=True).start()

    # Launch Uvicorn
    import uvicorn
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=False)

if __name__ == "__main__":
    main()
