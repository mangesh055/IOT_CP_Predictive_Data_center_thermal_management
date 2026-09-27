import asyncio
import os
import io
import json
import time
from typing import Optional
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd

from .simulation.data_center import DataCenterSimulation
from .ml.train_model import train as train_ml_model
from .database import db

app = FastAPI(
    title="AI-Based Predictive Thermal Management API",
    description="Data Center Digital Twin with IoT, ML Predictive Thermal Management & Multi-Tier Safety Controller",
    version="2.0.0"
)

# Enable CORS for frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Simulation Engine Singleton
dc_sim = DataCenterSimulation()

# WebSocket client manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in list(self.active_connections):
            try:
                await connection.send_json(message)
            except Exception:
                self.disconnect(connection)

manager = ConnectionManager()

# Background simulation ticker task
simulation_task: Optional[asyncio.Task] = None

async def simulation_loop():
    """Continuous simulation loop running at 10Hz (every 100ms) with state broadcast."""
    while True:
        try:
            # Advance simulation step by 0.2 real seconds
            state = dc_sim.step(dt_real=0.2)
            await manager.broadcast(state)
        except Exception as e:
            print(f"[SIM LOOP ERROR] {e}")
        await asyncio.sleep(0.2)

@app.on_event("startup")
async def startup_event():
    global simulation_task
    # Initial step to populate state
    dc_sim.step(dt_real=0.1)
    simulation_task = asyncio.create_task(simulation_loop())
    print("[SERVER] Simulation background ticker started.")

@app.on_event("shutdown")
async def shutdown_event():
    global simulation_task
    if simulation_task:
        simulation_task.cancel()

# --- Request / Response Pydantic Models ---
class ScenarioRequest(BaseModel):
    scenario: str
    custom_cpu: Optional[float] = None
    custom_gpu: Optional[float] = None

class ControlModeRequest(BaseModel):
    mode: str

class SpeedRequest(BaseModel):
    speed: float

class ExperimentRequest(BaseModel):
    scenario: str = "HIGH_LOAD"
    duration_sec: float = 30.0

# --- REST Endpoints ---

@app.get("/api/status")
def get_status():
    return {
        "status": "ONLINE",
        "is_running": dc_sim.is_running,
        "control_mode": dc_sim.control_mode,
        "scenario": dc_sim.current_scenario,
        "speed_multiplier": dc_sim.speed_multiplier,
        "sim_time": dc_sim.sim_time,
        "timestamp": time.strftime("%H:%M:%S")
    }

@app.get("/api/sensors")
def get_sensors():
    state = dc_sim.latest_state
    return {
        "racks": [
            {
                "rack_id": r["rack_id"],
                "temperature": r["temperature"],
                "humidity": r["humidity"],
                "cpu_usage": r["cpu_usage"],
                "gpu_usage": r["gpu_usage"],
                "power_watts": r["power_watts"],
                "fan_speed": r["fan_speed"],
                "airflow_cfm": r["airflow_cfm"],
                "status": r["status"]
            }
            for r in state.get("racks", [])
        ]
    }

@app.get("/api/racks")
def get_racks():
    return {
        "racks": dc_sim.latest_state.get("racks", [])
    }

@app.get("/api/prediction")
def get_prediction():
    state = dc_sim.latest_state
    primary = state.get("primary_decision", {})
    return {
        "prediction": primary.get("prediction", {}),
        "feature_importances": dc_sim.predictor.feature_importances,
        "metrics": dc_sim.predictor.model_metrics,
        "model_loaded": dc_sim.predictor.model is not None
    }

@app.get("/api/cooling")
def get_cooling():
    state = dc_sim.latest_state
    primary = state.get("primary_decision", {})
    return {
        "current_fan": primary.get("current_fan", 60.0),
        "recommended_fan": primary.get("recommended_fan", 60.0),
        "sanctioned_fan": primary.get("sanctioned_fan", 60.0),
        "overridden": primary.get("overridden", False),
        "safety_limit": dc_sim.safety_controller.hard_temp_limit,
        "reason": primary.get("reason", "Normal operation")
    }

@app.get("/api/energy")
def get_energy():
    state = dc_sim.latest_state
    return {
        "total_cooling_power_w": state.get("total_cooling_power_w", 0.0),
        "total_cooling_energy_kwh": state.get("total_cooling_energy_kwh", 0.0),
        "energy_savings_pct": state.get("energy_savings_pct", 0.0),
        "control_mode": dc_sim.control_mode,
        "cumulative_tracking": dc_sim.cumulative_energy_kwh
    }

