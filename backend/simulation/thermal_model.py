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
        thermal_capacitance: float = 420.0, # J/K thermal mass
        base_power: float = 160.0,          # Watts
        cpu_power_factor: float = 2.4,       # W per % CPU
        gpu_power_factor: float = 3.6,       # W per % GPU
        max_cooling_watts: float = 1100.0,   # Watts at 100% fan
        inlet_temp: float = 18.5             # Supply air temp °C
    ):
        self.rack_id = rack_id
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

    def step(
        self,
        cpu_util: float,
        gpu_util: float,
        fan_speed: float,
        cooling_capacity_pct: float = 100.0,
        airflow_pct: float = 100.0,
        dt_seconds: float = 1.0,
        cooling_degradation: float = 1.0, # 1.0 = normal, 0.25 = degraded
        inject_sensor_fault: bool = False
    ) -> Dict[str, Any]:
        """
        Advance thermal dynamics by dt_seconds.
        """
        # Clamp inputs
        cpu = max(0.0, min(100.0, cpu_util))
        gpu = max(0.0, min(100.0, gpu_util))
        fan = max(0.0, min(100.0, fan_speed))
        cap = max(0.0, min(100.0, cooling_capacity_pct)) / 100.0
        air = max(0.0, min(100.0, airflow_pct)) / 100.0

        # 1. Power Consumption (Watts)
        power = self.base_power + (cpu * self.cpu_power_factor) + (gpu * self.gpu_power_factor)
        self.current_power = power

        # 2. Heat Generated (Joules)
        q_gen = power * dt_seconds

        # 3. Cooling Effect (Joules removed)
        # Cooling capacity scales with fan speed, airflow factor, cooling health, and delta T
        effective_fan = (fan / 100.0) * cooling_degradation
        delta_t_cooling = max(0.5, self.temperature - self.inlet_temp)
        # Thermal heat extraction equation
        cooling_watts = (
            effective_fan
            * cap
            * air
            * self.max_cooling_watts
            * (delta_t_cooling / 8.0)
        )
        self.cooling_effect_watts = cooling_watts
        q_cool = cooling_watts * dt_seconds

        # 4. Ambient Heat Exchange
        k_ambient = 12.0 # W/K passive dissipation through rack chassis
        q_ambient = k_ambient * (self.ambient_temp - self.temperature) * dt_seconds

        # 5. Temperature update with physical thermal inertia
        delta_temp = (q_gen - q_cool + q_ambient) / self.thermal_capacitance
        
        # Sensor noise
        noise = random.gauss(0.0, 0.03)

        # Update temperature
        self.temperature = round(self.temperature + delta_temp + noise, 2)
        # Physical lower bound is inlet air, upper bound emergency safety limit
        self.temperature = max(18.0, min(55.0, self.temperature))

        # 6. Outlet temperature estimation
        # delta T across server exhaust decreases with higher airflow
        airflow_cfm = max(15.0, fan * 2.2 * air)
        outlet_temp = round(self.temperature + (power / (airflow_cfm * 1.08)) * 0.45, 2)

        # 7. Humidity update (slow variation with temperature inversely coupled)
        rh_target = 48.0 - (self.temperature - 24.0) * 0.4
        self.humidity = round(self.humidity + (rh_target - self.humidity) * 0.05 + random.gauss(0.0, 0.08), 2)
        self.humidity = max(30.0, min(70.0, self.humidity))

        # 8. Redundant Sensors
        noise_a = random.gauss(0.0, 0.08)
        noise_b = random.gauss(0.0, 0.08)
        noise_c = random.gauss(0.0, 0.08)

        self.sensor_a = round(self.temperature + noise_a + 0.1, 2)
        self.sensor_c = round(self.temperature + noise_c - 0.1, 2)

        self.sensor_b_fault = inject_sensor_fault
        if inject_sensor_fault:
            # Simulate a stuck/spiking anomalous sensor
            self.sensor_b = round(38.5 + random.gauss(0.0, 0.25), 2)
        else:
            self.sensor_b = round(self.temperature + noise_b, 2)

        # Update history
        self.history.append(self.temperature)
        if len(self.history) > 30:
            self.history.pop(0)

        # Rate of rise: average change over last 5 ticks
        if len(self.history) >= 5:
            rate_of_rise = round((self.history[-1] - self.history[-5]) / 5.0, 3)
        else:
            rate_of_rise = 0.0

        return {
            "rack_id": self.rack_id,
            "temperature": self.temperature,
            "inlet_temp": self.inlet_temp,
            "outlet_temp": outlet_temp,
            "sensor_a": self.sensor_a,
            "sensor_b": self.sensor_b,
            "sensor_c": self.sensor_c,
            "sensor_b_fault": self.sensor_b_fault,
            "humidity": self.humidity,
            "cpu_usage": round(cpu, 1),
            "gpu_usage": round(gpu, 1),
            "power": round(power, 1),
            "cooling_watts": round(cooling_watts, 1),
            "fan_speed": round(fan, 1),
            "airflow": round(air * 100.0, 1),
            "cooling_capacity": round(cap * 100.0, 1),
            "ambient_temp": round(self.ambient_temp, 1),
            "rate_of_rise": rate_of_rise,
        }

    def reset(self, temp: float = 24.0):
        self.temperature = temp
        self.humidity = 48.0
        self.history = [temp] * 10
        self.sensor_a = temp
        self.sensor_b = temp
        self.sensor_c = temp
        self.sensor_b_fault = False
