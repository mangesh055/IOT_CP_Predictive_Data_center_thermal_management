import pytest
from backend.simulation.thermal_model import ThermalModel
from backend.simulation.cooling_actuator import CoolingActuator
from backend.safety.safety_controller import SafetyController
from backend.optimization.cooling_optimizer import CoolingOptimizer
from backend.optimization.energy_model import EnergyModel
from backend.ml.predictor import ThermalMLPredictor
from backend.simulation.data_center import DataCenterSimulation

def test_thermal_model_dynamics():
    tm = ThermalModel("RACK_TEST", initial_temp=24.0)
    # High workload with low cooling should increase temperature
    result_heat = tm.step(cpu_util=90.0, gpu_util=95.0, fan_speed=40.0, dt_seconds=2.0)
    assert result_heat["power"] > 600.0
    assert result_heat["temperature"] >= 24.0

    # High cooling with low workload should decrease temperature
    for _ in range(10):
        result_cool = tm.step(cpu_util=10.0, gpu_util=10.0, fan_speed=100.0, dt_seconds=2.0)
    assert result_cool["temperature"] < result_heat["temperature"]

def test_sensor_redundancy_and_anomaly():
    sc = SafetyController(hard_temp_limit=27.0)
    
    # Consistent readings
    val, check = sc.validate_sensors(24.1, 24.3, 24.2)
    assert check["status"] == "PASS"
    assert not check["has_anomaly"]
    assert 24.1 <= val <= 24.3

    # Injected outlier sensor
    val_outlier, check_outlier = sc.validate_sensors(24.1, 38.5, 24.3)
    assert check_outlier["status"] == "SENSOR_FAULT"
    assert check_outlier["has_anomaly"]
    assert len(check_outlier["anomalies"]) == 1
    assert check_outlier["anomalies"][0]["sensor"] == "Sensor B"
    # Median is used for validated temperature
    assert abs(val_outlier - 24.2) < 0.2

def test_safety_hard_limit_override():
    sc = SafetyController(hard_temp_limit=27.0)
    # If temperature exceeds 27.0°C, safety controller must override AI to 100% cooling
    pred = {"pred_15m": 26.5, "confidence": 95.0}
    res = sc.evaluate(
        current_temp=27.4,
        rate_of_rise=0.05,
        prediction=pred,
        ai_recommended_fan=55.0
    )
    assert res["overridden"] is True
    assert res["sanctioned_fan_speed"] == 100.0
    assert "HARD TEMPERATURE LIMIT BREACHED" in res["reason"]
    assert res["safety_checks"]["hard_limit"] == "CRITICAL"

def test_safety_rate_of_rise_boost():
    sc = SafetyController(hard_temp_limit=27.0, rate_of_rise_threshold=0.25)
    pred = {"pred_15m": 25.5, "confidence": 90.0}
    # Rapid temperature jump
    res = sc.evaluate(
        current_temp=25.0,
        rate_of_rise=0.35, # greater than 0.25 threshold
        prediction=pred,
        ai_recommended_fan=60.0
    )
    assert res["overridden"] is True
    assert res["sanctioned_fan_speed"] >= 82.0
    assert res["safety_checks"]["rate_of_rise"] == "WARNING"

def test_safety_failsafe_mode():
    sc = SafetyController(failsafe_cooling_pct=80.0)
    pred = {"pred_15m": 24.5, "confidence": 95.0}
    res = sc.evaluate(
        current_temp=24.5,
        rate_of_rise=0.01,
        prediction=pred,
        ai_recommended_fan=50.0,
        system_failures={"network_failure": True, "mqtt_failure": True}
    )
    assert res["overridden"] is True
    assert res["sanctioned_fan_speed"] == 80.0
    assert res["safety_checks"]["fail_safe"] == "ACTIVE"
    assert res["safety_checks"]["network"] == "FAIL"

def test_ml_prediction_and_failure():
    predictor = ThermalMLPredictor()
    telemetry = {
        "temperature": 24.5, "humidity": 48.0, "cpu_usage": 45.0,
        "gpu_usage": 40.0, "power": 320.0, "fan_speed": 60.0,
        "airflow": 100.0, "ambient_temp": 22.0, "rate_of_rise": 0.02
    }
    history = [24.0, 24.1, 24.2, 24.3, 24.4, 24.5]
    pred = predictor.predict(history, telemetry)
    assert "pred_5m" in pred
    assert "pred_10m" in pred
    assert "pred_15m" in pred
    assert pred["confidence"] >= 60.0

    # Test ML failure injection
    pred_fault = predictor.predict(history, telemetry, inject_ml_failure=True)
    assert pred_fault["model_status"] == "FAULT_INJECTED"
    assert pred_fault["confidence"] < 50.0

def test_cooling_optimizer():
    predictor = ThermalMLPredictor()
    optimizer = CoolingOptimizer(predictor, safety_limit=27.0)
    history = [24.0] * 10
    telemetry = {
        "temperature": 24.2, "fan_speed": 60.0, "cpu_usage": 35.0,
        "gpu_usage": 30.0, "power": 250.0, "rate_of_rise": 0.0
    }
    # Test Traditional mode
    trad = optimizer.optimize(history, telemetry, control_mode="TRADITIONAL")
    assert trad["recommended_fan_speed"] == 80.0

    # Test Reactive mode
    react = optimizer.optimize(history, telemetry, control_mode="REACTIVE")
    assert react["recommended_fan_speed"] == 60.0 # temp < 26.0

    # Test AI Predictive mode
    ai_opt = optimizer.optimize(history, telemetry, control_mode="AI_PREDICTIVE")
    assert 40.0 <= ai_opt["recommended_fan_speed"] <= 100.0
    assert len(ai_opt["reason"]) > 10

def test_full_datacenter_simulation_step():
    dc = DataCenterSimulation()
    state = dc.step(dt_real=1.0)
    assert len(state["racks"]) == 4
    assert state["status"] == "ONLINE" if "status" in state else True
    assert state["avg_temp"] > 0
    assert state["total_cooling_power_w"] > 0

    # Test experiment comparison execution
    exp_res = dc.run_experiment_comparison(duration_sec=3.0, scenario="HIGH_LOAD")
    assert "results" in exp_res
    assert "TRADITIONAL" in exp_res["results"]
    assert "REACTIVE" in exp_res["results"]
    assert "AI_PREDICTIVE" in exp_res["results"]
    # AI Predictive cooling should have lower energy than Traditional 80% constant
    trad_e = exp_res["results"]["TRADITIONAL"]["energy_kwh"]
    ai_e = exp_res["results"]["AI_PREDICTIVE"]["energy_kwh"]
    assert ai_e < trad_e
    assert exp_res["results"]["AI_PREDICTIVE"]["energy_savings_pct"] > 0.0
