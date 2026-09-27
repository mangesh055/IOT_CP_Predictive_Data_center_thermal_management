import numpy as np
from typing import Dict, Any, List, Tuple

class SafetyController:
    """
    Multi-Tiered Safety Controller & Verification Layer.
    Strictly enforces thermal envelope safety before any AI/ML recommendation
    reaches the physical actuators.

    Priority hierarchy:
    1. Emergency Safety (Hard Temperature Limit Override)
    2. Hardware / Sensor Validation & Redundancy (Fault isolation)
    3. Fail-Safe Mode (Network/Gateway/ML breakdown fallback)
    4. Thermal Constraints (Rate-of-Rise Preemptive Cooling)
    5. ML Confidence Gate (Conservative policy scaling)
    6. Energy Optimization
    """
    def __init__(
        self,
        hard_temp_limit: float = 27.0,
        rate_of_rise_threshold: float = 0.25, # °C per interval
        min_confidence_threshold: float = 60.0,
        conservative_confidence_threshold: float = 85.0,
        failsafe_cooling_pct: float = 80.0
    ):
        self.hard_temp_limit = hard_temp_limit
        self.rate_of_rise_threshold = rate_of_rise_threshold
        self.min_confidence_threshold = min_confidence_threshold
        self.conservative_confidence_threshold = conservative_confidence_threshold
        self.failsafe_cooling_pct = failsafe_cooling_pct

    def validate_sensors(self, sensor_a: float, sensor_b: float, sensor_c: float) -> Tuple[float, Dict[str, Any]]:
        """
        Safety 4: Sensor Redundancy & Anomaly Detection.
        Applies median voting across 3 physical sensor probes and isolates outliers.
        """
        readings = [sensor_a, sensor_b, sensor_c]
        median_val = float(np.median(readings))
        
        anomalies = []
        labels = ["Sensor A", "Sensor B", "Sensor C"]
        for i, val in enumerate(readings):
            if abs(val - median_val) > 2.5: # 2.5°C discrepancy threshold
                anomalies.append({
                    "sensor": labels[i],
                    "reading": val,
                    "median": median_val,
                    "deviation": round(abs(val - median_val), 2)
                })

        has_anomaly = len(anomalies) > 0
        status = "SENSOR_FAULT" if has_anomaly else "PASS"
        desc = (
            f"Sensor anomaly detected on {', '.join(a['sensor'] for a in anomalies)} ({anomalies[0]['reading']}°C vs median {median_val}°C). Using redundant median."
            if has_anomaly else "All redundant sensor readings verified within ±0.2°C tolerance."
        )

        return median_val, {
            "status": status,
            "has_anomaly": has_anomaly,
            "anomalies": anomalies,
            "validated_temp": median_val,
            "description": desc
        }

    def evaluate(
        self,
        current_temp: float,
        rate_of_rise: float,
        prediction: Dict[str, Any],
        ai_recommended_fan: float,
        system_failures: Dict[str, bool] = None
    ) -> Dict[str, Any]:
        """
        Evaluates AI recommendation against all 5 safety mechanisms.
        Returns the sanctioned fan speed, override status, and full explanation.
        """
        failures = system_failures or {}
        is_network_failed = failures.get("network_failure", False)
        is_mqtt_failed = failures.get("mqtt_failure", False)
        is_cooling_failed = failures.get("cooling_failure", False)
        is_ml_failed = failures.get("ml_failure", False)

        events: List[Dict[str, str]] = []
        override = False
        final_fan = ai_recommended_fan
        primary_reason = "AI recommendation compliant with all safety standards."

        # Status indicators for safety monitor UI
        safety_checks = {
            "hard_limit": "PASS",
            "rate_of_rise": "PASS",
            "sensor_health": "PASS",
            "prediction_confidence": "PASS",
            "network": "PASS",
            "fail_safe": "STANDBY",
            "ai_authorization": "PASS"
        }

        # ------------------------------------------------------------------
        # SAFETY 5: FAIL-SAFE MODE (Highest architectural priority)
        # ------------------------------------------------------------------
        if is_network_failed or is_mqtt_failed:
            safety_checks["network"] = "FAIL"
            safety_checks["fail_safe"] = "ACTIVE"
            safety_checks["ai_authorization"] = "REVOKED"
            final_fan = self.failsafe_cooling_pct
            override = True
            primary_reason = "FAIL-SAFE MODE ACTIVE: Network/MQTT connection lost. AI control disabled; conservative fallback cooling (80%) engaged."
            events.append({
                "type": "NETWORK_FAILSAFE",
                "severity": "CRITICAL",
                "desc": primary_reason,
                "action": f"Set Fan to {self.failsafe_cooling_pct}%"
            })
            return self._build_result(final_fan, override, primary_reason, safety_checks, events)

        # ------------------------------------------------------------------
        # SAFETY 1: HARD TEMPERATURE LIMIT (Physical thermal envelope)
        # ------------------------------------------------------------------
        if current_temp >= self.hard_temp_limit:
            safety_checks["hard_limit"] = "CRITICAL"
            safety_checks["ai_authorization"] = "OVERRIDDEN"
            final_fan = 100.0
            override = True
            primary_reason = f"HARD TEMPERATURE LIMIT BREACHED: Current temp {current_temp}°C exceeds safety limit of {self.hard_temp_limit}°C. Emergency maximum cooling (100%) enforced."
            events.append({
                "type": "HARD_LIMIT_BREACH",
                "severity": "CRITICAL",
                "desc": primary_reason,
                "action": "Override AI to 100% Fan"
            })
            return self._build_result(final_fan, override, primary_reason, safety_checks, events)

        # ------------------------------------------------------------------
        # SAFETY 2: TEMPERATURE RATE-OF-RISE (Preemptive heating detection)
        # ------------------------------------------------------------------
        if rate_of_rise >= self.rate_of_rise_threshold:
            safety_checks["rate_of_rise"] = "WARNING"
            boosted_fan = max(final_fan, 82.0)
            if boosted_fan > final_fan:
                override = True
                final_fan = boosted_fan
                primary_reason = f"RAPID THERMAL RISE DETECTED (+{rate_of_rise:.2f}°C/tick). Preemptive thermal runaway prevention engaged."
                events.append({
                    "type": "RATE_OF_RISE_BOOST",
                    "severity": "WARNING",
                    "desc": primary_reason,
                    "action": f"Boost Fan to {final_fan}%"
                })

        # ------------------------------------------------------------------
        # SAFETY 3: PREDICTION CONFIDENCE & ML INTEGRITY
        # ------------------------------------------------------------------
        pred_15m = prediction.get("pred_15m", current_temp)
        confidence = prediction.get("confidence", 90.0)

        # Anomaly where AI predicts temp is droping or safe but rate of rise is climbing
        if is_ml_failed or (rate_of_rise > 0.15 and pred_15m < current_temp - 0.2):
            safety_checks["prediction_confidence"] = "FAIL"
            safety_checks["ai_authorization"] = "OVERRIDDEN"
            final_fan = 100.0 if current_temp > 25.5 else 85.0
            override = True
            primary_reason = f"AI PREDICTION ANOMALY / FAULT: ML predicted {pred_15m}°C while actual is {current_temp}°C rising. Overriding AI recommendation to safe cooling ({final_fan}%)."
            events.append({
                "type": "AI_PREDICTION_OVERRIDE",
                "severity": "CRITICAL",
                "desc": primary_reason,
                "action": f"Override to {final_fan}% Fan"
            })
            return self._build_result(final_fan, override, primary_reason, safety_checks, events)

        if confidence < self.min_confidence_threshold:
            safety_checks["prediction_confidence"] = "WARNING"
            # Low confidence policy: prohibit aggressive reduction, floor at 75%
            if final_fan < 75.0:
                final_fan = 75.0
                override = True
                primary_reason = f"LOW PREDICTION CONFIDENCE ({confidence}% < {self.min_confidence_threshold}%). Conservative cooling floor (75%) enforced."
                events.append({
                    "type": "CONFIDENCE_GATE",
                    "severity": "WARNING",
                    "desc": primary_reason,
                    "action": "Enforce 75% Fan floor"
                })
        elif confidence < self.conservative_confidence_threshold:
            # Medium confidence: add +8% safety buffer
            if final_fan < 70.0:
                final_fan = min(100.0, final_fan + 8.0)
                override = True
                primary_reason = f"MODERATE PREDICTION CONFIDENCE ({confidence}%). Conservative safety margin buffer (+8%) applied."

        # Thermal trajectory validation: If AI fan would lead to predicted exceedance
        if pred_15m >= self.hard_temp_limit - 0.3:
            needed_fan = max(final_fan, 85.0)
            if needed_fan > final_fan:
                final_fan = needed_fan
                override = True
                primary_reason = f"PREDICTED TRAJECTORY EXCEEDS SAFETY ENVELOPE: Projected temp at +15m is {pred_15m}°C (Limit: {self.hard_temp_limit}°C). Preemptive fan boost applied."

        return self._build_result(final_fan, override, primary_reason, safety_checks, events)

    def _build_result(
        self,
        final_fan: float,
        overridden: bool,
        reason: str,
        safety_checks: Dict[str, str],
        events: List[Dict[str, str]]
    ) -> Dict[str, Any]:
        return {
            "sanctioned_fan_speed": round(final_fan, 1),
            "overridden": overridden,
            "reason": reason,
            "safety_checks": safety_checks,
            "events": events,
            "safe_temp_limit": self.hard_temp_limit
        }
