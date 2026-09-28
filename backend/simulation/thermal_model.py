import math
import random
from typing import Dict, Any, List

class ThermalModel:
    """
    Physically sensible simulated thermal model for data center server racks.
    Models workload-dependent heat generation, dynamic airflow cooling, ambient exchange,
    and redundant sensor telemetry with physical thermal inertia.
    """
    def __init__(
        self,
        rack_id: str,
        initial_temp: float = 24.0,
        initial_humidity: float = 48.0,
        ambient_temp: float = 22.0,
        thermal_capacitance: float = 150.0, # J/K thermal mass (optimized for realistic real-time response)
        base_power: float = 160.0,          # Watts
        cpu_power_factor: float = 2.4,       # W per % CPU
        gpu_power_factor: float = 3.6,       # W per % GPU
        max_cooling_watts: float = 1100.0,   # Watts at 100% fan
        inlet_temp: float = 18.5             # Supply air temp °C
    ):
        self.rack_id = rack_id
        self.initial_temp = initial_temp
        self.temperature = initial_temp
        self.humidity = initial_humidity
        self.ambient_temp = ambient_temp
        self.thermal_capacitance = thermal_capacitance
        self.base_power = base_power
        self.cpu_power_factor = cpu_power_factor
        self.gpu_power_factor = gpu_power_factor
        self.max_cooling_watts = max_cooling_watts
        self.inlet_temp = inlet_temp

        # Temperature history for rate-of-rise calculation
        self.history: List[float] = [initial_temp] * 10
        self.current_power = base_power
        self.cooling_effect_watts = 0.0

        # Redundant sensors
        self.sensor_a = initial_temp
        self.sensor_b = initial_temp
        self.sensor_c = initial_temp
        self.sensor_b_fault = False

    def reset(self):
        self.temperature = self.initial_temp
        self.humidity = 48.0
        self.history = [self.initial_temp] * 10
        self.sensor_a = self.initial_temp
        self.sensor_b = self.initial_temp
        self.sensor_c = self.initial_temp
        self.sensor_b_fault = False

    def step(
        self,
        cpu_util: float,
        gpu_util: float,
        fan_speed: float,
        cooling_capacity_pct: float = 100.0,
        airflow_pct: float = 100.0,
        dt_seconds: float = 1.0,
        cooling_degradation: float = 1.0, # 1.0 = normal, 0.25 = degraded
        inject_sensor_fault: bool = False,
        ambient_temp_override: float = None,
        inlet_temp_override: float = None,
        responsiveness_factor: float = 1.0
    ) -> Dict[str, Any]:
        """
        Advance thermal dynamics by dt_seconds.
        """
        if ambient_temp_override is not None:
            self.ambient_temp = ambient_temp_override
        if inlet_temp_override is not None:
            self.inlet_temp = inlet_temp_override

        # Clamp inputs
        cpu = max(0.0, min(100.0, cpu_util))
        gpu = max(0.0, min(100.0, gpu_util))
        fan = max(0.0, min(100.0, fan_speed))
        cap = max(0.0, min(100.0, cooling_capacity_pct)) / 100.0
        air = max(0.0, min(100.0, airflow_pct)) / 100.0

        # 1. Power Consumption (Watts) - immediate calculation
        power = self.base_power + (cpu * self.cpu_power_factor) + (gpu * self.gpu_power_factor)
        self.current_power = power

        # 2. Cooling Effect (Watts removed)
        effective_fan = (fan / 100.0) * cooling_degradation * cap * air
        cooling_watts = effective_fan * self.max_cooling_watts
        self.cooling_effect_watts = cooling_watts

        # 3. Direct Real-Time Thermal Calculation (Instant Response, No Physics Lag)
        workload_ratio = (cpu * 0.45 + gpu * 0.55) / 100.0
        heat_rise = 3.6 + (workload_ratio * 9.8) # 3.6°C idle up to 13.4°C max heat rise
        cooling_drop = effective_fan * 6.5       # cooling drops temperature
        ambient_offset = (self.ambient_temp - 22.0) * 0.35

        target_temp = self.inlet_temp + heat_rise - cooling_drop + ambient_offset

        # Smooth responsive tracking: fast convergence without unphysical single-tick step shocks
        noise = random.gauss(0.0, 0.02)
        self.temperature = round(0.82 * self.temperature + 0.18 * target_temp + noise, 2)
        self.temperature = max(16.0, min(55.0, self.temperature))

        # 4. Outlet temperature estimation
        airflow_cfm = max(15.0, fan * 2.2 * air)
        outlet_temp = round(self.temperature + (power / (airflow_cfm * 1.08)) * 0.45, 2)

        # 5. Humidity update
        rh_target = 48.0 - (self.temperature - 24.0) * 0.4
        self.humidity = round(self.humidity + (rh_target - self.humidity) * 0.1 + random.gauss(0.0, 0.08), 2)
        self.humidity = max(25.0, min(75.0, self.humidity))

        # 6. Redundant Sensors
        noise_a = random.gauss(0.0, 0.08)
        noise_b = random.gauss(0.0, 0.08)
        noise_c = random.gauss(0.0, 0.08)

        self.sensor_a = round(self.temperature + noise_a + 0.05, 2)
        self.sensor_c = round(self.temperature + noise_c - 0.05, 2)

        self.sensor_b_fault = inject_sensor_fault
        if inject_sensor_fault:
            self.sensor_b = round(38.5 + random.gauss(0.0, 0.25), 2)
        else:
            self.sensor_b = round(self.temperature + noise_b, 2)

        # 7. Update history & smooth rate of rise for alerts
        prev_temp = self.history[-1] if self.history else self.temperature
        self.history.append(self.temperature)
        if len(self.history) > 30:
            self.history.pop(0)

        # Smooth rate of rise over 3-interval window
        if len(self.history) >= 4:
            rate_of_rise = round((self.history[-1] - self.history[-4]) / 3.0, 3)
        else:
            rate_of_rise = round(self.temperature - prev_temp, 3)

        return {
            "rack_id": self.rack_id,
            "temperature": self.temperature,
            "inlet_temp": self.inlet_temp,
            "outlet_temp": outlet_temp,
            "ambient_temp": self.ambient_temp,
            "humidity": self.humidity,
            "power": round(power, 1),
            "cooling_watts": round(cooling_watts, 1),
            "rate_of_rise": rate_of_rise,
            "cpu_usage": cpu,
            "gpu_usage": gpu,
            "sensor_a": self.sensor_a,
            "sensor_b": self.sensor_b,
            "sensor_c": self.sensor_c,
            "sensor_b_fault": self.sensor_b_fault
        }