@app.get("/api/safety")
def get_safety():
    state = dc_sim.latest_state
    return {
        "safety_status": state.get("safety_status", {}),
        "hard_limit_c": dc_sim.safety_controller.hard_temp_limit,
        "rate_of_rise_threshold": dc_sim.safety_controller.rate_of_rise_threshold,
        "conservative_confidence": dc_sim.safety_controller.conservative_confidence_threshold,
        "min_confidence": dc_sim.safety_controller.min_confidence_threshold,
        "failsafe_cooling_pct": dc_sim.safety_controller.failsafe_cooling_pct
    }

@app.get("/api/events")
def get_events(limit: int = 50):
    return {
        "events": dc_sim.event_log[:limit]
    }

@app.get("/api/analytics")
def get_analytics():
    return {
        "experiments": db.get_experiments(),
        "recent_events": db.get_recent_events(limit=40),
        "cumulative_energy": dc_sim.cumulative_energy_kwh,
        "safety_violations": dc_sim.safety_violation_counts
    }

# --- Control Endpoints ---

@app.post("/api/simulation/start")
def start_simulation():
    dc_sim.is_running = True
    dc_sim._add_event("SYSTEM", "INFO", "Simulation resumed.", "Running")
    return {"status": "RUNNING"}

@app.post("/api/simulation/pause")
def pause_simulation():
    dc_sim.is_running = False
    dc_sim._add_event("SYSTEM", "INFO", "Simulation paused by operator.", "Paused")
    return {"status": "PAUSED"}

@app.post("/api/simulation/reset")
def reset_simulation():
    dc_sim.reset()
    return {"status": "RESET_COMPLETE"}

@app.post("/api/simulation/speed")
def set_simulation_speed(req: SpeedRequest):
    dc_sim.set_speed(req.speed)
    return {"speed_multiplier": dc_sim.speed_multiplier}

@app.post("/api/scenario")
def set_scenario(req: ScenarioRequest):
    dc_sim.set_scenario(req.scenario, req.custom_cpu, req.custom_gpu)
    return {"scenario": dc_sim.current_scenario}

@app.post("/api/control-mode")
def set_control_mode(req: ControlModeRequest):
    dc_sim.set_control_mode(req.mode)
    return {"control_mode": dc_sim.control_mode}

@app.post("/api/presentation/start")
def start_presentation():
    dc_sim.start_presentation_mode()
    return {"status": "PRESENTATION_STARTED"}

@app.post("/api/experiments/run")
def run_experiment(req: ExperimentRequest):
    res = dc_sim.run_experiment_comparison(
        duration_sec=req.duration_sec,
        scenario=req.scenario
    )
    return res

@app.get("/api/experiments")
def get_all_experiments():
    return {
        "experiments": db.get_experiments()
    }

@app.post("/api/dataset/upload")
async def upload_dataset(file: UploadFile = File(...)):
    """Upload custom CSV/Parquet dataset and train the ML predictor."""
    try:
        contents = await file.read()
        filename = file.filename
        data_dir = os.path.join(os.path.dirname(__file__), "..", "data")
        os.makedirs(data_dir, exist_ok=True)
        dest_path = os.path.join(data_dir, f"uploaded_{filename}")

        with open(dest_path, "wb") as f:
            f.write(contents)

        # Trigger model retraining with the uploaded dataset
        metrics = train_ml_model(dest_path)
        # Reload the trained model into predictor
        dc_sim.predictor.load_model()

        dc_sim._add_event("ML_PIPELINE", "INFO", f"Trained new model from uploaded dataset: {filename} (R²: {metrics['r2']})", "Model updated")
        return {
            "status": "SUCCESS",
            "filename": filename,
            "metrics": metrics
        }
    except Exception as e:
        return {"status": "ERROR", "message": str(e)}

# --- WebSocket Live Streaming ---

@app.websocket("/ws/telemetry")
async def websocket_telemetry(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        # Send current state immediately on connect
        await websocket.send_json(dc_sim.latest_state)
        while True:
            # Keep connection open and receive any client ping
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception:
        manager.disconnect(websocket)

# Mount Frontend Build static assets if available
from fastapi.staticfiles import StaticFiles
frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "dist"))
if os.path.exists(frontend_dist):
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="frontend")

