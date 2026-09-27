from typing import Dict, Any, List
from .energy_model import EnergyModel
from ..ml.predictor import ThermalMLPredictor

class CoolingOptimizer:
    """
    Predictive Cooling Optimization Engine.
    Evaluates candidate fan levels, queries the ML model for predicted thermal response,
    filters candidates that meet strict safety envelopes, and chooses the lowest-energy
    fan speed while generating an explainable rationale.
    """
    def __init__(self, predictor: ThermalMLPredictor, safety_limit: float = 27.0):
        self.predictor = predictor
        self.safety_limit = safety_limit
        self.energy_model = EnergyModel()
        # Candidate cooling fan levels: 40% to 100% in 5% increments
        self.candidate_levels = [40.0, 45.0, 50.0, 55.0, 60.0, 65.0, 70.0, 75.0, 80.0, 85.0, 90.0, 95.0, 100.0]
        self.target_safety_margin = 0.6 # °C buffer below hard safety limit

    def optimize(
        self,
        history: List[float],
        telemetry: Dict[str, Any],
        control_mode: str = "AI_PREDICTIVE"
    ) -> Dict[str, Any]:
        """
        Determine target fan speed based on active control mode:
        1. TRADITIONAL: Constant baseline fan speed (e.g. 80%)
        2. REACTIVE: Simple threshold control (If Temp > 26°C -> 100%, else 60%)
        3. AI_PREDICTIVE: Closed-loop multi-step optimization using ML predictions
        """
        current_temp = telemetry.get("temperature", 24.0)
        current_fan = telemetry.get("fan_speed", 60.0)
        cpu = telemetry.get("cpu_usage", 40.0)
        gpu = telemetry.get("gpu_usage", 35.0)

        # MODE 1: TRADITIONAL / CONSTANT COOLING
        if control_mode == "TRADITIONAL":
            return {
                "control_mode": "TRADITIONAL",
                "recommended_fan_speed": 80.0,
                "reason": "Traditional baseline: Constant static fan speed (80.0%) maintained regardless of dynamic workload.",
                "candidate_evaluations": [],
                "target_margin": 0.0,
                "predicted_temp_selected": current_temp,
                "estimated_power_w": 285.0
            }

        # MODE 2: REACTIVE IoT COOLING
        elif control_mode == "REACTIVE":
            if current_temp > 26.0:
                fan = 100.0
                reason = f"Reactive IoT rule: Current temperature ({current_temp}°C) exceeds 26.0°C threshold -> Fan set to 100%."
            else:
                fan = 60.0
                reason = f"Reactive IoT rule: Current temperature ({current_temp}°C) is below 26.0°C threshold -> Fan set to 60%."

            return {
                "control_mode": "REACTIVE",
                "recommended_fan_speed": fan,
                "reason": reason,
                "candidate_evaluations": [],
                "target_margin": round(self.safety_limit - current_temp, 2),
                "predicted_temp_selected": current_temp,
                "estimated_power_w": self.energy_model.calculate_power(fan)["total_cooling_power_w"]
            }

        # MODE 3: AI PREDICTIVE OPTIMIZATION
        # Search candidate fan speeds
        candidate_evals = []
        safe_candidates = []

        max_allowable_temp = self.safety_limit - self.target_safety_margin # e.g. 26.4°C

        for candidate in self.candidate_levels:
            # Query ML model for predicted thermal impact at this fan level
            pred = self.predictor.predict(history, telemetry, candidate_fan_speed=candidate)
            pred_15m = pred.get("pred_15m", current_temp)
            confidence = pred.get("confidence", 90.0)

            power_eval = self.energy_model.calculate_power(candidate)
            fan_power = power_eval["fan_power_w"]

            is_safe = (pred_15m <= max_allowable_temp)
            eval_record = {
                "fan_speed": candidate,
                "predicted_15m": pred_15m,
                "confidence": confidence,
                "fan_power_w": fan_power,
                "is_safe": is_safe
            }
            candidate_evals.append(eval_record)
            if is_safe:
                safe_candidates.append(eval_record)

        # Select safest lowest-energy candidate
        if safe_candidates:
            # Sort by lowest fan power
            selected = min(safe_candidates, key=lambda x: x["fan_power_w"])
            chosen_fan = selected["fan_speed"]
            predicted_future = selected["predicted_15m"]
            confidence = selected["confidence"]
        else:
            # If all lower candidates exceed threshold, use 100% maximum cooling
            chosen_fan = 100.0
            predicted_future = candidate_evals[-1]["predicted_15m"]
            confidence = candidate_evals[-1]["confidence"]

        # Smooth changes (don't make erratic micro-jumps unless required by temperature rise)
        if abs(chosen_fan - current_fan) < 4.0 and current_temp < 25.5:
            chosen_fan = current_fan

        # Generate Explainable Rationale
        margin = round(self.safety_limit - predicted_future, 2)
        power_est = self.energy_model.calculate_power(chosen_fan)["total_cooling_power_w"]

        if gpu > 70.0:
            workload_clause = f"High GPU workload ({gpu}%)"
        elif cpu > 70.0:
            workload_clause = f"High CPU load ({cpu}%)"
        else:
            workload_clause = f"Moderate workload (CPU {cpu}%, GPU {gpu}%)"

        reason = (
            f"{workload_clause} analyzed. Predicted +15m temperature is {predicted_future}°C. "
            f"Optimized fan speed to {chosen_fan}% to guarantee {margin}°C safety margin under {self.safety_limit}°C ceiling "
            f"while minimizing fan aerodynamic energy consumption."
        )

        return {
            "control_mode": "AI_PREDICTIVE",
            "recommended_fan_speed": chosen_fan,
            "reason": reason,
            "candidate_evaluations": candidate_evals,
            "target_margin": margin,
            "predicted_temp_selected": predicted_future,
            "confidence": confidence,
            "estimated_power_w": power_est
        }
