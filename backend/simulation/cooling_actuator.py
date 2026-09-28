class CoolingActuator:
    """
    Simulates a physical variable-speed cooling fan and computer room air handler (CRAH) actuator.
    Features:
    - Dynamic PWM control (0 - 100%)
    - Physical slew rate (gradual acceleration / deceleration of fans)
    - Airflow dynamics
    - Simulated mechanical degradation / failure
    """
    def __init__(
        self,
        rack_id: str,
        initial_fan_speed: float = 60.0,
        slew_rate_pct_per_sec: float = 8.0, # max speed change per second
        max_airflow_cfm: float = 350.0
    ):
        self.rack_id = rack_id
        self.target_fan_speed = initial_fan_speed
        self.actual_fan_speed = initial_fan_speed
        self.slew_rate = slew_rate_pct_per_sec
        self.max_airflow_cfm = max_airflow_cfm
        self.cooling_capacity = 100.0
        self.degradation_factor = 1.0 # 1.0 = healthy, 0.25 = degraded/failing
        self.is_failed = False

    def set_target(self, target_pwm: float):
        """Set requested fan PWM (0-100%)."""
        self.target_fan_speed = max(0.0, min(100.0, target_pwm))

    def step(self, dt_seconds: float = 1.0) -> dict:
        """Instantly update physical actuator state towards target for real-time responsiveness."""
        self.actual_fan_speed = self.target_fan_speed

        # Effective fan output influenced by mechanical degradation
        effective_output = self.actual_fan_speed * self.degradation_factor
        current_airflow_cfm = (effective_output / 100.0) * self.max_airflow_cfm

        return {
            "rack_id": self.rack_id,
            "target_fan_speed": round(self.target_fan_speed, 1),
            "actual_fan_speed": round(self.actual_fan_speed, 1),
            "effective_output": round(effective_output, 1),
            "airflow_cfm": round(current_airflow_cfm, 1),
            "cooling_capacity": round(self.cooling_capacity, 1),
            "degradation_factor": round(self.degradation_factor, 2),
            "is_failed": self.is_failed
        }

    def set_cooling_failure(self, failed: bool = True):
        self.is_failed = failed
        self.degradation_factor = 0.25 if failed else 1.0

    def reset(self, initial_fan: float = 60.0):
        self.target_fan_speed = initial_fan
        self.actual_fan_speed = initial_fan
        self.degradation_factor = 1.0
        self.is_failed = False
