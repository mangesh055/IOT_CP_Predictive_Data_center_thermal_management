import sqlite3
import os
import json
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), "datacenter_sim.db")

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # 1. Sensor Telemetry Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS sensor_data (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT NOT NULL,
        sim_time REAL NOT NULL,
        rack_id TEXT NOT NULL,
        temperature REAL NOT NULL,
        sensor_a REAL,
        sensor_b REAL,
        sensor_c REAL,
        humidity REAL NOT NULL,
        cpu_usage REAL NOT NULL,
        gpu_usage REAL NOT NULL,
        power REAL NOT NULL,
        fan_speed REAL NOT NULL,
        airflow REAL NOT NULL,
        cooling_capacity REAL NOT NULL,
        ambient_temperature REAL NOT NULL
    )
    """)

    # 2. Predictions Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS predictions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT NOT NULL,
        rack_id TEXT NOT NULL,
        current_temp REAL NOT NULL,
        pred_5m REAL NOT NULL,
        pred_10m REAL NOT NULL,
        pred_15m REAL NOT NULL,
        confidence REAL NOT NULL,
        safety_margin REAL NOT NULL
    )
    """)

    # 3. Safety Events Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS safety_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT NOT NULL,
        sim_time REAL NOT NULL,
        rack_id TEXT NOT NULL,
        event_type TEXT NOT NULL,
        severity TEXT NOT NULL,
        description TEXT NOT NULL,
        action_taken TEXT NOT NULL
    )
    """)

    # 4. Control Actions Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS control_actions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT NOT NULL,
        rack_id TEXT NOT NULL,
        control_mode TEXT NOT NULL,
        requested_fan REAL NOT NULL,
        actual_fan REAL NOT NULL,
        overridden INTEGER NOT NULL,
        reason TEXT NOT NULL
    )
    """)

    # 5. Simulation Runs / Experiments Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS simulation_runs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        experiment_id TEXT NOT NULL,
        control_mode TEXT NOT NULL,
        scenario TEXT NOT NULL,
        start_time TEXT NOT NULL,
        end_time TEXT,
        duration_sec REAL,
        energy_kwh REAL NOT NULL,
        avg_temp REAL NOT NULL,
        max_temp REAL NOT NULL,
        safety_violations INTEGER NOT NULL,
        avg_fan_speed REAL NOT NULL,
        energy_savings_pct REAL DEFAULT 0.0
    )
    """)

    conn.commit()
    conn.close()

def log_telemetry_batch(records):
    if not records:
        return
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.executemany("""
    INSERT INTO sensor_data (
        timestamp, sim_time, rack_id, temperature, sensor_a, sensor_b, sensor_c,
        humidity, cpu_usage, gpu_usage, power, fan_speed, airflow,
        cooling_capacity, ambient_temperature
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, records)
    conn.commit()
    conn.close()

def log_prediction(timestamp, rack_id, current_temp, pred_5m, pred_10m, pred_15m, confidence, safety_margin):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO predictions (timestamp, rack_id, current_temp, pred_5m, pred_10m, pred_15m, confidence, safety_margin)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (timestamp, rack_id, current_temp, pred_5m, pred_10m, pred_15m, confidence, safety_margin))
    conn.commit()
    conn.close()

def log_safety_event(timestamp, sim_time, rack_id, event_type, severity, description, action_taken):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO safety_events (timestamp, sim_time, rack_id, event_type, severity, description, action_taken)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (timestamp, sim_time, rack_id, event_type, severity, description, action_taken))
    conn.commit()
    conn.close()

def log_control_action(timestamp, rack_id, control_mode, requested_fan, actual_fan, overridden, reason):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO control_actions (timestamp, rack_id, control_mode, requested_fan, actual_fan, overridden, reason)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (timestamp, rack_id, control_mode, requested_fan, actual_fan, 1 if overridden else 0, reason))
    conn.commit()
    conn.close()

def save_experiment_run(run_data):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO simulation_runs (
        experiment_id, control_mode, scenario, start_time, end_time, duration_sec,
        energy_kwh, avg_temp, max_temp, safety_violations, avg_fan_speed, energy_savings_pct
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        run_data["experiment_id"],
        run_data["control_mode"],
        run_data["scenario"],
        run_data["start_time"],
        run_data["end_time"],
        run_data["duration_sec"],
        run_data["energy_kwh"],
        run_data["avg_temp"],
        run_data["max_temp"],
        run_data["safety_violations"],
        run_data["avg_fan_speed"],
        run_data.get("energy_savings_pct", 0.0)
    ))
    conn.commit()
    conn.close()

def get_recent_events(limit=50):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM safety_events ORDER BY id DESC LIMIT ?", (limit,))
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return rows

def get_experiments():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM simulation_runs ORDER BY id DESC")
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return rows
